import React, { useState } from 'react';
import { useData } from '../hooks/useDataContext';
import type { Rental } from '../types';
import Modal from '../components/Modal';

const ContractsPage: React.FC = () => {
    const { rentals, customers, vehicles } = useData();
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

    const rentalsWithContracts = rentals.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-800">Archiv Smluv</h1>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Smlouva ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zákazník</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vozidlo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum Pronájmu</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akce</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rentalsWithContracts.map(rental => {
                            const customer = customers.find(c => c.id === rental.customerId);
                            const vehicle = vehicles.find(v => v.id === rental.vehicleId);

                            return (
                                <tr key={rental.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{`SML-${rental.id.toUpperCase()}`}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer?.fullName || '[Zákazník smazán]'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vehicle ? `${vehicle.make} ${vehicle.model}` : '[Vozidlo smazáno]'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(rental.startDate).toLocaleDateString('cs-CZ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => setSelectedRental(rental)} className="text-blue-600 hover:text-blue-900">Zobrazit Smlouvu</button>
                                    </td>
                                </tr>
                            );
                        })}
                         {rentalsWithContracts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-gray-500">
                                    Nebyly nalezeny žádné archivované smlouvy.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedRental && (
                <Modal isOpen={!!selectedRental} onClose={() => setSelectedRental(null)} title={`Detail Smlouvy SML-${selectedRental.id.toUpperCase()}`}>
                   <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedRental.contractDetails || '' }} />
                </Modal>
            )}
        </div>
    );
};

export default ContractsPage;