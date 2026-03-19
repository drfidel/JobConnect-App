import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Company, Job } from '../types';
import { Building2, MapPin, Globe, Briefcase, ChevronRight, Loader2, Calendar, DollarSign, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!id) return;
      try {
        const companySnap = await getDoc(doc(db, 'companies', id));
        if (companySnap.exists()) {
          setCompany({ id: companySnap.id, ...companySnap.data() } as Company);
          
          // Fetch active jobs for this company
          const jobsRef = collection(db, 'jobs');
          const q = query(jobsRef, where('companyId', '==', id), where('status', '==', 'active'));
          const unsubscribeJobs = onSnapshot(q, (snapshot) => {
            setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
            setLoading(false);
          });

          return () => unsubscribeJobs();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching company profile:", err);
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
        <Building2 size={64} className="text-gray-300 dark:text-zinc-700 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Company Not Found</h2>
        <p className="text-gray-500 dark:text-zinc-400">The company profile you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="mt-6 inline-block text-blue-600 dark:text-blue-400 font-bold hover:underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Company Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
          <div className="w-32 h-32 bg-gray-50 dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
            {company.logoURL ? <img src={company.logoURL} alt="Logo" className="w-full h-full object-cover" /> : <Building2 size={64} className="text-gray-300 dark:text-zinc-600" />}
          </div>
          <div className="flex-grow">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">{company.name}</h1>
            <div className="flex flex-wrap gap-6 text-gray-600 dark:text-zinc-400 font-medium">
              <div className="flex items-center gap-2"><MapPin size={20} className="text-blue-600 dark:text-blue-400" /> {company.location}</div>
              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
                  <Globe size={20} /> {company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <div className="flex items-center gap-2"><Briefcase size={20} className="text-blue-600 dark:text-blue-400" /> {jobs.length} Open Positions</div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 dark:bg-blue-900/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* About Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 dark:border-zinc-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">About {company.name}</h3>
            <p className="text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap text-lg italic">
              {company.description || 'No company description available.'}
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Open Positions <span className="text-sm font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">{jobs.length}</span>
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {jobs.length > 0 ? (
                jobs.map(job => (
                  <Link 
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="block group bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
                            {job.jobType.replace('-', ' ')}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                            Posted {formatDistanceToNow(job.createdAt.toDate())} ago
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-4">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-zinc-400">
                          <div className="flex items-center gap-1.5"><MapPin size={16} /> {job.location}</div>
                          <div className="flex items-center gap-1.5"><DollarSign size={16} /> {job.salaryRange || 'Negotiable'}</div>
                          <div className="flex items-center gap-1.5"><Clock size={16} /> {job.jobType}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-all">
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-zinc-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-700">
                  <p className="text-gray-500 dark:text-zinc-400 font-medium">No open positions at the moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Company Details</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Headquarters</p>
                  <p className="text-gray-900 dark:text-white font-bold">{company.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Website</p>
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-gray-900 dark:text-white font-bold hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                    {company.website ? company.website.replace(/^https?:\/\//, '') : 'N/A'}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">On JobConnect Since</p>
                  <p className="text-gray-900 dark:text-white font-bold">{company.createdAt ? new Date(company.createdAt.toDate()).getFullYear() : '2026'}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
