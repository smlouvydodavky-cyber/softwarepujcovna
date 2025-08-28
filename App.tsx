import React from 'react';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import FleetPage from './pages/FleetPage';
import CustomersPage from './pages/CustomersPage';
import RentalsPage from './pages/RentalsPage';
import CalendarPage from './pages/CalendarPage';
import FinancesPage from './pages/FinancesPage';
import ContractsPage from './pages/ContractsPage';
import { DataProvider, useData } from './hooks/useDataContext';
import Toast from './components/Toast';
import CustomerDetailPage from './pages/CustomerDetailPage';
import { LogoIcon } from './components/Icons';

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-screen bg-gray-100">
    <div className="text-center">
      <LogoIcon className="h-16 w-16 text-blue-500 animate-spin mb-4 mx-auto" />
      <p className="text-lg font-semibold text-gray-700">Načítání dat...</p>
    </div>
  </div>
);


const AppContent: React.FC = () => {
  const { notifications, isLoading } = useData();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
          <Route path="/rentals" element={<RentalsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/finances" element={<FinancesPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
        </Routes>
      </Layout>
      <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]">
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {notifications.map(n => (
            <Toast
              key={n.id}
              id={n.id}
              message={n.message}
              type={n.type}
              onDismiss={() => {}} // The context handles removal
            />
          ))}
        </div>
      </div>
    </>
  );
}


const App: React.FC = () => {
  return (
    <DataProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </DataProvider>
  );
};

export default App;