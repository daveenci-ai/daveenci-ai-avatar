import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sparkles, 
  Image, 
  Plus,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Generate Images', href: '/generate', icon: Sparkles },
    { name: 'Avatar Gallery', href: '/gallery', icon: Image },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddModel = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{maxWidth: '1400px'}}>
          <div className="flex justify-between items-center h-16">
            
            {/* Left side - Brand/Logo */}
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-blue-600" />
              <Link to="/generate" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-900">DaVeenci</span>
                <span className="text-sm text-gray-500 hidden sm:inline">(Custom Avatar)</span>
              </Link>
            </div>

            {/* Center - Navigation Menu (Desktop) */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center space-x-4">
              {/* Add Avatar Model Button */}
              <button
                onClick={handleAddModel}
                className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add Avatar Model</span>
              </button>

              {/* User Info & Logout */}
              <div className="flex items-center space-x-3">
                {/* User Avatar */}
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">{user?.name || user?.email}</span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-red-600 transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Add Avatar Model Button */}
              <button
                onClick={() => {
                  handleAddModel();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md text-base font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Add Avatar Model</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 