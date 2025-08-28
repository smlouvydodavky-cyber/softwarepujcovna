import React, { useState } from 'react';
import Modal from './Modal';
import { useData } from '../hooks/useDataContext';
import type { Rental } from '../types';

interface QuickHandoverModalProps {
  rental: Rental;
  onClose: () => void;
}

const QuickHandoverModal: React.FC<QuickHandoverModalProps> = ({ rental, onClose }) => {
  const { startRental, customers, vehicles } = useData();
  const [mileage, setMileage] = useState('');
  const [error, setError] = useState('');

  const customer = customers.find(c => c.id === rental.customerId);
  const vehicle = vehicles.find(v => v.id === rental.vehicleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mileageNumber = parseInt(mileage, 10);
    if (isNaN(mileageNumber) || mileageNumber <= 0) {
      setError('Zadejte platný stav kilometrů.');
      return;
    }
    
    startRental(rental.id, mileageNumber);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Rychlé převzetí vozidla">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg border">
          <p><strong>Zákazník:</strong> <span className="font-medium">{customer?.fullName}</span></p>
          <p><strong>Vozidlo:</strong> <span className="font-medium">{vehicle?.make} {vehicle?.model} ({vehicle?.licensePlate})</span></p>
        </div>
        
        <div>
          <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">
            Zadejte aktuální stav tachometru (km)
          </label>
          <input
            id="mileage"
            type="number"
            value={mileage}
            onChange={(e) => {
              setMileage(e.target.value);
              setError('');
            }}
            placeholder="např. 123456"
            required
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            className="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors"
          >
            Potvrdit převzetí a zahájit pronájem
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default QuickHandoverModal;