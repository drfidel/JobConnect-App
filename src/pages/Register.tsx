import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Mail, Lock, User, Briefcase, UserPlus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('seeker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.registerWithEmail(email, password, displayName, role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const user = await authService.signInWithGoogle();
      // For Google sign-in, we might need to check if profile exists or create it
      const profile = await authService.getUserProfile(user.uid);
      if (!profile) {
        await authService.createUserProfile(user, role);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black">
      <div className="max-w-2xl w-full space-y-8 bg-white dark:bg-zinc-900 p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
            <UserPlus size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Join JobConnect Uganda</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
            Create your account and start your professional journey today.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
            <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed font-medium">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-8" onSubmit={handleRegister}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>

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
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 ml-1">Password</label>
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

            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 ml-1">I am a...</label>
              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('seeker')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                    role === 'seeker' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-4 ring-blue-50 dark:ring-blue-900/10' 
                      : 'border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800 hover:border-blue-200 dark:hover:border-blue-900/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === 'seeker' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-700 text-gray-400 dark:text-zinc-500'}`}>
                      <User size={24} />
                    </div>
                    <div>
                      <h4 className={`font-bold ${role === 'seeker' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>Job Seeker</h4>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">I want to find and apply for jobs</p>
                    </div>
                  </div>
                  {role === 'seeker' && <CheckCircle2 className="text-blue-600 dark:text-blue-400" size={20} />}
                </button>

                <button
                  type="button"
                  onClick={() => setRole('employer')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                    role === 'employer' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-4 ring-blue-50 dark:ring-blue-900/10' 
                      : 'border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800 hover:border-blue-200 dark:hover:border-blue-900/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === 'employer' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-700 text-gray-400 dark:text-zinc-500'}`}>
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <h4 className={`font-bold ${role === 'employer' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>Employer</h4>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">I want to post jobs and hire talent</p>
                    </div>
                  </div>
                  {role === 'employer' && <CheckCircle2 className="text-blue-600 dark:text-blue-400" size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 dark:border-zinc-800 space-y-4">
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Create your account'
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-500 font-medium">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
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
                  Sign up with Google
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
