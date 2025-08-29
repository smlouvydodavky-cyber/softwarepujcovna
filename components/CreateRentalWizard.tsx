import React, { useState, useMemo, useEffect, useRef } from 'react';
import Modal from './Modal';
import { useData } from '../hooks/useDataContext';
import type { Customer, Vehicle } from '../types';
import { BUSINESS_INFO } from '../constants';
import SignaturePad from './SignaturePad';

interface CreateRentalWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  prefilledData?: { customer: Omit<Customer, 'id'>; preRegistrationId: string } | null;
}

const toDatetimeLocal = (date: Date | null) => {
  if (!date) return '';
  // Adjust for timezone offset
  const tzoffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
  return localISOTime;
};

const CreateRentalWizard: React.FC<CreateRentalWizardProps> = ({ isOpen, onClose, initialStartDate, initialEndDate, prefilledData }) => {
  const { customers, vehicles, rentals, addCustomer, addRental, addNotification } = useData();
  const signaturePadRef = useRef<{ getSignatureData: () => string | null }>(null);

  const [step, setStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ fullName: '', email: '', phone: '', address: '', idNumber: '', drivingLicense: '' });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [startDate, setStartDate] = useState(toDatetimeLocal(initialStartDate || new Date()));
  const [endDate, setEndDate] = useState(toDatetimeLocal(initialEndDate));
  const [totalPrice, setTotalPrice] = useState(0);
  const [durationText, setDurationText] = useState('');
  
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [mailtoLink, setMailtoLink] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Reset state when modal is opened to ensure it's fresh
  useEffect(() => {
    const handlePrefilledData = async () => {
        if (prefilledData) {
            // Check if customer already exists
            const existingCustomer = customers.find(c => c.email.toLowerCase() === prefilledData.customer.email.toLowerCase());
            if (existingCustomer) {
                setSelectedCustomer(existingCustomer);
                setStep(2);
                return;
            }

            const newCustomer = await addCustomer(prefilledData.customer);
            if (newCustomer) {
                setSelectedCustomer(newCustomer);
                setStep(2); // Automatically move to vehicle selection
            }
        }
    };
    
    if (isOpen) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const defaultStart = initialStartDate || now;
      let defaultEnd = initialEndDate;
      if (!defaultEnd && initialStartDate) {
        defaultEnd = new Date(initialStartDate);
        defaultEnd.setDate(defaultEnd.getDate() + 1);
      }
      
      setStep(1);
      setSelectedCustomer(null);
      setNewCustomer({ fullName: '', email: '', phone: '', address: '', idNumber: '', drivingLicense: '' });
      setIsCreatingCustomer(false);
      setCustomerSearch('');
      setSelectedVehicle(null);
      setStartDate(toDatetimeLocal(defaultStart));
      setEndDate(toDatetimeLocal(defaultEnd));
      setTotalPrice(0);
      setDurationText('');
      setHasAgreed(false);
      setIsSigned(false);
      setMailtoLink('');
      setIsConfirmed(false);

      handlePrefilledData();
    }
  }, [isOpen, initialStartDate, initialEndDate, prefilledData, addCustomer, customers]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    return customers.filter(c => c.fullName.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customers, customerSearch]);

  const availableVehicles = useMemo(() => {
    if (!startDate || !endDate) return [];
    const requestedStart = new Date(startDate);
    const requestedEnd = new Date(endDate);

    if (requestedStart >= requestedEnd) return [];

    return vehicles.filter(vehicle => {
      const isOverlapping = rentals.some(rental => {
        if (rental.vehicleId !== vehicle.id) return false;
        if (rental.status === 'completed') return false;
        const rentalStart = new Date(rental.startDate);
        const rentalEnd = new Date(rental.endDate);
        return (requestedStart < rentalEnd && requestedEnd > rentalStart);
      });
      return !isOverlapping;
    });
  }, [vehicles, rentals, startDate, endDate]);

  useEffect(() => {
    if (!startDate || !endDate || !selectedVehicle) {
        setTotalPrice(0);
        setDurationText('');
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
        setTotalPrice(0);
        setDurationText('Neplatné období');
        return;
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);

    let calculatedPrice = 0;
    if (diffHours <= 4) {
        calculatedPrice = selectedVehicle.pricing.hour4;
    } else if (diffHours <= 12) {
        calculatedPrice = selectedVehicle.pricing.hour12;
    } else {
        calculatedPrice = diffDays * selectedVehicle.pricing.day;
    }
    setTotalPrice(calculatedPrice);

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    setDurationText(`Celková doba: ${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h` : ''}`);

  }, [startDate, endDate, selectedVehicle]);

  const handleNewCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const createdCustomer = await addCustomer(newCustomer);
    if (createdCustomer) {
      setSelectedCustomer(createdCustomer);
      setIsCreatingCustomer(false);
      setStep(2);
    }
  };
  
  const addTime = (hours: number, days: number = 0) => {
    if (!startDate) return;
    const start = new Date(startDate);
    start.setDate(start.getDate() + days);
    start.setHours(start.getHours() + hours);
    setEndDate(toDatetimeLocal(start));
  };

  const handleFinalSubmit = () => {
    if (!selectedCustomer || !selectedVehicle || !startDate || !endDate) return;
    const signatureData = signaturePadRef.current?.getSignatureData();
    if (!signatureData) {
        addNotification('Podpis se nepodařilo získat.', 'error');
        return;
    }

    const contractHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: auto; padding: 20px; border: 1px solid #eee;">
          <h1 style="text-align: center; color: #1a1a1a;">Smlouva o nájmu dopravního prostředku</h1>
          <h2 style="color: #0056b3;">1. Smluvní strany</h2>
          <p><strong>Pronajímatel:</strong><br>${BUSINESS_INFO.name}<br>${BUSINESS_INFO.address}<br>IČO: ${BUSINESS_INFO.ico}</p>
          <p><strong>Nájemce:</strong><br>${selectedCustomer.fullName}<br>${selectedCustomer.address}<br>Č. OP: ${selectedCustomer.idNumber}</p>
          <h2 style="color: #0056b3;">2. Předmět nájmu</h2>
          <p><strong>Vozidlo:</strong> ${selectedVehicle.make} ${selectedVehicle.model} (SPZ: ${selectedVehicle.licensePlate})</p>
          <p><strong>VIN:</strong> ${selectedVehicle.vin}</p>
          <h2 style="color: #0056b3;">3. Doba a cena nájmu</h2>
          <p><strong>Období:</strong> ${new Date(startDate).toLocaleString('cs-CZ')} - ${new Date(endDate).toLocaleString('cs-CZ')}</p>
          <p><strong>Celkové nájemné:</strong> ${totalPrice.toLocaleString('cs-CZ')} Kč</p>
          <h2 style="color: #0056b3;">4. Práva a povinnosti</h2>
          <p>Nájemce se zavazuje užívat vozidlo řádně a v souladu s technickými podmínkami a pokyny pronajímatele. Pronajímatel prohlašuje, že vozidlo je v technicky způsobilém stavu.</p>
          <h2 style="color: #0056b3;">5. Platební a další podmínky</h2>
          <p><strong>Vratná kauce:</strong> 5.000 Kč, skládá se při podpisu smlouvy. Kauce je vratná v plné výši při řádném vrácení nepoškozeného vozidla.</p>
          <p><strong>Spoluúčast:</strong> V případě pojistné události způsobené nájemcem je spoluúčast nájemce stanovena na 5.000 Kč až 10.000 Kč dle rozsahu poškození.</p>
          <h2 style="color: #0056b3;">6. Podpis a souhlas</h2>
          <p>Nájemce svým podpisem potvrzuje, že se seznámil s podmínkami smlouvy, souhlasí s nimi a vozidlo v řádném stavu převzal.</p>
          <img src="${signatureData}" alt="Podpis" style="height: 60px; margin-top: 10px; border-bottom: 1px solid #ccc;"/>
      </div>
    `;

    addRental({
      customerId: selectedCustomer.id,
      vehicleId: selectedVehicle.id,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      totalPrice,
      contractDetails: contractHtml,
    }, prefilledData?.preRegistrationId);
    
    const emailSubject = `Smlouva o pronájmu vozidla - ${selectedVehicle.make} ${selectedVehicle.model}`;
    const mailto = `mailto:${selectedCustomer.email},${BUSINESS_INFO.contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(contractHtml)}`;
    setMailtoLink(mailto);
    setIsConfirmed(true);
  };
  
  const renderStep = () => {
    switch (step) {
      case 1: // Customer selection
        if(prefilledData) return null; // Skip this step if data is prefilled
        return (
          <div>
            {!isCreatingCustomer ? (
              <>
                <input type="text" placeholder="Vyhledat zákazníka..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="w-full p-2 border rounded-md mb-4" />
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredCustomers.map(c => (
                    <div key={c.id} onClick={() => { setSelectedCustomer(c); setStep(2); }} className="p-3 border rounded-md cursor-pointer hover:bg-gray-100">
                      <p className="font-semibold">{c.fullName}</p>
                      <p className="text-sm text-gray-500">{c.email}</p>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <button onClick={() => setIsCreatingCustomer(true)} className="text-blue-600 hover:underline">... nebo vytvořit nového zákazníka</button>
                </div>
              </>
            ) : (
              <form onSubmit={handleNewCustomerSubmit} className="space-y-4">
                 <input value={newCustomer.fullName} onChange={e => setNewCustomer({...newCustomer, fullName: e.target.value})} placeholder="Jméno a příjmení" required className="w-full p-2 border rounded-md" />
                 <input value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} type="email" placeholder="Email" required className="w-full p-2 border rounded-md" />
                 <input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="Telefon" required className="w-full p-2 border rounded-md" />
                 <input value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} placeholder="Adresa" required className="w-full p-2 border rounded-md" />
                 <input value={newCustomer.idNumber} onChange={e => setNewCustomer({...newCustomer, idNumber: e.target.value})} placeholder="Číslo OP" required className="w-full p-2 border rounded-md" />
                 <input value={newCustomer.drivingLicense} onChange={e => setNewCustomer({...newCustomer, drivingLicense: e.target.value})} placeholder="Číslo ŘP" required className="w-full p-2 border rounded-md" />
                 <div className="flex justify-between">
                   <button type="button" onClick={() => setIsCreatingCustomer(false)} className="px-4 py-2 bg-gray-200 rounded-md">Zpět na výběr</button>
                   <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Vytvořit a vybrat</button>
                 </div>
              </form>
            )}
          </div>
        );
      case 2: // Vehicle & Date selection
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div><label>Začátek pronájmu:</label><input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-md" /></div>
                <div><label>Konec pronájmu:</label><input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-md" /></div>
            </div>
             <div className="flex gap-2">
                <button type="button" onClick={() => addTime(4)} className="px-3 py-1 bg-gray-200 rounded-md text-sm">+ 4h</button>
                <button type="button" onClick={() => addTime(12)} className="px-3 py-1 bg-gray-200 rounded-md text-sm">+ 12h</button>
                <button type="button" onClick={() => addTime(0, 1)} className="px-3 py-1 bg-gray-200 rounded-md text-sm">+ 1 den</button>
            </div>
            <h3 className="text-lg font-semibold pt-2">Dostupná vozidla pro vybrané období:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableVehicles.length > 0 ? availableVehicles.map(v => (
                <div key={v.id} onClick={() => setSelectedVehicle(v)} className={`p-3 border rounded-md cursor-pointer hover:bg-gray-100 ${selectedVehicle?.id === v.id ? 'bg-blue-100 border-blue-400' : ''}`}>
                  <p className="font-semibold">{v.make} {v.model} ({v.licensePlate})</p>
                  <p className="text-sm text-gray-500">Cena / den: {v.pricing.day.toLocaleString('cs-CZ')} Kč</p>
                </div>
              )) : <p className="text-gray-500">Pro vybrané období nejsou dostupná žádná vozidla.</p>}
            </div>
             <div className="flex justify-between items-center mt-4 pt-4 border-t">
               <button onClick={() => prefilledData ? onClose() : setStep(1)} className="px-4 py-2 bg-gray-200 rounded-md">
                {prefilledData ? 'Zrušit' : 'Zpět'}
               </button>
               <div>
                  <span className="font-semibold mr-4">{durationText} Cena: {totalPrice.toLocaleString('cs-CZ')} Kč</span>
                  <button onClick={() => setStep(3)} disabled={!selectedVehicle || totalPrice <= 0} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400">Pokračovat</button>
               </div>
            </div>
          </div>
        );
      case 3: // Summary & Signature
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Souhrn a podpis</h3>
            <div className="bg-gray-50 p-4 rounded-md border">
              <p><strong>Zákazník:</strong> {selectedCustomer?.fullName}</p>
              <p><strong>Vozidlo:</strong> {selectedVehicle?.make} {selectedVehicle?.model}</p>
              <p><strong>Období:</strong> {new Date(startDate).toLocaleString('cs-CZ')} - {new Date(endDate).toLocaleString('cs-CZ')}</p>
              <p><strong>Cena:</strong> {totalPrice.toLocaleString('cs-CZ')} Kč</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Podpis zákazníka</label>
              <SignaturePad ref={signaturePadRef} onDraw={() => setIsSigned(true)} onClear={() => setIsSigned(false)} />
            </div>
            <div className="flex items-center">
                <input type="checkbox" id="agree" checked={hasAgreed} onChange={e => setHasAgreed(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                <label htmlFor="agree" className="ml-2 block text-sm text-gray-900">Zákazník souhlasí s podmínkami smlouvy o pronájmu.</label>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
               <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-200 rounded-md">Zpět</button>
               <button onClick={handleFinalSubmit} disabled={!hasAgreed || !isSigned} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">Vytvořit smlouvu a odeslat</button>
            </div>
          </div>
        );
      case 4: // Confirmation
        return (
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-green-600">Smlouva úspěšně vytvořena!</h3>
            <p className="text-gray-600">Smlouva byla uložena do archivu. Nyní můžete odeslat kopii zákazníkovi a na firemní email.</p>
            <a href={mailtoLink} onClick={onClose} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700">
              Otevřít email a odeslat
            </a>
            <button onClick={onClose} className="block w-full text-center mt-2 text-gray-600 hover:underline">Zavřít</button>
          </div>
        )
      default:
        return null;
    }
  };

  const title = isConfirmed ? 'Hotovo' : `Nový pronájem - Krok ${step} ze 3`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {renderStep()}
    </Modal>
  );
};

export default CreateRentalWizard;
