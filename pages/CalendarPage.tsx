import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useDataContext';
import CreateRentalWizard from '../components/CreateRentalWizard';

const CalendarPage: React.FC = () => {
  const { vehicles, rentals } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
  const [isWizardOpen, setWizardOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon
  const startOffset = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); // Make Monday first

  const getAvailabilityForDay = (day: number) => {
    const checkDate = new Date(year, month, day);
    const rentedVehicles = new Set();
    
    rentals.forEach(r => {
      const startDate = new Date(r.startDate);
      const endDate = new Date(r.endDate);
      startDate.setHours(0,0,0,0);
      endDate.setHours(23,59,59,999);
      if (checkDate >= startDate && checkDate <= endDate) {
        rentedVehicles.add(r.vehicleId);
      }
    });

    const rentedCount = rentedVehicles.size;
    if (rentedCount === 0) return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (rentedCount === vehicles.length) return 'bg-red-100 text-red-800 hover:bg-red-200';
    return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    if (!selectedRange.start || selectedRange.end) {
      setSelectedRange({ start: clickedDate, end: null });
    } else {
      if (clickedDate < selectedRange.start) {
        setSelectedRange({ start: clickedDate, end: selectedRange.start });
      } else {
        setSelectedRange({ ...selectedRange, end: clickedDate });
      }
    }
  };
  
  const isDateInRange = (day: number) => {
    if (!selectedRange.start) return false;
    const checkDate = new Date(year, month, day);
    if(selectedRange.end) {
      return checkDate >= selectedRange.start && checkDate <= selectedRange.end;
    }
    return checkDate.getTime() === selectedRange.start.getTime();
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    setSelectedRange({ start: null, end: null });
  };
  
  const formattedRange = useMemo(() => {
    if (!selectedRange.start) return '';
    const start = selectedRange.start.toLocaleDateString('cs-CZ');
    if (!selectedRange.end) return start;
    const end = selectedRange.end.toLocaleDateString('cs-CZ');
    return `${start} - ${end}`;
  }, [selectedRange]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800">Kalendář dostupnosti</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200">&lt;</button>
          <span className="text-xl font-semibold w-48 text-center">
            {currentDate.toLocaleString('cs-CZ', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200">&gt;</button>
        </div>
      </div>
      
      {selectedRange.start && (
        <div className="flex justify-center items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
           <span className="font-semibold text-blue-800">Vybrané období: {formattedRange}</span>
           <button 
             onClick={() => setWizardOpen(true)}
             className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">
             Vytvořit pronájem
           </button>
           <button onClick={() => setSelectedRange({start: null, end: null})} className="text-sm text-gray-600 hover:underline">Vymazat výběr</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600 mb-2">
            <div>Po</div><div>Út</div><div>St</div><div>Čt</div><div>Pá</div><div>So</div><div>Ne</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`}></div>)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const inRange = isDateInRange(day);
            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`p-2 h-20 text-right cursor-pointer rounded-lg transition-all duration-200 
                  ${getAvailabilityForDay(day)}
                  ${inRange ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                `}>
                <span className="font-bold">{day}</span>
              </div>
            )
          })}
        </div>
      </div>
      
      {isWizardOpen && (
        <CreateRentalWizard
          isOpen={isWizardOpen}
          onClose={() => setWizardOpen(false)}
          initialStartDate={selectedRange.start}
          initialEndDate={selectedRange.end}
        />
      )}
    </div>
  );
};

export default CalendarPage;