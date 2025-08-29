import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Vehicle, Customer, Rental, Invoice, ServiceRecord, Notification, HandoverProtocol, PreRegistration } from '../types';
import { BUSINESS_INFO } from '../constants';
import { supabase } from '../supabaseClient';

interface DataContextType {
  vehicles: Vehicle[];
  customers: Customer[];
  rentals: Rental[];
  invoices: Invoice[];
  preRegistrations: PreRegistration[];
  notifications: Notification[];
  billingInfo: typeof BUSINESS_INFO;
  isLoading: boolean;
  updateBillingInfo: (newInfo: typeof BUSINESS_INFO) => Promise<void>;
  addNotification: (message: string, type?: 'success' | 'error') => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'serviceHistory' | 'pricing'>) => Promise<void>;
  updateVehicle: (vehicle: Vehicle) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer | null>;
  addRental: (rental: Omit<Rental, 'id' | 'status' | 'startMileage' | 'endMileage' | 'pickupProtocol' | 'returnProtocol'>, preRegistrationId?: string) => Promise<void>;
  addInvoice: (rentalId: string, status?: 'paid' | 'unpaid') => Promise<void>;
  addServiceRecord: (vehicleId: string, record: Omit<ServiceRecord, 'id'>) => Promise<void>;
  updateInvoiceStatus: (invoiceId: string, status: 'paid' | 'unpaid') => Promise<void>;
  addHandoverProtocol: (rentalId: string, type: 'pickup' | 'return', protocolData: Omit<HandoverProtocol, 'timestamp' | 'photos'> & { photoFiles: File[] }, options: { billingOption: 'none' | 'paid' | 'transfer' }) => Promise<void>;
  startRental: (rentalId: string, mileage: number) => Promise<void>;
  createPreRegistration: (email: string) => Promise<PreRegistration | null>;
  getPreRegistrationById: (id: string) => Promise<PreRegistration | null>;
  submitPreRegistration: (id: string, data: { customerData: Omit<Customer, 'id'>, signature: string, idCardFile?: File, licenseFile?: File }) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [preRegistrations, setPreRegistrations] = useState<PreRegistration[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [billingInfo, setBillingInfo] = useState(BUSINESS_INFO);
  const [isLoading, setIsLoading] = useState(true);

  const addNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          { data: vehiclesData, error: vehiclesError },
          { data: customersData, error: customersError },
          { data: rentalsData, error: rentalsError },
          { data: invoicesData, error: invoicesError },
          { data: preRegsData, error: preRegsError },
        ] = await Promise.all([
          supabase.from('vehicles').select('*').order('make'),
          supabase.from('customers').select('*').order('fullName'),
          supabase.from('rentals').select('*'),
          supabase.from('invoices').select('*'),
          supabase.from('preregistrations').select('*').order('created_at', { ascending: false })
        ]);

        if (vehiclesError) throw vehiclesError;
        if (customersError) throw customersError;
        if (rentalsError) throw rentalsError;
        if (invoicesError) throw invoicesError;
        if (preRegsError) throw preRegsError;

        setVehicles(vehiclesData || []);
        setCustomers(customersData || []);
        setRentals(rentalsData || []);
        setInvoices(invoicesData || []);
        setPreRegistrations(preRegsData || []);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        addNotification('Nepodařilo se načíst data z databáze.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [addNotification]);
  
  const updateBillingInfo = async (newInfo: typeof BUSINESS_INFO) => {
    setBillingInfo(newInfo);
    addNotification('Fakturační údaje byly dočasně aktualizovány (neukládá se do DB).');
  };

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'serviceHistory' | 'pricing'>) => {
    const newVehicleData = { 
      ...vehicleData, 
      serviceHistory: [],
      pricing: { hour4: 500, hour12: 900, day: 1200 }
    };

    const { data, error } = await supabase.from('vehicles').insert(newVehicleData).select().single();
    if (error) {
      addNotification(`Chyba při přidávání vozidla: ${error.message}`, 'error');
    } else {
      setVehicles(prev => [...prev, data]);
      addNotification('Vozidlo bylo úspěšně přidáno.');
    }
  };

  const updateVehicle = async (updatedVehicle: Vehicle) => {
    const { data, error } = await supabase.from('vehicles').update(updatedVehicle).eq('id', updatedVehicle.id).select().single();
     if (error) {
      addNotification(`Chyba při aktualizaci vozidla: ${error.message}`, 'error');
    } else {
      setVehicles(prev => prev.map(v => v.id === data.id ? data : v));
      addNotification('Údaje o vozidle byly aktualizovány.');
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<Customer | null> => {
     const { data, error } = await supabase.from('customers').insert(customerData).select().single();
     if (error) {
      addNotification(`Chyba při vytváření zákazníka: ${error.message}`, 'error');
      return null;
    } else {
      setCustomers(prev => [...prev, data]);
      addNotification('Zákazník byl úspěšně vytvořen.');
      return data;
    }
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    const { data, error } = await supabase.from('customers').update(updatedCustomer).eq('id', updatedCustomer.id).select().single();
     if (error) {
      addNotification(`Chyba při ukládání změn: ${error.message}`, 'error');
    } else {
      setCustomers(prev => prev.map(c => c.id === data.id ? data : c));
      addNotification('Změny zákazníka byly uloženy.');
    }
  };

  const addRental = async (rentalData: Omit<Rental, 'id' | 'status' | 'startMileage' | 'endMileage' | 'pickupProtocol' | 'returnProtocol'>, preRegistrationId?: string) => {
    const now = new Date();
    const startDate = new Date(rentalData.startDate);
    const status = startDate > now ? 'upcoming' : 'active';
    
    const newRentalData = { ...rentalData, status };

    const { data, error } = await supabase.from('rentals').insert(newRentalData).select().single();
    if (error) {
      addNotification(`Chyba při vytváření pronájmu: ${error.message}`, 'error');
    } else {
      setRentals(prev => [...prev, data]);
      addNotification('Nový pronájem byl úspěšně vytvořen.');
      if (preRegistrationId) {
        const { error: updateError } = await supabase.from('preregistrations').update({ status: 'completed' }).eq('id', preRegistrationId);
        if (!updateError) {
          setPreRegistrations(prev => prev.map(pr => pr.id === preRegistrationId ? { ...pr, status: 'completed' } : pr));
        }
      }
    }
  };

  const addInvoice = async (rentalId: string, status: 'paid' | 'unpaid' = 'unpaid') => {
    const rental = rentals.find(r => r.id === rentalId);
    const customer = customers.find(c => c.id === rental?.customerId);
    const vehicle = vehicles.find(v => v.id === rental?.vehicleId);

    if (!rental || !customer || !vehicle) {
      addNotification("Nepodařilo se vytvořit fakturu: chybějící data.", 'error');
      return;
    }
    
    const issueDate = new Date();
    const dueDate = new Date();
    if (status === 'unpaid') dueDate.setDate(issueDate.getDate() + 14);

    const newInvoiceData = {
      rentalId,
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      amount: rental.totalPrice,
      status,
      supplier: { name: billingInfo.name, address: billingInfo.address, idNumber: `IČO: ${billingInfo.ico}`, bankAccount: billingInfo.bankAccount },
      customer: { name: customer.fullName, address: customer.address, idNumber: `Č. OP: ${customer.idNumber}`, email: customer.email },
      items: [{
        description: `Pronájem vozidla ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate}) od ${new Date(rental.startDate).toLocaleString('cs-CZ')} do ${new Date(rental.endDate).toLocaleString('cs-CZ')}`,
        quantity: 1, unitPrice: rental.totalPrice, total: rental.totalPrice,
      }],
      variableSymbol: rental.id.replace(/\D/g, '').padStart(4, '0')
    };

    const { data, error } = await supabase.from('invoices').insert(newInvoiceData).select().single();
     if (error) {
      addNotification(`Chyba při vytváření faktury: ${error.message}`, 'error');
    } else {
      setInvoices(prev => [...prev, data]);
      addNotification(`Faktura byla úspěšně vytvořena.`);
    }
  };

  const addServiceRecord = async (vehicleId: string, record: Omit<ServiceRecord, 'id'>) => {
     const vehicle = vehicles.find(v => v.id === vehicleId);
     if (!vehicle) return;
     const updatedHistory = [...vehicle.serviceHistory, { ...record, id: `s${Date.now()}` }];
     const { data, error } = await supabase.from('vehicles').update({ serviceHistory: updatedHistory }).eq('id', vehicleId).select().single();

     if (error) {
       addNotification(`Chyba při přidávání záznamu: ${error.message}`, 'error');
     } else {
       setVehicles(prev => prev.map(v => v.id === data.id ? data : v));
       addNotification('Servisní záznam byl přidán.');
     }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: 'paid' | 'unpaid') => {
    const { data, error } = await supabase.from('invoices').update({ status }).eq('id', invoiceId).select().single();
    if (error) {
      addNotification(`Chyba při aktualizaci faktury: ${error.message}`, 'error');
    } else {
      setInvoices(prev => prev.map(inv => inv.id === data.id ? data : inv));
      addNotification('Stav faktury byl aktualizován.');
    }
  };

  const addHandoverProtocol = async (rentalId: string, type: 'pickup' | 'return', protocolData: Omit<HandoverProtocol, 'timestamp' | 'photos'> & { photoFiles: File[] }, options: { billingOption: 'none' | 'paid' | 'transfer' }) => {
      const photoUrls: string[] = [];
      for (const file of protocolData.photoFiles) {
        const fileName = `${rentalId}/${type}-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('protocols').upload(fileName, file);

        if (uploadError) {
          addNotification(`Chyba při nahrávání fotografie: ${uploadError.message}`, 'error');
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from('protocols').getPublicUrl(fileName);
        photoUrls.push(publicUrl);
      }
      const newProtocol: HandoverProtocol = { ...protocolData, photos: photoUrls, timestamp: new Date().toISOString() };
      
      let rentalUpdate: Partial<Rental> = {};
      if(type === 'pickup') {
        rentalUpdate = { status: 'active', startDate: new Date().toISOString(), startMileage: protocolData.mileage, pickupProtocol: newProtocol };
      } else {
        const rental = rentals.find(r => r.id === rentalId);
        if(!rental) return;
        const actualEndDate = new Date();
        const originalEndDate = new Date(rental.endDate);
        rentalUpdate = { 
          status: 'completed', 
          endDate: actualEndDate < originalEndDate ? actualEndDate.toISOString() : rental.endDate,
          endMileage: protocolData.mileage, 
          returnProtocol: newProtocol 
        };
      }

      const { data, error } = await supabase.from('rentals').update(rentalUpdate).eq('id', rentalId).select().single();
      if (error) {
        addNotification(`Chyba při ukládání protokolu: ${error.message}`, 'error');
      } else {
        setRentals(prev => prev.map(r => r.id === data.id ? data : r));
        addNotification(`Protokol uložen, pronájem ${type === 'pickup' ? 'zahájen' : 'dokončen'}.`);

        if(type === 'return') {
          if (options.billingOption === 'paid') addInvoice(rentalId, 'paid');
          else if (options.billingOption === 'transfer') addInvoice(rentalId, 'unpaid');
        }
      }
  };

  const startRental = async (rentalId: string, mileage: number) => {
    const update = { status: 'active' as 'active', startDate: new Date().toISOString(), startMileage: mileage };
    const { data, error } = await supabase.from('rentals').update(update).eq('id', rentalId).select().single();
     if (error) {
      addNotification(`Chyba při zahájení pronájmu: ${error.message}`, 'error');
    } else {
      setRentals(prev => prev.map(r => r.id === data.id ? data : r));
      addNotification('Pronájem byl zahájen.');
    }
  };

  const createPreRegistration = async (email: string) => {
    const { data, error } = await supabase.from('preregistrations').insert({ email, status: 'pending' }).select().single();
    if (error) {
      addNotification(`Chyba při vytváření pozvánky: ${error.message}`, 'error');
      return null;
    }
    setPreRegistrations(prev => [data, ...prev]);
    addNotification('Pozvánka pro zákazníka byla vytvořena.');
    return data;
  };

  const getPreRegistrationById = async (id: string) => {
    const { data, error } = await supabase.from('preregistrations').select('*').eq('id', id).single();
    if (error) {
      addNotification(`Pozvánka nebyla nalezena: ${error.message}`, 'error');
      return null;
    }
    return data;
  };
  
  const uploadDocument = async (file: File, id: string, type: string) => {
      const fileName = `${id}/${type}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('documents').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
      return publicUrl;
  };

  const submitPreRegistration = async (id: string, data: { customerData: Omit<Customer, 'id'>, signature: string, idCardFile?: File, licenseFile?: File }) => {
    try {
      let idCardUrl: string | undefined = undefined;
      let licenseUrl: string | undefined = undefined;

      if (data.idCardFile) {
        idCardUrl = await uploadDocument(data.idCardFile, id, 'id-card');
      }
      if (data.licenseFile) {
        licenseUrl = await uploadDocument(data.licenseFile, id, 'license');
      }

      const { data: updatedData, error } = await supabase.from('preregistrations').update({
        customerData: data.customerData,
        signature: data.signature,
        idCardUrl,
        licenseUrl,
        status: 'submitted'
      }).eq('id', id).select().single();

      if (error) throw error;

      setPreRegistrations(prev => prev.map(pr => pr.id === id ? updatedData : pr));
      return true;

    } catch (error: any) {
      addNotification(`Chyba při odesílání údajů: ${error.message}`, 'error');
      return false;
    }
  };


  return (
    <DataContext.Provider value={{ vehicles, customers, rentals, invoices, preRegistrations, notifications, billingInfo, isLoading, updateBillingInfo, addNotification, addVehicle, updateVehicle, addCustomer, updateCustomer, addRental, addInvoice, addServiceRecord, updateInvoiceStatus, addHandoverProtocol, startRental, createPreRegistration, getPreRegistrationById, submitPreRegistration }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
