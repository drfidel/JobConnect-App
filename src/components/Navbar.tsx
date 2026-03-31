import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, User, LogOut, Menu, X, Shield, Sun, Moon, Settings, LayoutDashboard, ChevronDown, Zap } from 'lucide-react';
import { useAuth, useDarkMode } from '../App';
import { authService } from '../services/authService';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const { user, profile } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Briefcase size={24} />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">UMA <span className="text-blue-600">Job Portal</span></span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Find Jobs</Link>
            <Link to="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Pricing</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Dashboard</Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors flex items-center gap-1">
                    <Shield size={16} /> Admin
                  </Link>
                )}
                <div className="flex items-center space-x-4 border-l pl-8 border-gray-100 dark:border-gray-800">
                  <NotificationCenter />
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                  
                  {/* User Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none"
                    >
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <User size={18} />
                        </div>
                      )}
                      <span className="font-medium hidden lg:inline-block">{profile?.displayName || 'User'}</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in duration-150">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile?.displayName || 'User'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                        
                        <Link 
                          to="/profile" 
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <User size={16} />
                          <span>View Profile</span>
                        </Link>
                        
                        <Link 
                          to="/dashboard" 
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <LayoutDashboard size={16} />
                          <span>Dashboard</span>
                        </Link>

                        <Link 
                          to="/profile" 
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Settings size={16} />
                          <span>Settings</span>
                        </Link>

                        <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                          <button 
                            onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                          >
                            <LogOut size={16} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-4 py-2 transition-colors">Login</Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && <NotificationCenter />}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 dark:text-gray-300 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-50 dark:border-gray-800 space-y-4 animate-in slide-in-from-top duration-200">
            <Link to="/" className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2" onClick={() => setIsOpen(false)}>
              <Briefcase size={18} />
              <span>Find Jobs</span>
            </Link>
            <Link to="/pricing" className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2" onClick={() => setIsOpen(false)}>
              <Zap size={18} />
              <span>Pricing</span>
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2" onClick={() => setIsOpen(false)}>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2" onClick={() => setIsOpen(false)}>
                    <Shield size={18} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link to="/profile" className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2" onClick={() => setIsOpen(false)}>
                  <User size={18} />
                  <span>Profile</span>
                </Link>
                <Link to="/profile" className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2" onClick={() => setIsOpen(false)}>
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>
                <button 
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="flex items-center space-x-2 w-full text-left text-red-500 font-medium px-2"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <Link to="/login" className="block w-full text-center py-3 text-gray-600 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-700 rounded-xl" onClick={() => setIsOpen(false)}>Login</Link>
                <Link to="/register" className="block w-full text-center py-3 bg-blue-600 text-white font-semibold rounded-xl" onClick={() => setIsOpen(false)}>Register</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
