import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useDataContext';
import CreateRentalWizard from '../components/CreateRentalWizard';
import HandoverProtocolModal from '../components/HandoverProtocolModal';
import ViewProtocolsModal from '../components/ViewProtocolsModal';
import { ProtocolIcon, RentalsIcon } from '../components/Icons';
import type { Rental } from '../types';

const RentalsPage: React.FC = () => {
  const { rentals, customers, vehicles } = useData();
  const [isWizardOpen, setWizardOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');

  const [protocolModalState, setProtocolModalState] = useState<{
    isOpen: boolean;
    type: 'pickup' | 'return';
    rental: Rental | null;
  }>({ isOpen: false, type: 'pickup', rental: null });

  const [viewProtocolsModalState, setViewProtocolsModalState] = useState<{
    isOpen: boolean;
    rental: Rental | null;
  }>({ isOpen: false, rental: null });

  const openProtocolModal = (rental: Rental, type: 'pickup' | 'return') => {
    setProtocolModalState({ isOpen: true, type, rental });
  };
  
  const openViewProtocolsModal = (rental: Rental) => {
    setViewProtocolsModalState({ isOpen: true, rental });
  };

  const getStatusChip = (status: 'active' | 'upcoming' | 'completed') => {
    switch (status) {
      case 'active':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Aktivní</span>;
      case 'upcoming':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Nadcházející</span>;
      case 'completed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Dokončený</span>;
    }
  };
  
  const formatRentalPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const dateOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const startDateFormat = startDate.toLocaleDateString('cs-CZ', dateOptions);
    const startTimeFormat = startDate.toLocaleTimeString('cs-CZ', timeOptions);
    const endDateFormat = endDate.toLocaleDateString('cs-CZ', dateOptions);
    const endTimeFormat = endDate.toLocaleTimeString('cs-CZ', timeOptions);
    
    if (startDateFormat === endDateFormat) {
      return (
        <div>
          <div className="font-medium text-gray-800">{startDateFormat}</div>
          <div className="text-xs text-gray-500">{`${startTimeFormat} - ${endTimeFormat}`}</div>
        </div>
      );
    }
    
    return `${startDateFormat}, ${startTimeFormat} - ${endDateFormat}, ${endTimeFormat}`;
  };

  const renderActions = (rental: Rental) => {
    switch (rental.status) {
      case 'upcoming':
        return <button onClick={() => openProtocolModal(rental, 'pickup')} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700">
          <ProtocolIcon className="w-4 h-4" /> Vytvořit předávací protokol
        </button>
      case 'active':
        return <button onClick={() => openProtocolModal(rental, 'return')} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700">
          <ProtocolIcon className="w-4 h-4" /> Vytvořit vracící protokol
        </button>
      case 'completed':
         if(rental.pickupProtocol && rental.returnProtocol) {
            return <button onClick={() => openViewProtocolsModal(rental)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200">
              <ProtocolIcon className="w-4 h-4" /> Zobrazit protokoly
            </button>
         }
         return <span className="text-gray-400 text-sm">Archivováno</span>
      default:
        return null;
    }
  };
  
  const filteredRentals = useMemo(() => {
    if (filter === 'all') return rentals;
    return rentals.filter(r => r.status === filter);
  }, [rentals, filter]);

  const FilterButton: React.FC<{
    filterName: 'all' | 'upcoming' | 'active' | 'completed';
    children: React.ReactNode;
  }> = ({ filterName, children }) => {
    const isActive = filter === filterName;
    return (
      <button
        onClick={() => setFilter(filterName)}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
          isActive ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800">Správa pronájmů</h1>
        <button onClick={() => setWizardOpen(true)} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors">
          + Vytvořit smlouvu
        </button>
      </div>

      <div className="flex items-center gap-3">
        <FilterButton filterName="all">Všechny</FilterButton>
        <FilterButton filterName="upcoming">Nadcházející</FilterButton>
        <FilterButton filterName="active">Aktivní</FilterButton>
        <FilterButton filterName="completed">Dokončené</FilterButton>
      </div>
      
      {filteredRentals.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zákazník</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vozidlo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Období pronájmu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cena</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akce</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRentals.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(rental => {
                const customer = customers.find(c => c.id === rental.customerId);
                const vehicle = vehicles.find(v => v.id === rental.vehicleId);

                return (
                  <tr key={rental.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer?.fullName || '[Zákazník smazán]'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vehicle ? `${vehicle.make} ${vehicle.model}` : '[Vozidlo smazáno]'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatRentalPeriod(rental.startDate, rental.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">
                      {rental.totalPrice.toLocaleString('cs-CZ')} Kč
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusChip(rental.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderActions(rental)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
            <RentalsIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-800">Nebyly nalezeny žádné pronájmy</h3>
            <p className="mt-2 text-gray-500">Pro aktuální filtr neexistují žádné záznamy. Zkuste vytvořit nový pronájem.</p>
            <div className="mt-6">
                <button onClick={() => setWizardOpen(true)} className="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
                    + Vytvořit první pronájem
                </button>
            </div>
        </div>
      )}

      {isWizardOpen && <CreateRentalWizard isOpen={isWizardOpen} onClose={() => setWizardOpen(false)} />}
      
      {protocolModalState.isOpen && protocolModalState.rental && (
        <HandoverProtocolModal 
          isOpen={protocolModalState.isOpen}
          onClose={() => setProtocolModalState({isOpen: false, type: 'pickup', rental: null})}
          rental={protocolModalState.rental}
          type={protocolModalState.type}
        />
      )}

      {viewProtocolsModalState.isOpen && viewProtocolsModalState.rental && (
        <ViewProtocolsModal 
          isOpen={viewProtocolsModalState.isOpen}
          onClose={() => setViewProtocolsModalState({isOpen: false, rental: null})}
          rental={viewProtocolsModalState.rental}
        />
      )}
    </div>
  );
};

export default RentalsPage;