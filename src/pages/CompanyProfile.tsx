import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Company, Job } from '../types';
import { Building2, MapPin, Globe, Briefcase, ChevronRight, Loader2, Calendar, DollarSign, Clock, Edit2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { companyService } from '../services/companyService';
import { jobService } from '../services/jobService';

export default function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchCompanyData = async () => {
      try {
        const companyData = await companyService.getCompanyById(id);
        if (companyData) {
          setCompany(companyData);
          
          // Fetch active jobs for this company
          const unsubscribeJobs = jobService.subscribeToCompanyJobs(id, (jobsData) => {
            setJobs(jobsData.filter(j => j.status === 'active'));
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
            <div className="flex items-center justify-between gap-4 mb-4">
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{company.name}</h1>
              {user?.uid === company.ownerId && (
                <Link 
                  to="/dashboard" 
                  state={{ activeTab: 'company', isEditingCompany: true }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-sm shrink-0"
                >
                  <Edit2 size={16} /> Edit Profile
                </Link>
              )}
            </div>
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
            <div className="text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap text-lg">
              {company.description || 'No company description available.'}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                Open Positions <span className="text-sm font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">{jobs.length}</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {jobs.length > 0 ? (
                jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link 
                      to={`/jobs/${job.id}`}
                      className="block group bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-grow">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-900/30">
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
                            <div className="flex items-center gap-1.5"><MapPin size={16} className="text-blue-600 dark:text-blue-400" /> {job.location}</div>
                            <div className="flex items-center gap-1.5"><DollarSign size={16} className="text-blue-600 dark:text-blue-400" /> {job.salaryRange || 'Negotiable'}</div>
                            <div className="flex items-center gap-1.5"><Clock size={16} className="text-blue-600 dark:text-blue-400" /> {job.jobType}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end">
                          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                            <ChevronRight size={20} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800 shadow-sm">
                  <Briefcase className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" size={48} />
                  <p className="text-gray-500 dark:text-zinc-400 font-medium text-lg">No open positions at the moment.</p>
                  <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">Check back later for new opportunities.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Company Overview</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Headquarters</p>
                  <p className="text-gray-900 dark:text-white font-bold leading-tight">{company.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Website</p>
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-gray-900 dark:text-white font-bold hover:text-blue-600 dark:hover:text-blue-400 hover:underline break-all leading-tight"
                  >
                    {company.website ? company.website.replace(/^https?:\/\//, '') : 'N/A'}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Member Since</p>
                  <p className="text-gray-900 dark:text-white font-bold leading-tight">
                    {company.createdAt ? new Date(company.createdAt.toDate()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'March 2026'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                  <Briefcase size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Active Jobs</p>
                  <p className="text-gray-900 dark:text-white font-bold leading-tight">{jobs.length} Openings</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50 dark:border-zinc-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Share Company</h4>
              <div className="flex gap-2">
                <button className="flex-grow py-2.5 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400 text-sm font-bold rounded-xl transition-all border border-gray-100 dark:border-zinc-700">
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
