
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../hooks/useDataContext';
import Modal from '../components/Modal';
import type { Customer } from '../types';
import { Link } from 'react-router-dom';
import { CustomersIcon, SortAscIcon, SortDescIcon, SortIcon } from '../components/Icons';

const InviteCustomerModal: React.FC<{onClose: () => void}> = ({ onClose }) => {
  const { createPreRegistration } = useData();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPreReg = await createPreRegistration(email);
    if (newPreReg) {
      const url = `${window.location.origin}${window.location.pathname}#/preregister/${newPreReg.id}`;
      const subject = "Online registrace pro pronájem vozidla";
      const body = `Dobrý den,

pro urychlení procesu pronájmu vozidla prosím vyplňte své údaje na následujícím zabezpečeném odkazu:
${url}

Děkujeme,
Tým Půjčovna Dodávek OS
`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email zákazníka</label>
        <input 
          id="email" 
          type="email" 
          value={email}
          onChange={e => setEmail(e.target.value)} 
          required 
          className="w-full p-2 border rounded-md mt-1" 
          placeholder="zadejte@email.cz"
          autoFocus
        />
        <p className="text-xs text-gray-500 mt-2">Po odeslání se otevře Váš emailový klient s připravenou zprávou obsahující unikátní odkaz pro zákazníka.</p>
      </div>
      <div className="flex justify-end pt-4">
        <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Odeslat pozvánku</button>
      </div>
    </form>
  )
}

const CustomersPage: React.FC = () => {
  const { customers, addCustomer, updateCustomer } = useData();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'ascending' | 'descending' } | null>({ key: 'fullName', direction: 'ascending'});

  const openAddModal = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };
  
  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setModalOpen(true);
  };
  
  {/* FIX: Correct the type to Omit 'created_at' for new customers, as it's not provided in the form. */}
  const handleFormSubmit = (customerData: Omit<Customer, 'id' | 'created_at'> | Customer) => {
    if ('id' in customerData) {
      updateCustomer(customerData);
    } else {
      addCustomer(customerData);
    }
    setModalOpen(false);
  };
  
  const sortedCustomers = useMemo(() => {
    let sortableCustomers = [...customers];
    if (sortConfig !== null) {
      sortableCustomers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableCustomers;
  }, [customers, sortConfig]);
  
  const requestSort = (key: keyof Customer) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof Customer) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <SortIcon className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'ascending' ? <SortAscIcon className="w-4 h-4 text-blue-600" /> : <SortDescIcon className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800">Zákazníci</h1>
        <div className="flex gap-4">
          <button onClick={() => setInviteModalOpen(true)} className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-colors">
            Pozvat nového zákazníka
          </button>
          <button onClick={openAddModal} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors">
            + Přidat ručně
          </button>
        </div>
      </div>
      
      {customers.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button onClick={() => requestSort('fullName')} className="flex items-center gap-2">
                    Jméno a příjmení {getSortIcon('fullName')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akce</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/customers/${customer.id}`} className="text-sm font-medium text-blue-600 hover:underline">{customer.fullName}</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => openEditModal(customer)} className="text-blue-600 hover:text-blue-900">Upravit</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <CustomersIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-xl font-semibold text-gray-800">Nemáte žádné zákazníky</h3>
          <p className="mt-2 text-gray-500">Začněte tím, že pozvete svého prvního zákazníka nebo ho přidáte ručně.</p>
          <div className="mt-6">
            <button onClick={() => setInviteModalOpen(true)} className="px-6 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105">
              Pozvat prvního zákazníka
            </button>
          </div>
        </div>
      )}
      
      {isModalOpen && (
        <CustomerFormModal 
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handleFormSubmit}
            customer={editingCustomer}
        />
      )}
      <Modal isOpen={isInviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Pozvat zákazníka k online registraci">
        <InviteCustomerModal onClose={() => setInviteModalOpen(false)} />
      </Modal>
    </div>
  );
};

// Customer Form Modal Component
interface CustomerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    {/* FIX: Correct the type to Omit 'created_at' for new customers, as it's not provided in the form. */}
    onSubmit: (customerData: Omit<Customer, 'id' | 'created_at'> | Customer) => void;
    customer: Customer | null;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSubmit, customer }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        idNumber: '',
        drivingLicense: '',
    });

    useEffect(() => {
        if (customer) {
            setFormData(customer);
        } else {
            setFormData({ fullName: '', email: '', phone: '', address: '', idNumber: '', drivingLicense: '' });
        }
    }, [customer, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(customer) {
            onSubmit({ ...customer, ...formData });
        } else {
            onSubmit(formData);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={customer ? 'Upravit zákazníka' : 'Přidat nového zákazníka'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Jméno a příjmení" required className="w-full p-2 border rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="p-2 border rounded-md" />
                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Telefon" required className="p-2 border rounded-md" />
                </div>
                <input name="address" value={formData.address} onChange={handleChange} placeholder="Adresa" required className="w-full p-2 border rounded-md" />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="idNumber" value={formData.idNumber} onChange={handleChange} placeholder="Číslo OP" required className="p-2 border rounded-md" />
                    <input name="drivingLicense" value={formData.drivingLicense} onChange={handleChange} placeholder="Číslo ŘP" required className="p-2 border rounded-md" />
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">{customer ? 'Uložit změny' : 'Vytvořit zákazníka'}</button>
                </div>
            </form>
        </Modal>
    )
}

export default CustomersPage;
