import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../hooks/useDataContext';
import Modal from '../components/Modal';
import type { Invoice, Rental } from '../types';
import { BUSINESS_INFO } from '../constants';
import InvoiceDetailModal from '../components/InvoiceDetailModal';

const FinancesPage: React.FC = () => {
  const { invoices, rentals, customers, addInvoice, vehicles, billingInfo, updateBillingInfo } = useData();
  const [activeTab, setActiveTab] = useState('performance');

  // Performance calculations - OPTIMIZED for stability and speed
  const vehiclePerformance = useMemo(() => {
    // Pre-calculate rentals by vehicle ID for efficiency, preventing multiple loops over the main rentals array.
    const rentalsByVehicle = rentals.reduce<Record<string, Rental[]>>((acc, rental) => {
      if (rental.status === 'completed' && rental.vehicleId) {
        if (!acc[rental.vehicleId]) {
          acc[rental.vehicleId] = [];
        }
        acc[rental.vehicleId].push(rental);
      }
      return acc;
    }, {});

    return vehicles.map(vehicle => {
      const vehicleRentals = rentalsByVehicle[vehicle.id] || [];
      const totalRevenue = vehicleRentals.reduce((sum, r) => sum + r.totalPrice, 0);
      const totalCosts = vehicle.serviceHistory.reduce((sum, s) => sum + s.cost, 0);
      const netProfit = totalRevenue - totalCosts;
      const totalKm = vehicleRentals.reduce((sum, r) => sum + ((r.endMileage || 0) - (r.startMileage || 0)), 0);
      const costPerKm = totalKm > 0 ? totalCosts / totalKm : 0;
      
      return {
        ...vehicle,
        totalRevenue,
        totalCosts,
        netProfit,
        totalKm,
        costPerKm,
      };
    });
  }, [vehicles, rentals]);

  const maxProfit = Math.max(...vehiclePerformance.map(v => v.netProfit), 0);

  // Invoicing state and logic
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const getStatusChip = (status: 'paid' | 'unpaid') => {
    switch (status) {
      case 'paid':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Zaplaceno</span>;
      case 'unpaid':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Nezaplaceno</span>;
    }
  };

  const handleCreateInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rentalId = formData.get('rentalId') as string;
    if (!rentalId) return;
    addInvoice(rentalId);
    setCreateModalOpen(false);
  };
  
  const invoicedRentalIds = invoices.map(i => i.rentalId);
  const unbilledRentals = rentals.filter(r => r.status === 'completed' && !invoicedRentalIds.includes(r.id));

  const TabButton: React.FC<{tabName: string; children: React.ReactNode}> = ({ tabName, children }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-lg font-semibold rounded-t-lg transition-colors ${
        activeTab === tabName
          ? 'border-b-4 border-blue-600 text-blue-600'
          : 'text-gray-500 hover:text-blue-500'
      }`}
    >
      {children}
    </button>
  )

  const BillingSettings = () => {
    const { billingInfo, updateBillingInfo } = useData();
    const [formData, setFormData] = useState(billingInfo);

    useEffect(() => {
        setFormData(billingInfo);
    }, [billingInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({...prev, [name]: value}));
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      updateBillingInfo(formData);
    }
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Nastavení fakturačních údajů firmy</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">Název firmy/provozovatel<input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md mt-1" /></label>
            <label className="block">Adresa<input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded-md mt-1" /></label>
            <label className="block">IČO<input type="text" name="ico" value={formData.ico} onChange={handleChange} className="w-full p-2 border rounded-md mt-1" /></label>
            <label className="block">Číslo bankovního účtu<input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleChange} className="w-full p-2 border rounded-md mt-1" /></label>
            <div className="flex justify-end pt-2">
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Uložit změny</button>
            </div>
        </form>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800">Finance</h1>
        {activeTab === 'invoicing' && (
          <button onClick={() => setCreateModalOpen(true)} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors">
            + Vytvořit fakturu
          </button>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <TabButton tabName="performance">Výkonnost vozidel</TabButton>
          <TabButton tabName="invoicing">Fakturace</TabButton>
          <TabButton tabName="settings">Nastavení fakturace</TabButton>
        </nav>
      </div>
      
      {activeTab === 'performance' && (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Čistý zisk vozidel</h3>
                <div className="flex items-end h-64 space-x-4">
                  {vehiclePerformance.map(v => (
                    <div key={v.id} className="flex-1 flex flex-col items-center" title={`Zisk: ${v.netProfit.toLocaleString('cs-CZ')} Kč`}>
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-500 ${v.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                        style={{ height: `${(v.netProfit / (maxProfit || 1)) * 100}%` }}
                      ></div>
                      <p className="text-xs text-center font-medium mt-2">{v.make} {v.model}</p>
                    </div>
                  ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vozidlo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Příjmy</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Náklady</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Čistý zisk</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Náklady/km</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {vehiclePerformance.map(v => (
                            <tr key={v.id}>
                                <td className="px-6 py-4 font-medium">{v.make} {v.model}</td>
                                <td className="px-6 py-4 text-green-600 font-semibold">{v.totalRevenue.toLocaleString('cs-CZ')} Kč</td>
                                <td className="px-6 py-4 text-red-600 font-semibold">{v.totalCosts.toLocaleString('cs-CZ')} Kč</td>
                                <td className={`px-6 py-4 font-bold ${v.netProfit >= 0 ? 'text-gray-800' : 'text-red-700'}`}>{v.netProfit.toLocaleString('cs-CZ')} Kč</td>
                                <td className="px-6 py-4 font-semibold">{v.costPerKm > 0 ? `${v.costPerKm.toFixed(2)} Kč` : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'invoicing' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faktura #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zákazník</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum vystavení</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Splatnost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Částka</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()).map(invoice => {
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => setSelectedInvoice(invoice)}>{invoice.id.toUpperCase()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.customer.name || '[Zákazník smazán]'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(invoice.issueDate).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(invoice.dueDate).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">
                      {invoice.amount.toLocaleString('cs-CZ')} Kč
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusChip(invoice.status)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'settings' && <BillingSettings />}


      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Vytvořit novou fakturu">
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <label htmlFor="rentalId" className="block text-sm font-medium text-gray-700">Vyberte dokončený pronájem k fakturaci</label>
            <select name="rentalId" id="rentalId" required className="w-full p-2 border rounded-md">
              <option value="">Vyberte pronájem...</option>
              {unbilledRentals.map(r => {
                const c = customers.find(c => c.id === r.customerId);
                const v = vehicles.find(v => v.id === r.vehicleId);
                return <option key={r.id} value={r.id}>{`Pronájem pro ${c?.fullName || 'N/A'} (${v?.make || 'N/A'} ${v?.model || ''}) - ${r.totalPrice.toLocaleString('cs-CZ')} Kč`}</option>
              })}
            </select>
             {unbilledRentals.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Neexistují žádné dokončené pronájmy k fakturaci.</p>}
            <div className="flex justify-end pt-4">
                <button type="submit" disabled={unbilledRentals.length === 0} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400">Vytvořit fakturu</button>
            </div>
          </form>
      </Modal>

      {selectedInvoice && (
        <InvoiceDetailModal
            isOpen={!!selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            invoice={selectedInvoice}
        />
      )}
    </div>
  );
};

export default FinancesPage;