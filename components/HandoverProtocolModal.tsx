import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { useData } from '../hooks/useDataContext';
import type { Rental } from '../types';
import SignaturePad from './SignaturePad';

interface HandoverProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental;
  type: 'pickup' | 'return';
}

const HandoverProtocolModal: React.FC<HandoverProtocolModalProps> = ({ isOpen, onClose, rental, type }) => {
  const { addHandoverProtocol, customers, vehicles } = useData();
  const signaturePadRef = useRef<{ getSignatureData: () => string | null; clear: () => void; }>(null);
  
  const [mileage, setMileage] = useState('');
  const [fuelLevel, setFuelLevel] = useState(1);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSigned, setIsSigned] = useState(false);
  const [billingOption, setBillingOption] = useState<'none' | 'paid' | 'transfer'>('none');
  const [error, setError] = useState('');

  useEffect(() => {
    // Cleanup object URLs to prevent memory leaks
    return () => {
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  const customer = customers.find(c => c.id === rental.customerId);
  const vehicle = vehicles.find(v => v.id === rental.vehicleId);
  const title = type === 'pickup' ? 'Předávací protokol' : 'Vracící protokol';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...filesArray]);
      
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setPhotoPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const mileageNumber = parseInt(mileage, 10);
    if (isNaN(mileageNumber) || mileageNumber <= 0) {
      setError('Zadejte platný stav kilometrů.');
      return;
    }

    if (type === 'return' && rental.startMileage && mileageNumber < rental.startMileage) {
      setError(`Stav tachometru při vrácení (${mileageNumber} km) nemůže být nižší než při převzetí (${rental.startMileage} km).`);
      return;
    }
    
    const signatureData = signaturePadRef.current?.getSignatureData();
    if (!signatureData) {
      setError('Podpis zákazníka je povinný.');
      return;
    }
    
    addHandoverProtocol(
      rental.id,
      type,
      {
        mileage: mileageNumber,
        fuelLevel,
        notes,
        photoFiles: photos,
        signature: signatureData
      },
      { billingOption }
    );
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg border text-sm">
            <p><strong>Zákazník:</strong> {customer?.fullName || 'N/A'}</p>
            <p><strong>Vozidlo:</strong> {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : 'N/A'}</p>
            {type === 'return' && rental.startMileage && <p><strong>Stav km při převzetí:</strong> {rental.startMileage.toLocaleString('cs-CZ')} km</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">Aktuální stav tachometru (km)</label>
                <input id="mileage" type="number" value={mileage} onChange={e => setMileage(e.target.value)} required className="w-full p-2 border rounded-md mt-1"/>
            </div>
            <div>
                <label htmlFor="fuelLevel" className="block text-sm font-medium text-gray-700">Stav paliva</label>
                <select id="fuelLevel" value={fuelLevel} onChange={e => setFuelLevel(Number(e.target.value))} className="w-full p-2 border rounded-md mt-1 bg-white">
                    <option value={1}>Plná (1/1)</option>
                    <option value={0.75}>Tři čtvrtiny (3/4)</option>
                    <option value={0.5}>Polovina (1/2)</option>
                    <option value={0.25}>Čtvrtina (1/4)</option>
                    <option value={0}>Prázdná (0/1)</option>
                </select>
            </div>
        </div>

        <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Poznámky (např. poškození)</label>
            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-2 border rounded-md mt-1"></textarea>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">Fotodokumentace</label>
            <input type="file" multiple onChange={handlePhotoUpload} accept="image/*" capture="environment" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mt-1"/>
            <div className="mt-2 grid grid-cols-3 gap-2">
                {photoPreviews.map((src, index) => <img key={index} src={src} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md"/>)}
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Podpis zákazníka</p>
            <div className="border rounded-md h-32">
                <SignaturePad ref={signaturePadRef} onDraw={() => setIsSigned(true)} onClear={() => setIsSigned(false)} />
            </div>
        </div>
        
        {type === 'return' && (
            <div>
                <h3 className="text-md font-medium text-gray-700 border-t pt-4">Fakturace</h3>
                <div className="flex gap-4 mt-2">
                    <label className="flex items-center"><input type="radio" name="billing" value="none" checked={billingOption === 'none'} onChange={() => setBillingOption('none')} className="mr-2"/> Nevytvářet</label>
                    <label className="flex items-center"><input type="radio" name="billing" value="paid" checked={billingOption === 'paid'} onChange={() => setBillingOption('paid')} className="mr-2"/> Zaplaceno na místě</label>
                    <label className="flex items-center"><input type="radio" name="billing" value="transfer" checked={billingOption === 'transfer'} onChange={() => setBillingOption('transfer')} className="mr-2"/> Vystavit fakturu (převodem)</label>
                </div>
            </div>
        )}

        {error && <p className="text-red-500 font-semibold">{error}</p>}
        
        <div className="flex justify-end pt-4 border-t">
            <button type="submit" disabled={!isSigned} className="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400">
                Uložit protokol a {type === 'pickup' ? 'zahájit pronájem' : 'dokončit pronájem'}
            </button>
        </div>
      </form>
    </Modal>
  );
};

export default HandoverProtocolModal;
