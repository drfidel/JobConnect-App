import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, User, LogOut, Menu, X, Shield, Sun, Moon } from 'lucide-react';
import { useAuth, useDarkMode } from '../App';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const { user, profile } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Briefcase size={24} />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">JobConnect <span className="text-blue-600">Uganda</span></span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Find Jobs</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Dashboard</Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors flex items-center gap-1">
                    <Shield size={16} /> Admin
                  </Link>
                )}
                <div className="flex items-center space-x-4 border-l pl-8 border-gray-100 dark:border-gray-800">
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                  <Link to="/profile" className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <User size={18} />
                      </div>
                    )}
                    <span className="font-medium">{profile?.displayName || 'User'}</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
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
            <Link to="/" className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2" onClick={() => setIsOpen(false)}>Find Jobs</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2" onClick={() => setIsOpen(false)}>Dashboard</Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2" onClick={() => setIsOpen(false)}>Admin Panel</Link>
                )}
                <Link to="/profile" className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2" onClick={() => setIsOpen(false)}>Profile</Link>
                <button 
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="block w-full text-left text-red-500 font-medium px-2"
                >
                  Logout
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
