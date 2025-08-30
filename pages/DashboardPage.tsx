
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../hooks/useDataContext';
import { Link } from 'react-router-dom';
import type { Rental, PreRegistration, Customer } from '../types';
import CreateRentalWizard from '../components/CreateRentalWizard';
import QuickHandoverModal from '../components/QuickHandoverModal';
import { WarningIcon, DocumentTextIcon } from '../components/Icons';
import PreRegistrationDetailModal from '../components/PreRegistrationDetailModal';

const StatCard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => (
  <div className={`p-6 rounded-xl shadow-lg ${color}`}>
    <p className="text-sm text-white/80">{title}</p>
    <p className="text-3xl font-bold text-white">{value}</p>
  </div>
);

const calculateTimeDetails = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();
    let progressPercentage = totalDuration > 0 ? (elapsedDuration / totalDuration) * 100 : 0;
    progressPercentage = Math.max(0, Math.min(100, progressPercentage));

    if (diff <= 0) {
        const overdueDiff = now.getTime() - end.getTime();
        const overdueHours = Math.floor(overdueDiff / (1000 * 60 * 60));
        const overdueMinutes = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
        let overdueText = 'Zpožděno o ';
        if (overdueHours > 0) overdueText += `${overdueHours}h `;
        overdueText += `${overdueMinutes}m`;
        return { text: overdueText, urgent: true, isOverdue: true, progressPercentage: 100 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let text = 'Zbývá ';
    if (days > 0) text += `${days}d `;
    if (hours > 0) text += `${hours}h `;
    text += `${minutes}m`;
    
    const urgent = diff < 1000 * 60 * 60 * 3; // Urgent if less than 3 hours remaining

    return { text, urgent, isOverdue: false, progressPercentage };
};


const ActiveRentalCard: React.FC<{ rental: Rental }> = ({ rental }) => {
  const { customers, vehicles } = useData();
  const customer = customers.find(c => c.id === rental.customerId);
  const vehicle = vehicles.find(v => v.id === rental.vehicleId);
  const [timeDetails, setTimeDetails] = useState(calculateTimeDetails(rental.startDate, rental.endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeDetails(calculateTimeDetails(rental.startDate, rental.endDate));
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [rental.startDate, rental.endDate]);

  const progressBarColor = timeDetails.isOverdue ? 'bg-red-500' : timeDetails.urgent ? 'bg-yellow-400' : 'bg-blue-500';
  const cardBorderColor = timeDetails.isOverdue ? 'border-red-400' : timeDetails.urgent ? 'border-yellow-400' : 'border-transparent';

  return (
    <div className={`p-5 rounded-xl shadow-lg bg-white border-2 ${cardBorderColor} transition-all duration-300 flex flex-col justify-between`}>
      <div>
        <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-lg text-gray-800">{vehicle ? `${vehicle.make} ${vehicle.model}` : '[Vozidlo smazáno]'}</p>
              <p className="text-sm text-gray-500">{vehicle?.licensePlate}</p>
            </div>
            <div className={`text-right font-semibold text-sm ${timeDetails.isOverdue ? 'text-red-600' : timeDetails.urgent ? 'text-yellow-600' : 'text-gray-600'}`}>
                {timeDetails.text}
            </div>
        </div>
        <div className="mt-3">
          <p className="text-sm text-gray-600">Zákazník: <span className="font-medium text-gray-800">{customer?.fullName || '[Zákazník smazán]'}</span></p>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className={`${progressBarColor} h-2.5 rounded-full transition-all duration-500`} style={{width: `${timeDetails.progressPercentage}%`}}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{new Date(rental.startDate).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="font-semibold">
             Vrácení: {new Date(rental.endDate).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};


const DashboardPage: React.FC = () => {
  const { rentals, vehicles, customers, invoices, preRegistrations } = useData();
  const [isWizardOpen, setWizardOpen] = useState(false);
  const [quickHandoverRental, setQuickHandoverRental] = useState<Rental | null>(null);
  {/* FIX: Correctly type prefilledData customer to Omit 'created_at' as it's not present in pre-registration data. */}
  const [prefilledData, setPrefilledData] = useState<{customer: Omit<Customer, 'id' | 'created_at'>, preRegistrationId: string} | null>(null);
  const [viewingPreReg, setViewingPreReg] = useState<PreRegistration | null>(null);
  
  const activeRentals = rentals
    .filter(r => r.status === 'active')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    
  const upcomingRentals = rentals
    .filter(r => r.status === 'upcoming')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
  const submittedPreRegistrations = preRegistrations.filter(pr => pr.status === 'submitted');
    
  const availableVehicles = vehicles.length - activeRentals.length;
  
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  const importantAlerts = useMemo(() => {
    const alerts = [];
    const now = new Date();
    
    const overdueInvoices = invoices.filter(i => i.status === 'unpaid' && new Date(i.dueDate) < now);
    if (overdueInvoices.length > 0) {
      alerts.push({
        type: 'invoice',
        message: `Máte ${overdueInvoices.length} ${overdueInvoices.length === 1 ? 'fakturu' : overdueInvoices.length < 5 ? 'faktury' : 'faktur'} po splatnosti.`,
        link: '/finances'
      });
    }

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    const upcomingStk = vehicles.filter(v => {
      const dueDate = new Date(v.stkDueDate);
      return dueDate > now && dueDate <= thirtyDaysFromNow;
    });
    if (upcomingStk.length > 0) {
      alerts.push({
        type: 'stk',
        message: `${upcomingStk.length} ${upcomingStk.length === 1 ? 'vozidlu' : upcomingStk.length < 5 ? 'vozidlům' : 'vozidlům'} se blíží termín STK.`,
        link: '/fleet'
      });
    }
    return alerts;
  }, [invoices, vehicles]);

  const handleCreateRentalFromPreRegistration = (preReg: PreRegistration) => {
    if (!preReg.customerData) return;
    setViewingPreReg(null); // Close the detail modal first
    setPrefilledData({ customer: preReg.customerData, preRegistrationId: preReg.id });
    setWizardOpen(true);
  };

  const onWizardClose = () => {
    setWizardOpen(false);
    setPrefilledData(null); // Clear prefilled data when wizard closes
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800">Nástěnka</h1>
        <button 
          onClick={() => setWizardOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
        >
          + Vytvořit nový pronájem
        </button>
      </div>
      
      {importantAlerts.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Důležitá upozornění</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {importantAlerts.map((alert, index) => (
              <Link to={alert.link} key={index} className="flex items-center p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-lg shadow-md hover:bg-yellow-200 transition-colors">
                <WarningIcon className="h-6 w-6 mr-3" />
                <span className="font-semibold">{alert.message}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Vozidel v pronájmu" value={activeRentals.length} color="bg-blue-500" />
        <StatCard title="Dostupných vozidel" value={availableVehicles} color="bg-green-500" />
        <StatCard title="Nadcházející pronájmy" value={upcomingRentals.length} color="bg-yellow-500" />
        <StatCard title="Nové poptávky" value={submittedPreRegistrations.length} color="bg-indigo-500" />
      </div>
      
      {submittedPreRegistrations.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Nové poptávky / Před-registrace</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
               <table className="min-w-full">
                <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Zákazník</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Datum odeslání</th>
                    <th className="px-6 py-3">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submittedPreRegistrations.map(preReg => (
                    <tr key={preReg.id} onClick={() => setViewingPreReg(preReg)} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{preReg.customerData?.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{preReg.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(preReg.created_at).toLocaleString('cs-CZ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                           onClick={(e) => { e.stopPropagation(); setViewingPreReg(preReg); }}
                           className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-lg shadow-sm hover:bg-indigo-200"
                        >
                           <DocumentTextIcon className="w-5 h-5"/>
                           Zkontrolovat údaje
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Nadcházející pronájmy</h2>
        {upcomingRentals.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Zákazník</th>
                  <th className="px-6 py-3">Vozidlo</th>
                  <th className="px-6 py-3">Začátek pronájmu</th>
                  <th className="px-6 py-3">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {upcomingRentals.map(rental => {
                  const customer = customers.find(c => c.id === rental.customerId);
                  const vehicle = vehicles.find(v => v.id === rental.vehicleId);
                  const rentalIsToday = isToday(rental.startDate);
                  return (
                    <tr key={rental.id} className={rentalIsToday ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer?.fullName || '[Zákazník smazán]'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vehicle ? `${vehicle.make} ${vehicle.model}`: '[Vozidlo smazáno]'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                         {rentalIsToday && <span className="font-bold text-yellow-700">DNES </span>}
                         {new Date(rental.startDate).toLocaleString('cs-CZ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                           onClick={() => setQuickHandoverRental(rental)}
                           className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                           Převzít vozidlo
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
            <p className="font-semibold text-lg">Vše je v klidu!</p>
            <p>Aktuálně nejsou žádné nadcházející pronájmy.</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Aktivní pronájmy</h2>
            <Link to="/rentals" className="text-blue-600 hover:underline font-medium">Zobrazit vše</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeRentals.length > 0 ? (
            activeRentals.map(rental => <ActiveRentalCard key={rental.id} rental={rental} />)
          ) : (
            <div className="col-span-full bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
                <p className="font-semibold text-lg">Všechna vozidla jsou na parkovišti.</p>
                <p>Momentálně neprobíhají žádné pronájmy.</p>
            </div>
          )}
        </div>
      </div>
      
      {isWizardOpen && <CreateRentalWizard isOpen={isWizardOpen} onClose={onWizardClose} prefilledData={prefilledData} />}
      {quickHandoverRental && (
        <QuickHandoverModal 
          rental={quickHandoverRental} 
          onClose={() => setQuickHandoverRental(null)} 
        />
      )}
      {viewingPreReg && (
        <PreRegistrationDetailModal
          isOpen={!!viewingPreReg}
          onClose={() => setViewingPreReg(null)}
          preRegistration={viewingPreReg}
          onConfirm={handleCreateRentalFromPreRegistration}
        />
      )}
    </div>
  );
};

export default DashboardPage;
