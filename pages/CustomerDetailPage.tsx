import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../hooks/useDataContext';

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
  <div className="p-4 bg-gray-50 rounded-lg shadow-sm text-center">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

const CustomerDetailPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { customers, rentals, vehicles } = useData();

  const customer = customers.find(c => c.id === customerId);
  const customerRentals = rentals
    .filter(r => r.customerId === customerId)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  
  const totalSpent = customerRentals.reduce((sum, r) => sum + r.totalPrice, 0);

  if (!customer) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Zákazník nenalezen</h1>
        <p className="text-gray-600">Tento zákazník neexistuje nebo byl smazán.</p>
        <Link to="/customers" className="mt-4 inline-block text-blue-600 hover:underline">Zpět na seznam zákazníků</Link>
      </div>
    );
  }

  const getStatusChip = (status: 'active' | 'upcoming' | 'completed') => {
    switch (status) {
      case 'active':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Aktivní</span>;
      case 'upcoming':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Nadcházející</span>;
      case 'completed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Dokončený</span>;
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <Link to="/customers" className="text-blue-600 hover:underline mb-2 inline-block">&larr; Zpět na seznam zákazníků</Link>
        <h1 className="text-4xl font-bold text-gray-800">{customer.fullName}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Kontaktní údaje</h3>
            <p><strong>Email:</strong> {customer.email}</p>
            <p><strong>Telefon:</strong> {customer.phone}</p>
            <p><strong>Adresa:</strong> {customer.address}</p>
            <p><strong>Číslo OP:</strong> {customer.idNumber}</p>
            <p><strong>Číslo ŘP:</strong> {customer.drivingLicense}</p>
        </div>
        <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <StatCard title="Celková útrata" value={`${totalSpent.toLocaleString('cs-CZ')} Kč`} />
                 <StatCard title="Počet pronájmů" value={customerRentals.length} />
            </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Historie pronájmů</h2>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="min-w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vozidlo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Od</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Do</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cena</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {customerRentals.map(rental => {
                        const vehicle = vehicles.find(v => v.id === rental.vehicleId);
                        return (
                            <tr key={rental.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{vehicle?.make} {vehicle?.model}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(rental.startDate).toLocaleDateString('cs-CZ')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(rental.endDate).toLocaleDateString('cs-CZ')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{rental.totalPrice.toLocaleString('cs-CZ')} Kč</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusChip(rental.status)}</td>
                            </tr>
                        )
                    })}
                     {customerRentals.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-10 text-gray-500">
                                Tento zákazník zatím nemá žádnou historii pronájmů.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
