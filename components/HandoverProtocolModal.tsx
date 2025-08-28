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
  const signaturePadRef = useRef<{ getSignatureData: () => string | null }>(null);
  
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
    const mileageNumber = parseInt(mileage, 10);
    const signatureData = signaturePadRef.current?.getSignatureData();

    if (isNaN(mileageNumber) || mileageNumber <= 0) {
      setError('Zadejte platný stav kilometrů.');
      return;
    }
    if (type === 'return' && rental.startMileage && mileageNumber < rental.startMileage) {
      setError('Konečný stav kilometrů nemůže být nižší než počáteční.');
      return;
    }
    if (!signatureData || !isSigned) {
      setError('Protokol musí být podepsán zákazníkem.');
      return;
    }

    addHandoverProtocol(rental.id, type, {
      mileage: mileageNumber,
      fuelLevel,
      notes,
      photoFiles: photos,
      signature: signatureData,
    }, { billingOption });
    onClose();
  };
  
  const isEarlyReturn = type === 'return' && new Date() < new Date(rental.endDate);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg border grid grid-cols-2 gap-4">
          <div><p><strong>Zákazník:</strong></p><p className="font-medium">{customer?.fullName}</p></div>
          <div><p><strong>Vozidlo:</strong></p><p className="font-medium">{vehicle?.make} {vehicle?.model}</p></div>
        </div>
        
        {isEarlyReturn && (
            <div className="p-3 text-center bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800">
                Upozornění: Vozidlo je vraceno dříve. Čas ukončení pronájmu bude aktualizován.
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">Stav tachometru (km)</label>
            <input id="mileage" type="number" value={mileage} onChange={e => { setMileage(e.target.value); setError(''); }} placeholder={type === 'return' ? `Původně: ${rental.startMileage || 'N/A'}` : ''} required className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label htmlFor="fuelLevel" className="block text-sm font-medium text-gray-700 mb-1">Stav paliva</label>
            <select id="fuelLevel" value={fuelLevel} onChange={e => setFuelLevel(Number(e.target.value))} className="w-full p-2 border rounded-md bg-white">
              <option value={1}>Plná nádrž</option>
              <option value={0.75}>3/4 nádrže</option>
              <option value={0.5}>1/2 nádrže</option>
              <option value={0.25}>1/4 nádrže</option>
              <option value={0}>Prázdná nádrž</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Fotodokumentace (volitelné)</label>
          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} capture="environment" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {photoPreviews.map((photo, index) => <img key={index} src={photo} className="w-full h-24 object-cover rounded-md" alt={`Photo preview ${index+1}`} />)}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Poznámky</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-2 border rounded-md mt-1"></textarea>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Podpis zákazníka</label>
            <SignaturePad ref={signaturePadRef} onDraw={() => setIsSigned(true)} onClear={() => setIsSigned(false)} />
        </div>

        {type === 'return' && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <label className="block text-md font-semibold text-gray-700 mb-3">Možnosti fakturace</label>
                <div className="space-y-2">
                    <div onClick={() => setBillingOption('paid')} className={`flex items-center p-3 border rounded-lg cursor-pointer ${billingOption === 'paid' ? 'bg-green-100 border-green-400 ring-2 ring-green-300' : 'bg-white hover:bg-gray-100'}`}>
                        <input type="radio" name="billingOption" id="paid" checked={billingOption === 'paid'} readOnly className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500" />
                        <label htmlFor="paid" className="ml-3 block text-sm font-medium text-gray-900">
                           Zaplaceno na místě <span className="text-gray-500 font-normal">(Vytvoří a uhradí fakturu)</span>
                        </label>
                    </div>
                     <div onClick={() => setBillingOption('transfer')} className={`flex items-center p-3 border rounded-lg cursor-pointer ${billingOption === 'transfer' ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300' : 'bg-white hover:bg-gray-100'}`}>
                        <input type="radio" name="billingOption" id="transfer" checked={billingOption === 'transfer'} readOnly className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                        <label htmlFor="transfer" className="ml-3 block text-sm font-medium text-gray-900">
                           Vystavit fakturu (převodem) <span className="text-gray-500 font-normal">(Splatnost 14 dní)</span>
                        </label>
                    </div>
                     <div onClick={() => setBillingOption('none')} className={`flex items-center p-3 border rounded-lg cursor-pointer ${billingOption === 'none' ? 'bg-gray-200 border-gray-400 ring-2 ring-gray-300' : 'bg-white hover:bg-gray-100'}`}>
                        <input type="radio" name="billingOption" id="none" checked={billingOption === 'none'} readOnly className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500" />
                        <label htmlFor="none" className="ml-3 block text-sm font-medium text-gray-900">
                           Nevytvářet fakturu
                        </label>
                    </div>
                </div>
            </div>
        )}

        {error && <p className="text-red-600 font-semibold text-center">{error}</p>}
        
        <div className="flex justify-end pt-4">
          <button type="submit" className="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700">
            {type === 'pickup' ? 'Potvrdit převzetí' : 'Potvrdit vrácení'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default HandoverProtocolModal;