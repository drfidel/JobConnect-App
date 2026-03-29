import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Job, Company, Application } from '../types';
import { MapPin, Briefcase, DollarSign, Clock, Calendar, ChevronLeft, Building2, Share2, Bookmark, Loader2, CheckCircle2, AlertCircle, FileText, Send, Star, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { jobService } from '../services/jobService';
import { companyService } from '../services/companyService';
import { applicationService } from '../services/applicationService';
import { notificationService } from '../services/notificationService';
import { profileService } from '../services/profileService';

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (job?.deadline) {
      const deadlineDate = job.deadline.toDate ? job.deadline.toDate() : new Date(job.deadline);
      setIsExpired(deadlineDate < new Date());
    } else {
      setIsExpired(false);
    }
  }, [job]);

  useEffect(() => {
    if (profile?.savedJobs && id) {
      setIsSaved(profile.savedJobs.includes(id));
    }
  }, [profile?.savedJobs, id]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const jobData = await jobService.getJobById(id);
        if (jobData) {
          setJob(jobData);
          
          // Increment view count
          await jobService.incrementViewCount(id);
          
          // Fetch company
          const companyData = await companyService.getCompanyById(jobData.companyId);
          if (companyData) {
            setCompany(companyData);
          }

          // Check if user has already applied
          if (user) {
            const hasUserApplied = await applicationService.hasUserApplied(user.uid, id);
            setHasApplied(hasUserApplied);
          }
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error("Error fetching job details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, user, navigate]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job) return;
    if (profile?.role !== 'seeker') {
      setError('Only job seekers can apply for jobs.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await applicationService.createApplication({
        jobId: job.id,
        seekerId: user.uid,
        employerId: job.employerId,
        status: 'applied',
        coverLetter,
        resumeURL: profile.photoURL || '' // Simplified for demo
      });

      // Notify Employer
      await notificationService.createNotification({
        userId: job.employerId,
        title: 'New Application',
        message: `${profile?.displayName || 'A seeker'} applied for your job: ${job.title}`,
        type: 'new_application',
        link: '/employer-dashboard'
      });

      setHasApplied(true);
      setIsApplying(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user || !id) return;
    if (profile?.role !== 'seeker') {
      setError('Only job seekers can save jobs.');
      return;
    }

    try {
      if (isSaved) {
        await profileService.removeSavedJob(user.uid, id);
        setIsSaved(false);
      } else {
        await profileService.addSavedJob(user.uid, id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Error toggling save job:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Navigation */}
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
        <ChevronLeft size={20} /> Back to Job Search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 dark:border-zinc-800">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                  {company?.logoURL ? (
                    <img src={company.logoURL} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="text-gray-300 dark:text-zinc-600" size={40} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {job.featured && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-md animate-pulse border border-yellow-300/50">
                        <Star size={12} fill="currentColor" /> Featured Role
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {job.status === 'closed' || isExpired ? (
                      <span className="px-2.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1 border border-red-100 dark:border-red-900/50 shadow-sm">
                        <XCircle size={10} fill="currentColor" /> Closed
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1 border border-green-100 dark:border-green-900/50 shadow-sm">
                        <CheckCircle2 size={10} fill="currentColor" /> Active
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-zinc-400 font-medium">
                    <Link to={`/company/${job.companyId}`} className="text-blue-600 dark:text-blue-400 hover:underline">{company?.name || 'Unknown Company'}</Link>
                    <span className="text-gray-300 dark:text-zinc-700">•</span>
                    <span className="flex items-center gap-1.5"><MapPin size={18} className="text-gray-400 dark:text-zinc-500" /> {job.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-3 text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border border-gray-100 dark:border-zinc-800">
                  <Share2 size={20} />
                </button>
                <button 
                  onClick={handleToggleSave}
                  className={`p-3 rounded-xl transition-all border ${
                    isSaved 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' 
                      : 'text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-gray-100 dark:border-zinc-800'
                  }`}
                  title={isSaved ? "Remove from saved" : "Save job"}
                >
                  <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-gray-50 dark:border-zinc-800 mb-8">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Salary</span>
                <p className="text-gray-900 dark:text-white font-bold flex items-center gap-1.5"><DollarSign size={16} className="text-blue-600 dark:text-blue-400" /> {job.salaryRange || 'Negotiable'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Job Type</span>
                <p className="text-gray-900 dark:text-white font-bold flex items-center gap-1.5"><Clock size={16} className="text-blue-600 dark:text-blue-400" /> {job.jobType}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Category</span>
                <p className="text-gray-900 dark:text-white font-bold flex items-center gap-1.5"><Briefcase size={16} className="text-blue-600 dark:text-blue-400" /> {job.category || 'General'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Posted</span>
                <p className="text-gray-900 dark:text-white font-bold flex items-center gap-1.5"><Calendar size={16} className="text-blue-600 dark:text-blue-400" /> {formatDistanceToNow(job.createdAt.toDate())} ago</p>
              </div>
              {job.deadline && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Deadline</span>
                  <p className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1.5">
                    <Calendar size={16} /> 
                    {job.deadline.toDate ? job.deadline.toDate().toLocaleDateString() : new Date(job.deadline).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="prose prose-blue dark:prose-invert max-w-none mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Job Description</h3>
              <div className="text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                <ReactMarkdown>{job.description}</ReactMarkdown>
              </div>
            </div>

            {job.requirements && job.requirements.length > 0 && (
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Job Requirements</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-zinc-300">
                  {job.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Interested in this role?</h3>
            
            {hasApplied ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="font-bold text-green-900 dark:text-green-100 mb-1">Application Sent!</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">You have already applied for this position. Track your status in the dashboard.</p>
                <Link to="/dashboard" className="text-green-700 dark:text-green-400 font-bold text-sm hover:underline">Go to Dashboard</Link>
              </div>
            ) : job.status === 'closed' || isExpired ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4">
                  <XCircle size={24} />
                </div>
                <h4 className="font-bold text-red-900 dark:text-red-100 mb-1">Job Closed</h4>
                <p className="text-sm text-red-700 dark:text-red-300">This position is no longer accepting applications.</p>
              </div>
            ) : profile?.role === 'employer' ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 text-center">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">You are logged in as an employer. Only job seekers can apply for positions.</p>
              </div>
            ) : (
              <button 
                onClick={() => setIsApplying(true)}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                Apply for this Job
              </button>
            )}

            <div className="mt-8 pt-8 border-t border-gray-50 dark:border-zinc-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">About the Company</h4>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                  {company?.logoURL ? <img src={company.logoURL} alt="Logo" className="w-full h-full object-cover" /> : <Building2 size={24} className="text-gray-300 dark:text-zinc-600" />}
                </div>
                <div>
                  <h5 className="font-bold text-gray-900 dark:text-white">{company?.name}</h5>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{company?.location}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-3 mb-4">
                {company?.description || 'No company description available.'}
              </p>
              <Link to={`/company/${job.companyId}`} className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline">View Company Profile</Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {isApplying && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsApplying(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Apply for {job.title}</h2>
                <button onClick={() => setIsApplying(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                  <AlertCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleApply} className="p-8 space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex items-center gap-4 border border-blue-100 dark:border-blue-900/30">
                    <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">Your Profile & CV</h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">We'll share your professional profile and contact info with {company?.name}.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">Cover Letter (Optional)</label>
                    <textarea 
                      rows={8}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all resize-none text-gray-900 dark:text-white"
                      placeholder="Explain why you're a great fit for this role..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsApplying(false)}
                    className="flex-grow py-4 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-grow py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Submit Application</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
