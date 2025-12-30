
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b-4 border-green-800 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-green-800 text-white rounded-full flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
              AUS
            </div>
            <span className="hidden md:inline font-bold text-green-900">AUSU CBT</span>
          </Link>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden md:flex gap-6">
            <Link to="/dashboard" className={`font-semibold text-sm hover:text-green-700 transition-colors ${isActive('/dashboard') ? 'text-green-800 border-b-2 border-green-800 pb-1' : 'text-gray-600'}`}>
              Dashboard
            </Link>
            <Link to="/results" className={`font-semibold text-sm hover:text-green-700 transition-colors ${isActive('/results') ? 'text-green-800 border-b-2 border-green-800 pb-1' : 'text-gray-600'}`}>
              Results
            </Link>
          </div>

          <div className="flex items-center gap-3 bg-green-50 px-3 py-1 rounded-lg border border-green-100">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-green-900 leading-tight truncate max-w-[120px]">{user.name}</div>
              <div className="text-[10px] text-green-700">{user.matric || user.role.toUpperCase()}</div>
            </div>
            <button 
              onClick={onLogout}
              className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded text-xs font-bold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
