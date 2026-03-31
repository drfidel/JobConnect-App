import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { CONFIG } from '../config';
import { Mail, Lock, LogIn, AlertCircle, Loader2, User as UserIcon, Briefcase, ShieldCheck, Database, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isMockMode, setIsMockMode] = useState(CONFIG.USE_MOCK);
  const navigate = useNavigate();

  const toggleMode = (mode: boolean) => {
    CONFIG.USE_MOCK = mode;
    setIsMockMode(mode);
    // Reload to ensure all services re-initialize with the correct mode
    window.location.reload();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.signInWithEmail(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await authService.signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = async (email: string) => {
    setLoading(true);
    setError('');
    try {
      await authService.signInWithEmail(email, 'password');
      navigate('/dashboard');
    } catch (err: any) {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800">
        {/* Mode Switcher */}
        <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl mb-8">
          <button
            onClick={() => toggleMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isMockMode 
                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
            }`}
          >
            <Database size={14} />
            Demo Mode
          </button>
          <button
            onClick={() => toggleMode(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              !isMockMode 
                ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm' 
                : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
            }`}
          >
            <Zap size={14} />
            Live Mode
          </button>
        </div>

        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
            <LogIn size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
            Log in to your account to continue your journey.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
            <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed font-medium">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300">Password</label>
                <Link to="/forgot-password" title="Forgot Password" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Log in to your account'
              )}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-500 font-medium">Or continue with</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-700 dark:text-zinc-300 font-bold hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all shadow-sm disabled:opacity-70"
            >
              {googleLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>

          {true && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest text-center mb-4">
                {isMockMode ? 'Demo Accounts' : 'Quick Login (Requires Firebase Setup)'}
              </p>
              {!isMockMode && (
                <p className="text-[10px] text-gray-400 dark:text-zinc-600 text-center mb-4 italic">
                  Note: These accounts must be created in your Firebase Console with password "password" to work in Live Mode.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('seeker@example.com')}
                  className="flex flex-col items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all border border-blue-100 dark:border-blue-900/50"
                >
                  <UserIcon size={20} />
                  <span className="text-xs font-bold">Job Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('employer@example.com')}
                  className="flex flex-col items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all border border-orange-100 dark:border-orange-900/50"
                >
                  <Briefcase size={20} />
                  <span className="text-xs font-bold">Employer 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('employer3@example.com')}
                  className="flex flex-col items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all border border-purple-100 dark:border-purple-900/50"
                >
                  <Briefcase size={20} />
                  <span className="text-xs font-bold">Employer 2</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin@example.com')}
                  className="flex flex-col items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-100 dark:border-red-900/50"
                >
                  <ShieldCheck size={20} />
                  <span className="text-xs font-bold">Admin</span>
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
