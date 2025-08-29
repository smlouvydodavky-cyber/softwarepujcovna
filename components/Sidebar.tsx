import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, FleetIcon, CustomersIcon, RentalsIcon, CalendarIcon, FinancesIcon, LogoIcon, DocumentIcon, LogoutIcon } from './Icons';
import { BUSINESS_INFO } from '../constants';
import { useAuth } from '../hooks/useAuth';

const Sidebar: React.FC = () => {
  const { logout } = useAuth();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 text-lg font-medium transition-colors duration-200 transform rounded-lg ${
      isActive
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-200 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <div className="flex flex-col w-64 bg-gray-800 text-white shadow-lg">
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <LogoIcon className="h-10 w-10 text-blue-400" />
        <span className="ml-3 text-2xl font-bold">Půjčovna OS</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-3">
        <NavLink to="/dashboard" className={navLinkClasses}>
          <DashboardIcon className="h-6 w-6 mr-4" />
          Nástěnka
        </NavLink>
        <NavLink to="/rentals" className={navLinkClasses}>
          <RentalsIcon className="h-6 w-6 mr-4" />
          Pronájmy
        </NavLink>
        <NavLink to="/contracts" className={navLinkClasses}>
          <DocumentIcon className="h-6 w-6 mr-4" />
          Archiv Smluv
        </NavLink>
        <NavLink to="/calendar" className={navLinkClasses}>
          <CalendarIcon className="h-6 w-6 mr-4" />
          Kalendář
        </NavLink>
        <NavLink to="/fleet" className={navLinkClasses}>
          <FleetIcon className="h-6 w-6 mr-4" />
          Vozový park
        </NavLink>
        <NavLink to="/customers" className={navLinkClasses}>
          <CustomersIcon className="h-6 w-6 mr-4" />
          Zákazníci
        </NavLink>
        <NavLink to="/finances" className={navLinkClasses}>
          <FinancesIcon className="h-6 w-6 mr-4" />
          Finance
        </NavLink>

        <div className="pt-4 mt-4 border-t border-gray-700">
           <button onClick={logout} className="w-full flex items-center px-4 py-3 text-lg font-medium transition-colors duration-200 transform rounded-lg text-gray-200 hover:bg-red-700 hover:text-white">
             <LogoutIcon className="h-6 w-6 mr-4" />
             Odhlásit se
           </button>
        </div>
      </nav>
      <div className="p-4 border-t border-gray-700 text-center text-xs text-gray-400">
        <p>{BUSINESS_INFO.website}</p>
        <p>&copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default Sidebar;
