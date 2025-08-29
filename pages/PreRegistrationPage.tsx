import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { PreRegistration, Customer } from '../types';
import SignaturePad from '../components/SignaturePad';
import { LogoIcon } from '../components/Icons';
import { BUSINESS_INFO } from '../constants';

const LoadingSpinner: React.FC = () => (
  <div className="text-center">
    <LogoIcon className="h-12 w-12 text-blue-500 animate-spin mb-4 mx-auto" />
    <p className="text-lg font-semibold text-gray-700">Načítání...</p>
  </div>
);

const PreRegistrationPage: React.FC = () => {
  const { preregistrationId } = useParams<{ preregistrationId: string }>();
  const [preReg, setPreReg] = useState<PreRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  const [customerData, setCustomerData] = useState<Omit<Customer, 'id'>>({
    fullName: '', email: '', phone: '', address: '', idNumber: '', drivingLicense: ''
  });
  const [idCardFile, setIdCardFile] = useState<File | undefined>();
  const [licenseFile, setLicenseFile] = useState<File | undefined>();
  const [isSigned, setIsSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signaturePadRef = useRef<{ getSignatureData: () => string | null }>(null);

  useEffect(() => {
    const fetchPreReg = async () => {
      if (!preregistrationId) {
        setError('Chybějící ID registrace.');
        setLoading(false);
        return;
      }
      const { data, error: fetchError } = await supabase.from('preregistrations').select('*').eq('id', preregistrationId).single();
      
      if (fetchError || !data) {
        setError('Tento odkaz pro registraci není platný nebo vypršel.');
      } else if (data.status !== 'pending') {
        setError('Tato registrace již byla dokončena.');
      } else {
        setPreReg(data);
        setCustomerData(prev => ({ ...prev, email: data.email }));
      }
      setLoading(false);
    };
    fetchPreReg();
  }, [preregistrationId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      if (name === 'idCard') setIdCardFile(files[0]);
      if (name === 'license') setLicenseFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const signature = signaturePadRef.current?.getSignatureData();
    if (!preReg || !isSigned || !signature) {
      setError('Je nutné potvrdit údaje podpisem.');
      setIsSubmitting(false);
      return;
    }

    try {
      let idCardUrl: string | undefined;
      let licenseUrl: string | undefined;

      if (idCardFile) {
        const fileName = `${preReg.id}/id-card-${Date.now()}-${idCardFile.name}`;
        const { data, error } = await supabase.storage.from('documents').upload(fileName, idCardFile);
        if (error) throw error;
        idCardUrl = supabase.storage.from('documents').getPublicUrl(data.path).data.publicUrl;
      }
      if (licenseFile) {
        const fileName = `${preReg.id}/license-${Date.now()}-${licenseFile.name}`;
        const { data, error } = await supabase.storage.from('documents').upload(fileName, licenseFile);
        if (error) throw error;
        licenseUrl = supabase.storage.from('documents').getPublicUrl(data.path).data.publicUrl;
      }

      const { error: updateError } = await supabase.from('preregistrations').update({
        status: 'submitted',
        customerData,
        signature,
        idCardUrl,
        licenseUrl,
      }).eq('id', preReg.id);

      if (updateError) throw updateError;
      
      setStep(4); // Success step

    } catch (err: any) {
      setError(`Nastala chyba: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: // Personal Details
        return (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800">Vaše údaje</h2>
            <p className="text-center text-gray-600 mb-6">Prosím, vyplňte své osobní a kontaktní údaje.</p>
            <div className="space-y-4">
              <input name="fullName" value={customerData.fullName} onChange={handleChange} placeholder="Jméno a příjmení" required className="w-full p-3 border rounded-md" />
              <input name="email" type="email" value={customerData.email} onChange={handleChange} placeholder="Email" required className="w-full p-3 border rounded-md" />
              <input name="phone" value={customerData.phone} onChange={handleChange} placeholder="Telefon" required className="w-full p-3 border rounded-md" />
              <input name="address" value={customerData.address} onChange={handleChange} placeholder="Adresa trvalého bydliště" required className="w-full p-3 border rounded-md" />
            </div>
            <button onClick={() => setStep(2)} className="w-full mt-6 p-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Pokračovat</button>
          </>
        );
      case 2: // Documents
        return (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800">Doklady</h2>
            <p className="text-center text-gray-600 mb-6">Vyplňte prosím čísla svých dokladů. Pro urychlení můžete nahrát i jejich fotografie.</p>
            <div className="space-y-4">
                <input name="idNumber" value={customerData.idNumber} onChange={handleChange} placeholder="Číslo občanského průkazu" required className="w-full p-3 border rounded-md" />
                <label className="block text-sm">Fotografie OP (přední strana):</label>
                <input type="file" name="idCard" onChange={handleFileChange} accept="image/*" capture="environment" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />

                <input name="drivingLicense" value={customerData.drivingLicense} onChange={handleChange} placeholder="Číslo řidičského průkazu" required className="w-full p-3 border rounded-md" />
                <label className="block text-sm">Fotografie ŘP (přední strana):</label>
                <input type="file" name="license" onChange={handleFileChange} accept="image/*" capture="environment" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="p-3 bg-gray-200 text-gray-800 font-semibold rounded-lg">Zpět</button>
                <button onClick={() => setStep(3)} className="p-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Pokračovat k podpisu</button>
            </div>
          </>
        );
      case 3: // Signature
        return (
          <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold text-center text-gray-800">Souhlas a podpis</h2>
            <p className="text-center text-gray-600 mb-6">Prosím, zkontrolujte své údaje a potvrďte je podpisem.</p>
            <div className="bg-gray-50 p-4 rounded-md border text-sm space-y-1">
              <p><strong>Jméno:</strong> {customerData.fullName}</p>
              <p><strong>Email:</strong> {customerData.email}</p>
              <p><strong>Č. OP:</strong> {customerData.idNumber}</p>
              <p><strong>Č. ŘP:</strong> {customerData.drivingLicense}</p>
            </div>
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Váš podpis</label>
                <SignaturePad ref={signaturePadRef} onDraw={() => setIsSigned(true)} onClear={() => setIsSigned(false)} />
            </div>
             <p className="text-xs text-gray-500 mt-4">Svým podpisem souhlasím se zpracováním osobních údajů pro účely vytvoření smlouvy o pronájmu vozidla v souladu s GDPR.</p>
             {error && <p className="text-red-500 text-center font-semibold mt-4">{error}</p>}
            <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setStep(2)} className="p-3 bg-gray-200 text-gray-800 font-semibold rounded-lg">Zpět</button>
                <button type="submit" disabled={!isSigned || isSubmitting} className="p-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400">
                    {isSubmitting ? 'Odesílám...' : 'Odeslat údaje'}
                </button>
            </div>
          </form>
        );
        case 4: // Success
            return (
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-green-600">Děkujeme!</h2>
                    <p className="text-gray-700 mt-4">Vaše údaje byly úspěšně odeslány. Budeme vás kontaktovat ohledně dokončení rezervace.</p>
                    <p className="text-gray-700 mt-2">Nyní můžete toto okno zavřít.</p>
                </div>
            )
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-lg mx-auto">
        <header className="text-center mb-8">
            <LogoIcon className="h-12 w-12 mx-auto text-blue-600" />
            <h1 className="text-3xl font-bold mt-2 text-gray-800">{BUSINESS_INFO.name}</h1>
            <p className="text-gray-600">Online registrace zákazníka</p>
        </header>
        <main className="bg-white p-8 rounded-2xl shadow-xl">
          {loading ? <LoadingSpinner /> : error ? (
            <div className="text-center text-red-600 font-semibold">
                <p>{error}</p>
            </div>
          ) : renderStep()}
        </main>
      </div>
    </div>
  );
};

export default PreRegistrationPage;