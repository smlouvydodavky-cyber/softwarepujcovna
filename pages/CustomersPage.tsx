import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../hooks/useDataContext';
import Modal from '../components/Modal';
import type { Customer } from '../types';
import { Link } from 'react-router-dom';
import { CustomersIcon, SortAscIcon, SortDescIcon, SortIcon } from '../components/Icons';

const CustomersPage: React.FC = () => {
  const { customers, addCustomer, updateCustomer } = useData();
  const [isModalOpen, setModalOpen] = useState(false);
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
  
  const handleFormSubmit = (customerData: Omit<Customer, 'id'> | Customer) => {
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
        <button onClick={openAddModal} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors">
          + Nový zákazník
        </button>
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
          <p className="mt-2 text-gray-500">Začněte tím, že si přidáte svého prvního zákazníka.</p>
          <div className="mt-6">
            <button onClick={openAddModal} className="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
              + Přidat prvního zákazníka
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
    </div>
  );
};

// Customer Form Modal Component
interface CustomerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (customerData: Omit<Customer, 'id'> | Customer) => void;
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