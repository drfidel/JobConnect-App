import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Mail, Lock, User, Briefcase, UserPlus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('seeker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        role,
        createdAt: serverTimestamp(),
        bio: '',
        skills: [],
        experience: [],
        education: []
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
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

          <div className="pt-4 border-t border-gray-50 dark:border-zinc-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Create your account'
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
