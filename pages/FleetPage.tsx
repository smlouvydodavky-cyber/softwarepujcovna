
import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useDataContext';
import Modal from '../components/Modal';
import type { Vehicle } from '../types';
import { FleetIcon } from '../components/Icons';
import { VEHICLE_MODELS } from '../constants';

// Define types for make and model based on the constant
type VehicleMake = keyof typeof VEHICLE_MODELS;
const vehicleMakes = Object.keys(VEHICLE_MODELS) as VehicleMake[];

{/* FIX: Omit 'created_at' from the vehicle type for the onAdd prop, as this field is not provided when creating a new vehicle. */}
const AddVehicleForm: React.FC<{ onAdd: (vehicle: Omit<Vehicle, 'id' | 'serviceHistory' | 'pricing' | 'created_at'>) => void; onClose: () => void; }> = ({ onAdd, onClose }) => {
  const [make, setMake] = useState<VehicleMake>(vehicleMakes[0]);
  const [model, setModel] = useState(VEHICLE_MODELS[make][0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [stkDueDate, setStkDueDate] = useState('');
  const [error, setError] = useState('');

  // Update model options when make changes
  useEffect(() => {
    setModel(VEHICLE_MODELS[make][0]);
  }, [make]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!year || year < 1990 || year > new Date().getFullYear() + 1) {
      setError('Zadejte prosím platný rok výroby.');
      return;
    }
    setError('');

    onAdd({
      make,
      model: model as Vehicle['model'], // Assert type after dynamic selection
      licensePlate,
      year,
      vin,
      stkDueDate
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="make" className="block text-sm font-medium text-gray-700">Značka</label>
          <select id="make" name="make" value={make} onChange={e => setMake(e.target.value as VehicleMake)} required className="w-full p-2 border rounded-md bg-white">
            {vehicleMakes.map(makeOption => (
              <option key={makeOption} value={makeOption}>{makeOption}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model</label>
          <select id="model" name="model" value={model} onChange={e => setModel(e.target.value)} required className="w-full p-2 border rounded-md bg-white">
            {VEHICLE_MODELS[make].map(modelOption => (
              <option key={modelOption} value={modelOption}>{modelOption}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">SPZ</label>
          <input id="licensePlate" name="licensePlate" value={licensePlate} onChange={e => setLicensePlate(e.target.value)} placeholder="např. 1AB 2345" required className="p-2 border rounded-md w-full" />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">Rok výroby</label>
          <input id="year" name="year" type="number" value={year} onChange={e => setYear(parseInt(e.target.value, 10) || 0)} placeholder="např. 2022" required className="p-2 border rounded-md w-full" />
        </div>
        <div>
          <label htmlFor="vin" className="block text-sm font-medium text-gray-700">VIN</label>
          <input id="vin" name="vin" value={vin} onChange={e => setVin(e.target.value)} placeholder="VIN kód" required className="p-2 border rounded-md w-full" />
        </div>
        <div>
          <label htmlFor="stkDueDate" className="block text-sm font-medium text-gray-700">Datum příští STK</label>
          <input id="stkDueDate" name="stkDueDate" type="date" value={stkDueDate} onChange={e => setStkDueDate(e.target.value)} required className="p-2 border rounded-md w-full" />
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end pt-4">
        <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Uložit vozidlo</button>
      </div>
    </form>
  )
}


const FleetPage: React.FC = () => {
  const { vehicles, rentals, addVehicle, addServiceRecord, updateVehicle } = useData();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const getVehicleStatus = (vehicleId: string): { text: string; color: string } => {
    const isActiveRental = rentals.some(r => r.vehicleId === vehicleId && r.status === 'active');
    if (isActiveRental) {
      return { text: 'V pronájmu', color: 'bg-red-100 text-red-800' };
    }
    return { text: 'Dostupné', color: 'bg-green-100 text-green-800' };
  };

  const handleAddServiceRecord = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    const formData = new FormData(e.currentTarget);
    const newRecord = {
        date: formData.get('date') as string,
        description: formData.get('description') as string,
        cost: Number(formData.get('cost'))
    };
    addServiceRecord(selectedVehicle.id, newRecord);
    
    const updatedVehicle = { ...selectedVehicle, serviceHistory: [...selectedVehicle.serviceHistory, {...newRecord, id: `s${selectedVehicle.serviceHistory.length + 1}`}]};
    setSelectedVehicle(updatedVehicle);
    e.currentTarget.reset();
  };
  
  const handlePriceUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingVehicle) return;
    const formData = new FormData(e.currentTarget);
    const updatedPricing = {
      hour4: Number(formData.get('price_hour4')),
      hour12: Number(formData.get('price_hour12')),
      day: Number(formData.get('price_day')),
    };
    const updatedVehicle = { ...editingVehicle, pricing: updatedPricing };
    updateVehicle(updatedVehicle);
    setSelectedVehicle(updatedVehicle);
    setEditingVehicle(null);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800">Vozový park</h1>
        <button onClick={() => setAddModalOpen(true)} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors">
          + Přidat vozidlo
        </button>
      </div>

      {vehicles.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vozidlo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cena / den</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STK do</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akce</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.map(vehicle => {
                const status = getVehicleStatus(vehicle.id);
                return (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{vehicle.make} {vehicle.model}</div>
                      <div className="text-sm text-gray-500">{vehicle.licensePlate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{vehicle.pricing.day.toLocaleString('cs-CZ')} Kč</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(vehicle.stkDueDate).toLocaleDateString('cs-CZ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => setSelectedVehicle(vehicle)} className="text-blue-600 hover:text-blue-900">Detail</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <FleetIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-xl font-semibold text-gray-800">Váš vozový park je prázdný</h3>
          <p className="mt-2 text-gray-500">Začněte tím, že přidáte své první vozidlo.</p>
          <div className="mt-6">
            <button onClick={() => setAddModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
              + Přidat první vozidlo
            </button>
          </div>
        </div>
      )}
      
      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Přidat nové vozidlo">
        <AddVehicleForm onAdd={addVehicle} onClose={() => setAddModalOpen(false)} />
      </Modal>

      {selectedVehicle && (
        <Modal isOpen={!!selectedVehicle} onClose={() => { setSelectedVehicle(null); setEditingVehicle(null); }} title={`Detail vozidla: ${selectedVehicle.make} ${selectedVehicle.model}`}>
            <div className="space-y-6">
                 <div>
                    <div className="flex justify-between items-center border-b pb-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">Ceník</h3>
                      <button onClick={() => setEditingVehicle(selectedVehicle)} className="text-sm text-blue-600 hover:underline">Upravit</button>
                    </div>
                    {editingVehicle?.id === selectedVehicle.id ? (
                      <form onSubmit={handlePriceUpdate} className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <label className="block">4 hodiny (Kč): <input type="number" name="price_hour4" defaultValue={selectedVehicle.pricing.hour4} className="w-full p-2 border rounded-md mt-1" /></label>
                          <label className="block">12 hodin (Kč): <input type="number" name="price_hour12" defaultValue={selectedVehicle.pricing.hour12} className="w-full p-2 border rounded-md mt-1" /></label>
                          <label className="block">Den (Kč): <input type="number" name="price_day" defaultValue={selectedVehicle.pricing.day} className="w-full p-2 border rounded-md mt-1" /></label>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setEditingVehicle(null)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg">Zrušit</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">Uložit ceny</button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div><p className="text-sm text-gray-500">4 hodiny</p><p className="font-semibold text-lg">{selectedVehicle.pricing.hour4.toLocaleString('cs-CZ')} Kč</p></div>
                        <div><p className="text-sm text-gray-500">12 hodin</p><p className="font-semibold text-lg">{selectedVehicle.pricing.hour12.toLocaleString('cs-CZ')} Kč</p></div>
                        <div><p className="text-sm text-gray-500">1 den</p><p className="font-semibold text-lg">{selectedVehicle.pricing.day.toLocaleString('cs-CZ')} Kč</p></div>
                      </div>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">Servisní historie</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {selectedVehicle.serviceHistory.length > 0 ? selectedVehicle.serviceHistory.map(r => (
                            <div key={r.id} className="bg-gray-50 p-2 rounded-md">
                                <p className="font-semibold">{new Date(r.date).toLocaleDateString('cs-CZ')} - {r.cost.toLocaleString('cs-CZ')} Kč</p>
                                <p className="text-sm text-gray-600">{r.description}</p>
                            </div>
                        )) : <p className="text-gray-500">Žádné servisní záznamy.</p>}
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">Přidat servisní záznam</h3>
                    <form onSubmit={handleAddServiceRecord} className="flex items-end gap-4">
                        <input name="date" type="date" required className="p-2 border rounded-md" defaultValue={new Date().toISOString().split('T')[0]}/>
                        <input name="description" placeholder="Popis servisu" required className="p-2 border rounded-md flex-1" />
                        <input name="cost" type="number" placeholder="Cena" required className="p-2 border rounded-md w-28" />
                        <button type="submit" className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">+</button>
                    </form>
                 </div>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default FleetPage;
