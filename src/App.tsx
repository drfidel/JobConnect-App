import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EmployerDashboard from './pages/EmployerDashboard';
import SeekerDashboard from './pages/SeekerDashboard';
import JobDetails from './pages/JobDetails';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import CompanyProfile from './pages/CompanyProfile';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
}

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
});

const DarkModeContext = createContext<DarkModeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => void 0,
});

export const useAuth = () => useContext(AuthContext);
export const useDarkMode = () => useContext(DarkModeContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch user profile
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady }}>
      <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
        <ErrorBoundary>
          <Router>
            <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
              <Navbar />
              <main className="flex-grow container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                  <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
                  <Route path="/jobs/:id" element={<JobDetails />} />
                  <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
                  <Route path="/company/:id" element={<CompanyProfile />} />
                  
                  {/* Protected Routes */}
                  <Route 
                    path="/dashboard" 
                    element={
                      user ? (
                        profile?.role === 'employer' ? <EmployerDashboard /> : 
                        profile?.role === 'seeker' ? <SeekerDashboard /> : 
                        profile?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />
                      ) : <Navigate to="/login" />
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={user && profile?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} 
                  />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </ErrorBoundary>
      </DarkModeContext.Provider>
    </AuthContext.Provider>
  );
}
