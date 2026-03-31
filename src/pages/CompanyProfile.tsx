import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Company, Job, Review } from '../types';
import { Building2, MapPin, Globe, Briefcase, ChevronRight, Loader2, Calendar, DollarSign, Clock, Edit2, Star, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { companyService } from '../services/companyService';
import { jobService } from '../services/jobService';
import { reviewService } from '../services/reviewService';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';

export default function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'reviews'>('jobs');
  const [showReviewForm, setShowReviewForm] = useState(false);

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
          });

          // Fetch reviews for this company
          const unsubscribeReviews = reviewService.subscribeToCompanyReviews(id, (reviewsData) => {
            setReviews(reviewsData);
            setLoading(false);
          });

          return () => {
            unsubscribeJobs();
            unsubscribeReviews();
          };
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

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : null;

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
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-12 shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-8 text-center md:text-left">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
            {company.logoURL ? <img src={company.logoURL} alt="Logo" className="w-full h-full object-cover" /> : <Building2 size={48} className="text-gray-300 dark:text-zinc-600 md:size-[64px]" />}
          </div>
          <div className="flex-grow w-full">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{company.name}</h1>
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
            <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-gray-600 dark:text-zinc-400 font-medium text-sm md:text-base">
              <div className="flex items-center gap-2"><MapPin size={18} className="text-blue-600 dark:text-blue-400 md:size-[20px]" /> {company.location}</div>
              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
                  <Globe size={18} className="md:size-[20px]" /> {company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <div className="flex items-center gap-2"><Briefcase size={18} className="text-blue-600 dark:text-blue-400 md:size-[20px]" /> {jobs.length} Open Positions</div>
              {averageRating && (
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-yellow-400 fill-yellow-400 md:size-[20px]" />
                  <span className="font-bold text-gray-900 dark:text-white">{averageRating}</span>
                  <span className="text-gray-400 dark:text-zinc-500">({reviews.length} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 dark:bg-blue-900/10 rounded-full -translate-y-1/2 translate-x-1/2 hidden md:block"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* About Section */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-zinc-800">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">About {company.name}</h3>
            <div className="text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap text-base md:text-lg">
              {company.description || 'No company description available.'}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
              <div className="flex gap-8">
                <button 
                  onClick={() => setActiveTab('jobs')}
                  className={`pb-4 text-lg font-bold transition-all relative ${
                    activeTab === 'jobs' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
                  }`}
                >
                  Open Positions
                  {activeTab === 'jobs' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                  <span className="ml-2 text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">{jobs.length}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-4 text-lg font-bold transition-all relative ${
                    activeTab === 'reviews' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
                  }`}
                >
                  Reviews
                  {activeTab === 'reviews' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                  <span className="ml-2 text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">{reviews.length}</span>
                </button>
              </div>
              {activeTab === 'reviews' && profile?.role === 'seeker' && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Star size={16} /> {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="wait">
                {activeTab === 'jobs' ? (
                  <motion.div
                    key="jobs-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
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
                            className="block group bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all duration-200"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                              <div className="flex-grow">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-900/30">
                                    {job.jobType.replace('-', ' ')}
                                  </span>
                                  <span className="text-[10px] md:text-xs text-gray-400 dark:text-zinc-500 font-medium">
                                    Posted {formatDistanceToNow(job.createdAt.toDate())} ago
                                  </span>
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-4">
                                  {job.title}
                                </h3>
                                <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-gray-500 dark:text-zinc-400">
                                  <div className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-600 dark:text-blue-400 md:w-4 md:h-4" /> {job.location}</div>
                                  <div className="flex items-center gap-1.5"><DollarSign size={14} className="text-blue-600 dark:text-blue-400 md:w-4 md:h-4" /> {job.salaryRange || 'Negotiable'}</div>
                                  <div className="flex items-center gap-1.5"><Clock size={14} className="text-blue-600 dark:text-blue-400 md:w-4 md:h-4" /> {job.jobType}</div>
                                </div>
                              </div>
                              <div className="flex items-center justify-end md:justify-end">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                                  <ChevronRight size={18} />
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
                  </motion.div>
                ) : (
                  <motion.div
                    key="reviews-tab"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    {showReviewForm && company && (
                      <ReviewForm 
                        companyId={id!} 
                        companyName={company.name}
                        onSuccess={() => {
                          setShowReviewForm(false);
                        }} 
                      />
                    )}
                    <ReviewList companyId={id!} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-zinc-800 lg:sticky lg:top-24">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Company Overview</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Headquarters</p>
                  <p className="text-sm md:text-base text-gray-900 dark:text-white font-bold leading-tight">{company.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Website</p>
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-sm md:text-base text-gray-900 dark:text-white font-bold hover:text-blue-600 dark:hover:text-blue-400 hover:underline break-all leading-tight"
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
                  <p className="text-[10px] md:text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Member Since</p>
                  <p className="text-sm md:text-base text-gray-900 dark:text-white font-bold leading-tight">
                    {company.createdAt ? new Date(company.createdAt.toDate()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'March 2026'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                  <Briefcase size={20} />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Active Jobs</p>
                  <p className="text-sm md:text-base text-gray-900 dark:text-white font-bold leading-tight">{jobs.length} Openings</p>
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
