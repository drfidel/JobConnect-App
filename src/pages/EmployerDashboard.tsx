import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth, useDarkMode } from '../App';
import { Job, Application, Company, UserProfile } from '../types';
import { Plus, Briefcase, Users, Settings, Trash2, Edit2, CheckCircle, XCircle, Loader2, MapPin, DollarSign, Clock, LayoutDashboard, Building2, ChevronRight, Eye, Calendar, Search, Star, LayoutGrid, List, Activity, BarChart3, PieChart as PieChartIcon, TrendingUp, MessageSquare, Send, CheckSquare, Square, Archive, Zap } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { CATEGORIES } from '../constants';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { JobCardSkeleton, ApplicationCardSkeleton } from '../components/Skeleton';
import { jobService } from '../services/jobService';
import { applicationService } from '../services/applicationService';
import { companyService } from '../services/companyService';
import { profileService } from '../services/profileService';
import { notificationService } from '../services/notificationService';
import { messageService } from '../services/messageService';
import ApplicationDetailsModal from '../components/ApplicationDetailsModal';

export default function EmployerDashboard() {
  const { user, profile } = useAuth();
  const { isDarkMode } = useDarkMode();
  const location = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(
    (location.state as any)?.isEditingCompany || false
  );
  const [companySuccess, setCompanySuccess] = useState(false);
  const [jobSuccess, setJobSuccess] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<UserProfile | null>(null);
  const [isViewingApplicant, setIsViewingApplicant] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDeletingJob, setIsDeletingJob] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(null);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applicants' | 'company'>(
    (location.state as any)?.activeTab || 'overview'
  );
  const [applicantJobFilter, setApplicantJobFilter] = useState<string>('all');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<string>('all');
  const [applicantProfiles, setApplicantProfiles] = useState<Record<string, UserProfile>>({});
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState<'full-time' | 'part-time' | 'internship' | 'contract'>('full-time');
  const [jobSalary, setJobSalary] = useState('');
  const [jobDeadline, setJobDeadline] = useState('');
  const [jobCategory, setJobCategory] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [jobFeatured, setJobFeatured] = useState(false);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  // Company Form State
  const [compName, setCompName] = useState('');
  const [compLocation, setCompLocation] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compLogo, setCompLogo] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [bulkActionSuccess, setBulkActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch Employer's Jobs
    const unsubscribeJobs = jobService.subscribeToEmployerJobs(user.uid, setJobs);

    // Fetch Applications for Employer's Jobs
    const unsubscribeApps = applicationService.subscribeToEmployerApplications(user.uid, async (apps) => {
      setApplications(apps);
      
      // Fetch profiles for new applicants
      const uniqueSeekerIds = Array.from(new Set(apps.map(a => a.seekerId)));
      const newProfiles: Record<string, UserProfile> = { ...applicantProfiles };
      let updated = false;

      for (const seekerId of uniqueSeekerIds) {
        if (!newProfiles[seekerId]) {
          try {
            const profile = await profileService.getProfile(seekerId);
            if (profile) {
              newProfiles[seekerId] = profile;
              updated = true;
            }
          } catch (err) {
            console.error("Error fetching profile for", seekerId, err);
          }
        }
      }

      if (updated) {
        setApplicantProfiles(newProfiles);
      }
    });

    // Fetch Company Profile
    const unsubscribeCompany = companyService.subscribeToCompanyByOwner(user.uid, (compData) => {
      if (compData) {
        setCompany(compData);
        setCompName(compData.name);
        setCompLocation(compData.location);
        setCompWebsite(compData.website || '');
        setCompDesc(compData.description || '');
        setCompLogo(compData.logoURL || '');
      }
      setLoading(false);
    });

    return () => {
      unsubscribeJobs();
      unsubscribeApps();
      unsubscribeCompany();
    };
  }, [user]);

  // Auto-close expired jobs
  useEffect(() => {
    if (jobs.length > 0) {
      const now = new Date();
      jobs.forEach(async (job) => {
        if (job.status === 'active' && job.deadline) {
          const deadlineDate = job.deadline.toDate ? job.deadline.toDate() : new Date(job.deadline);
          if (deadlineDate < now) {
            try {
              await jobService.updateJob(job.id, { status: 'closed' });
            } catch (err) {
              console.error("Error auto-closing job:", err);
            }
          }
        }
      });
    }
  }, [jobs]);

  const handleAddJob = async (e: React.FormEvent, status: 'active' | 'pending' = 'active') => {
    e.preventDefault();
    if (!company) {
      alert("Please create a company profile first!");
      setActiveTab('company');
      return;
    }

    setIsSubmittingJob(true);
    try {
      const requirementsArray = jobRequirements
        .split('\n')
        .map(req => req.trim())
        .filter(req => req !== '');

      const jobData: Partial<Job> = {
        employerId: user?.uid,
        companyId: company.id,
        title: jobTitle,
        description: jobDesc,
        location: jobLocation,
        jobType,
        category: jobCategory,
        salaryRange: jobSalary,
        deadline: jobDeadline ? new Date(jobDeadline) : null,
        requirements: requirementsArray,
        featured: jobFeatured,
        status: isEditingJob ? undefined : status
      };

      if (isEditingJob && editingJobId) {
        await jobService.updateJob(editingJobId, jobData);
      } else {
        await jobService.createJob(jobData);
      }

      setIsAddingJob(false);
      setIsEditingJob(false);
      setEditingJobId(null);
      setJobTitle('');
      setJobDesc('');
      setJobLocation('');
      setJobSalary('');
      setJobType('full-time');
      setJobDeadline('');
      setJobCategory('');
      setJobRequirements('');
      setJobFeatured(false);
      
      setJobSuccess(isEditingJob ? "Job updated successfully!" : (status === 'active' ? "Job posted successfully!" : "Job saved as draft!"));
      setTimeout(() => setJobSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving job:", err);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleToggleJobStatus = async (job: Job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      await jobService.updateJob(job.id, { status: newStatus });
      setJobSuccess(`Job ${newStatus === 'active' ? 're-opened' : 'closed'} successfully!`);
      setTimeout(() => setJobSuccess(null), 3000);
    } catch (err) {
      console.error("Error toggling job status:", err);
    }
  };

  const handleEditJobClick = (job: Job) => {
    setEditingJobId(job.id);
    setJobTitle(job.title);
    setJobDesc(job.description);
    setJobLocation(job.location);
    setJobType(job.jobType);
    setJobSalary(job.salaryRange || '');
    setJobCategory(job.category || '');
    setJobRequirements(job.requirements?.join('\n') || '');
    setJobFeatured(job.featured || false);
    if (job.deadline) {
      const date = job.deadline.toDate ? job.deadline.toDate() : new Date(job.deadline);
      setJobDeadline(date.toISOString().split('T')[0]);
    } else {
      setJobDeadline('');
    }
    setIsEditingJob(true);
    setIsAddingJob(true);
  };

  const handleViewApplicant = async (seekerId: string) => {
    try {
      const applicantProfile = await profileService.getProfile(seekerId);
      if (applicantProfile) {
        setSelectedApplicant(applicantProfile);
        setIsViewingApplicant(true);
        setShowChat(false);
        setMessageContent('');
      }
    } catch (err) {
      console.error("Error fetching applicant profile:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !user || !selectedApplicant) return;

    setIsSending(true);
    try {
      // Find the application for this seeker
      const app = applications.find(a => a.seekerId === selectedApplicant.uid);
      if (app) {
        await messageService.sendMessage(
          app.id,
          user.uid,
          selectedApplicant.uid,
          messageContent.trim()
        );
        setMessageContent('');
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (isViewingApplicant && selectedApplicant) {
      const app = applications.find(a => a.seekerId === selectedApplicant.uid);
      if (app) {
        const unsubscribe = messageService.subscribeToApplicationMessages(app.id, setMessages);
        return () => unsubscribe();
      }
    }
  }, [isViewingApplicant, selectedApplicant, applications]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const companyData = {
        ownerId: user.uid,
        name: compName,
        location: compLocation,
        website: compWebsite,
        description: compDesc,
        logoURL: compLogo,
      };

      if (company) {
        await companyService.updateCompany(company.id, companyData);
      } else {
        await companyService.createCompany(companyData);
      }
      setCompanySuccess(true);
      setTimeout(() => setCompanySuccess(false), 3000);
    } catch (err) {
      console.error("Error saving company:", err);
    }
  };

  const handleUpdateAppStatus = async (appId: string, seekerId: string, jobTitle: string, status: 'reviewed' | 'accepted' | 'rejected') => {
    try {
      await applicationService.updateApplicationStatus(appId, status);

      // Notify Seeker
      await notificationService.createNotification({
        userId: seekerId,
        title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your application for "${jobTitle}" has been ${status}.`,
        type: 'status_change',
        link: '/seeker-dashboard',
      });

      setStatusUpdateSuccess(`Application for "${jobTitle}" marked as ${status}.`);
      setTimeout(() => setStatusUpdateSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating application:", err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    setJobToDelete(jobId);
    setIsDeletingJob(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    try {
      await jobService.deleteJob(jobToDelete);
      setIsDeletingJob(false);
      setJobToDelete(null);
    } catch (err) {
      console.error("Error deleting job:", err);
    }
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobIds(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId) 
        : [...prev, jobId]
    );
  };

  const selectAllJobs = () => {
    const filteredJobs = jobs.filter(j => statusFilter === 'all' || j.status === statusFilter);
    if (selectedJobIds.length === filteredJobs.length && filteredJobs.length > 0) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(filteredJobs.map(j => j.id));
    }
  };

  const handleBulkClose = async () => {
    if (selectedJobIds.length === 0) return;
    setIsBulkActionLoading(true);
    try {
      await Promise.all(selectedJobIds.map(id => jobService.updateJob(id, { status: 'closed' })));
      setBulkActionSuccess(`Successfully closed ${selectedJobIds.length} jobs`);
      setSelectedJobIds([]);
      setTimeout(() => setBulkActionSuccess(null), 3000);
    } catch (err) {
      console.error("Error closing jobs in bulk:", err);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedJobIds.length} jobs? This action cannot be undone.`)) return;
    
    setIsBulkActionLoading(true);
    try {
      await Promise.all(selectedJobIds.map(id => jobService.deleteJob(id)));
      setBulkActionSuccess(`Successfully deleted ${selectedJobIds.length} jobs`);
      setSelectedJobIds([]);
      setTimeout(() => setBulkActionSuccess(null), 3000);
    } catch (err) {
      console.error("Error deleting jobs in bulk:", err);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Prepare chart data
  const jobPerformanceData = jobs.map(job => ({
    name: job.title.length > 15 ? job.title.substring(0, 15) + '...' : job.title,
    applications: applications.filter(a => a.jobId === job.id).length,
    views: job.viewCount || 0
  })).slice(0, 5);

  const statusDistribution = [
    { name: 'Applied', value: applications.filter(a => a.status === 'applied').length, color: '#94a3b8' },
    { name: 'Reviewed', value: applications.filter(a => a.status === 'reviewed').length, color: '#3b82f6' },
    { name: 'Accepted', value: applications.filter(a => a.status === 'accepted').length, color: '#22c55e' },
    { name: 'Rejected', value: applications.filter(a => a.status === 'rejected').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const recentApplications = [...applications]
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-50 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-gray-50 dark:bg-zinc-800 rounded-lg animate-pulse" />
          </div>
          <div className="h-12 w-48 bg-gray-50 dark:bg-zinc-800 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => <JobCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Employer Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your job listings and track applicants.</p>
        </div>
        {!company ? (
          <button 
            onClick={() => { setActiveTab('company'); setIsEditingCompany(true); }}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
          >
            <Building2 size={20} /> Create Company Profile
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              to="/pricing"
              className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Zap size={20} className="text-blue-600 dark:text-blue-400" /> View Pricing
            </Link>
            <button 
              onClick={() => setIsAddingJob(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={20} /> Post a New Job
            </button>
          </div>
        )}
      </div>
      
      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 md:gap-5 transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Briefcase size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Jobs</p>
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{jobs.length}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 md:gap-5 transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
            <Users size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Applications</p>
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{applications.length}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 md:gap-5 transition-all hover:shadow-md sm:col-span-2 lg:col-span-1"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <LayoutDashboard size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg. Apps / Job</p>
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {jobs.length > 0 ? (applications.length / jobs.length).toFixed(1) : '0.0'}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar transition-colors duration-300">
        <div className="flex min-w-full md:min-w-0">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'jobs', label: 'My Jobs', icon: Briefcase },
            { id: 'applicants', label: 'Applicants', icon: Users },
            { id: 'company', label: 'Company Profile', icon: Building2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap flex-1 md:flex-none justify-center ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon size={16} className="md:w-[18px] md:h-[18px]" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {jobSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-[100] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold"
          >
            <CheckCircle size={20} />
            {jobSuccess}
          </motion.div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Job Performance Chart */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="text-blue-600 dark:text-blue-400" /> Job Performance
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">Top 5 Jobs</span>
                </div>
                <div className="h-[300px] w-full">
                  {jobPerformanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={jobPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: isDarkMode ? '#111827' : '#fff', color: isDarkMode ? '#fff' : '#000' }}
                          cursor={{ fill: isDarkMode ? '#1f2937' : '#f8fafc' }}
                        />
                        <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <BarChart3 size={48} className="mb-4 opacity-20" />
                      <p>No job data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Application Status Chart */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <PieChartIcon className="text-blue-600 dark:text-blue-400" /> Application Status
                  </h3>
                </div>
                <div className="h-[300px] w-full">
                  {statusDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: isDarkMode ? '#111827' : '#fff', color: isDarkMode ? '#fff' : '#000' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <PieChartIcon size={48} className="mb-4 opacity-20" />
                      <p>No application data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
              <div className="p-5 md:p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="text-blue-600 dark:text-blue-400" /> Recent Applications
                </h3>
                <button 
                   onClick={() => setActiveTab('applicants')}
                  className="text-xs md:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentApplications.length > 0 ? (
                  recentApplications.map(app => {
                    const job = jobs.find(j => j.id === app.jobId);
                    const applicant = applicantProfiles[app.seekerId];
                    return (
                      <div key={app.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold group-hover:scale-110 transition-transform text-sm md:text-base">
                            {applicant?.displayName ? applicant.displayName.substring(0, 2).toUpperCase() : app.seekerId.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm md:text-base">New application for {job?.title || 'Unknown Job'}</p>
                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">{formatDistanceToNow(app.createdAt?.toDate ? app.createdAt.toDate() : new Date(app.createdAt))} ago</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleViewApplicant(app.seekerId)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-all"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-gray-400">
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={selectAllJobs}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedJobIds.length > 0 && selectedJobIds.length === jobs.filter(j => statusFilter === 'all' || j.status === statusFilter).length
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-500'
                    }`}
                  >
                    {selectedJobIds.length > 0 && selectedJobIds.length === jobs.filter(j => statusFilter === 'all' || j.status === statusFilter).length ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                    {selectedJobIds.length > 0 && selectedJobIds.length === jobs.filter(j => statusFilter === 'all' || j.status === statusFilter).length ? 'Deselect All' : 'Select All'}
                  </button>
                  <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-2">Filter:</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setSelectedJobIds([]);
                    }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    title="Grid View"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    title="Table View"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => setIsAddingJob(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md"
              >
                <Plus size={18} /> Post a New Job
              </button>
            </div>

            <div className="space-y-4">
              {/* Bulk Actions Bar */}
              <AnimatePresence>
                {selectedJobIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-xl">
                        <CheckSquare size={20} />
                      </div>
                      <span className="font-bold">{selectedJobIds.length} jobs selected</span>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={handleBulkClose}
                        disabled={isBulkActionLoading}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20"
                      >
                        {isBulkActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}
                        Close Selected
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        disabled={isBulkActionLoading}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold transition-all shadow-sm"
                      >
                        {isBulkActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Delete Selected
                      </button>
                      <button
                        onClick={() => setSelectedJobIds([])}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all"
                        title="Clear Selection"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message for Bulk Actions */}
              <AnimatePresence>
                {bulkActionSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-green-500 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3"
                  >
                    <CheckCircle size={20} />
                    <span className="font-bold">{bulkActionSuccess}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {jobs.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                  <Briefcase className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No jobs posted yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 px-4">Start hiring by posting your first job opportunity.</p>
                  <button 
                    onClick={() => setIsAddingJob(true)}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Post your first job
                  </button>
                </div>
              ) : (
                <>
                  {jobs.filter(j => statusFilter === 'all' || j.status === statusFilter).length > 0 ? (
                    viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {jobs
                          .filter(j => statusFilter === 'all' || j.status === statusFilter)
                          .map(job => (
                            <div 
                              key={job.id} 
                              onClick={() => toggleJobSelection(job.id)}
                              className={`p-5 md:p-6 rounded-2xl border transition-all group flex flex-col h-full cursor-pointer relative ${
                                selectedJobIds.includes(job.id)
                                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-900/10'
                                  : job.featured
                                    ? 'bg-slate-900/5 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 shadow-md'
                                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:border-blue-100 dark:hover:border-blue-900'
                              }`}
                            >
                              <div className="absolute top-4 right-4 z-10">
                                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                                  selectedJobIds.includes(job.id)
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-transparent'
                                }`}>
                                  <CheckSquare size={14} />
                                </div>
                              </div>
                              <div className="flex-grow">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    job.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {job.status}
                                  </span>
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                    Posted {formatDistanceToNow(job.createdAt?.toDate() || new Date())} ago
                                  </span>
                                  {job.deadline && job.status === 'active' && (
                                    (() => {
                                      const deadlineDate = job.deadline.toDate ? job.deadline.toDate() : new Date(job.deadline);
                                      const daysLeft = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                      if (daysLeft >= 0 && daysLeft <= 3) {
                                        return (
                                          <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider border border-orange-100 dark:border-orange-900/50 animate-pulse">
                                            Expiring Soon ({daysLeft}d)
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()
                                  )}
                                </div>
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                    {job.title}
                                    {job.featured && (
                                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold rounded-full border border-yellow-100 dark:border-yellow-900/50 uppercase tracking-wider">
                                        <Star size={10} fill="currentColor" /> Featured
                                      </span>
                                    )}
                                  </h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] md:text-[11px] font-bold rounded-lg border border-blue-100 dark:border-blue-900/50">
                                    <Users size={14} />
                                    {applications.filter(a => a.jobId === job.id).length} Apps
                                  </div>
                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] md:text-[11px] font-bold rounded-lg border border-gray-100 dark:border-gray-700">
                                    <Eye size={14} />
                                    {job.viewCount || 0} Views
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400 mb-6">
                                  <div className="flex items-center gap-1.5"><MapPin size={14} /> {job.location}</div>
                                  <div className="flex items-center gap-1.5"><Clock size={14} /> {job.jobType}</div>
                                  {job.deadline && (
                                    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-medium">
                                      <Calendar size={14} /> 
                                      {job.deadline.toDate ? job.deadline.toDate().toLocaleDateString() : new Date(job.deadline).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800 mt-auto">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setApplicantJobFilter(job.id);
                                    setActiveTab('applicants');
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                                >
                                  View Applicants
                                </button>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleJobStatus(job);
                                    }}
                                    className={`p-2 rounded-lg transition-all ${
                                      job.status === 'active' 
                                        ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                    }`}
                                    title={job.status === 'active' ? 'Close Job' : 'Re-open Job'}
                                  >
                                    {job.status === 'active' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditJobClick(job);
                                    }}
                                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" 
                                    title="Edit"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteJob(job.id);
                                    }}
                                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                                    title="Delete"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 w-10">
                                  <button
                                    onClick={selectAllJobs}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                      selectedJobIds.length > 0 && selectedJobIds.length === jobs.filter(j => statusFilter === 'all' || j.status === statusFilter).length
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-transparent'
                                    }`}
                                  >
                                    <CheckSquare size={12} />
                                  </button>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Applications</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Views</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Posted Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                              {jobs
                                .filter(j => statusFilter === 'all' || j.status === statusFilter)
                                .map(job => (
                                  <tr 
                                    key={job.id} 
                                    onClick={() => toggleJobSelection(job.id)}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group cursor-pointer ${
                                      selectedJobIds.includes(job.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                    }`}
                                  >
                                    <td className="px-6 py-4">
                                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                        selectedJobIds.includes(job.id)
                                          ? 'bg-blue-600 border-blue-600 text-white'
                                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-transparent'
                                      }`}>
                                        <CheckSquare size={12} />
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{job.title}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        job.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                      }`}>
                                        {job.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-100 dark:border-blue-900/50">
                                        {applications.filter(a => a.jobId === job.id).length}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{job.viewCount || 0}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-sm text-gray-500 dark:text-gray-400">{formatDistanceToNow(job.createdAt?.toDate() || new Date())} ago</span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center justify-end gap-2">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleJobStatus(job);
                                          }}
                                          className={`p-2 rounded-lg transition-all ${
                                            job.status === 'active' 
                                              ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                          }`}
                                          title={job.status === 'active' ? 'Close Job' : 'Re-open Job'}
                                        >
                                          {job.status === 'active' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setApplicantJobFilter(job.id);
                                            setActiveTab('applicants');
                                          }}
                                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                          title="View Applicants"
                                        >
                                          <Users size={18} />
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditJobClick(job);
                                          }}
                                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" 
                                          title="Edit"
                                        >
                                          <Edit2 size={18} />
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteJob(job.id);
                                          }}
                                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                                          title="Delete"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                      <Search className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No jobs match this filter</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">Try selecting a different status or clear the filter.</p>
                      <button 
                        onClick={() => setStatusFilter('all')}
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                      >
                        Clear filter
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'applicants' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
            <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="text-blue-600 dark:text-blue-400" /> All Applications
              </h3>
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2 flex-1 md:flex-none">
                  <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Job:</span>
                  <select 
                    className="flex-1 md:flex-none px-3 py-1.5 md:px-4 md:py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-blue-500 dark:text-white outline-none"
                    value={applicantJobFilter}
                    onChange={(e) => setApplicantJobFilter(e.target.value)}
                  >
                    <option value="all">All Jobs</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 flex-1 md:flex-none">
                  <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <select 
                    className="flex-1 md:flex-none px-3 py-1.5 md:px-4 md:py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-blue-500 dark:text-white outline-none"
                    value={applicationStatusFilter}
                    onChange={(e) => setApplicationStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="applied">Applied</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {statusUpdateSuccess && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/30 p-4 flex items-center gap-3 text-green-700 dark:text-green-400 text-xs md:text-sm font-bold"
                >
                  <CheckCircle size={18} />
                  {statusUpdateSuccess}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applicant</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Applied</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {applications
                    .filter(app => (applicantJobFilter === 'all' || app.jobId === applicantJobFilter) && (applicationStatusFilter === 'all' || app.status === applicationStatusFilter))
                    .length > 0 ? (
                    applications
                      .filter(app => (applicantJobFilter === 'all' || app.jobId === applicantJobFilter) && (applicationStatusFilter === 'all' || app.status === applicationStatusFilter))
                      .map(app => {
                      const job = jobs.find(j => j.id === app.jobId);
                      const applicant = applicantProfiles[app.seekerId];
                      return (
                        <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden shrink-0">
                                {applicant?.photoURL ? (
                                  <img src={applicant.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  (applicant?.displayName || 'A').substring(0, 1).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white">{applicant?.displayName || 'Anonymous Applicant'}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <button 
                                    onClick={() => handleViewApplicant(app.seekerId)}
                                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
                                  >
                                    View Profile
                                  </button>
                                  <span className="text-[10px] text-gray-300">•</span>
                                  <button 
                                    onClick={() => setSelectedApplication(app)}
                                    className="text-[10px] text-gray-500 dark:text-gray-400 hover:underline font-bold"
                                  >
                                    View Application
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{job?.title || 'Unknown Job'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(app.createdAt?.toDate() || new Date())} ago
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              app.status === 'accepted' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                              app.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                              app.status === 'reviewed' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                              'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {app.status !== 'reviewed' && app.status !== 'accepted' && app.status !== 'rejected' && (
                                <button 
                                  onClick={() => handleUpdateAppStatus(app.id, app.seekerId, job?.title || 'Unknown Job', 'reviewed')}
                                  className="flex items-center gap-1 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all text-xs font-bold border border-blue-100 dark:border-blue-900/30" 
                                  title="Mark as Reviewed"
                                >
                                  <Clock size={14} /> Reviewed
                                </button>
                              )}
                              {app.status !== 'accepted' && (
                                <button 
                                  onClick={() => handleUpdateAppStatus(app.id, app.seekerId, job?.title || 'Unknown Job', 'accepted')}
                                  className="flex items-center gap-1 px-3 py-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all text-xs font-bold border border-green-100 dark:border-green-900/30" 
                                  title="Accept Applicant"
                                >
                                  <CheckCircle size={14} /> Accept
                                </button>
                              )}
                              {app.status !== 'rejected' && (
                                <button 
                                  onClick={() => handleUpdateAppStatus(app.id, app.seekerId, job?.title || 'Unknown Job', 'rejected')}
                                  className="flex items-center gap-1 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all text-xs font-bold border border-red-100 dark:border-red-900/30" 
                                  title="Reject Applicant"
                                >
                                  <XCircle size={14} /> Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-gray-500 dark:text-gray-400">
                        No applications received yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-800">
              {applications
                .filter(app => (applicantJobFilter === 'all' || app.jobId === applicantJobFilter) && (applicationStatusFilter === 'all' || app.status === applicationStatusFilter))
                .length > 0 ? (
                applications
                  .filter(app => (applicantJobFilter === 'all' || app.jobId === applicantJobFilter) && (applicationStatusFilter === 'all' || app.status === applicationStatusFilter))
                  .map(app => {
                  const job = jobs.find(j => j.id === app.jobId);
                  const applicant = applicantProfiles[app.seekerId];
                  return (
                    <div key={app.id} className="p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden shrink-0">
                            {applicant?.photoURL ? (
                              <img src={applicant.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (applicant?.displayName || 'A').substring(0, 1).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-sm">{applicant?.displayName || 'Anonymous Applicant'}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">Applied for: {job?.title || 'Unknown Job'}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          app.status === 'accepted' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                          app.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                          app.status === 'reviewed' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                          'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-[10px] text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1"><Calendar size={12} /> {formatDistanceToNow(app.createdAt?.toDate() || new Date())} ago</div>
                        <button onClick={() => handleViewApplicant(app.seekerId)} className="text-blue-600 dark:text-blue-400 font-bold">View Profile</button>
                        <button onClick={() => setSelectedApplication(app)} className="text-blue-600 dark:text-blue-400 font-bold">View Application</button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <button 
                          onClick={() => handleUpdateAppStatus(app.id, app.seekerId, job?.title || 'Unknown Job', 'reviewed')}
                          disabled={app.status === 'reviewed' || app.status === 'accepted' || app.status === 'rejected'}
                          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 disabled:opacity-30"
                        >
                          <Clock size={16} />
                          <span className="text-[9px] font-bold uppercase">Review</span>
                        </button>
                        <button 
                          onClick={() => handleUpdateAppStatus(app.id, app.seekerId, job?.title || 'Unknown Job', 'accepted')}
                          disabled={app.status === 'accepted'}
                          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400 disabled:opacity-30"
                        >
                          <CheckCircle size={16} />
                          <span className="text-[9px] font-bold uppercase">Accept</span>
                        </button>
                        <button 
                          onClick={() => handleUpdateAppStatus(app.id, app.seekerId, job?.title || 'Unknown Job', 'rejected')}
                          disabled={app.status === 'rejected'}
                          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 disabled:opacity-30"
                        >
                          <XCircle size={16} />
                          <span className="text-[9px] font-bold uppercase">Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No applications received yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm max-w-4xl transition-colors duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="text-blue-600 dark:text-blue-400" /> Company Profile
              </h3>
              {company && (
                <Link 
                  to={`/company/${company.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <Eye size={18} /> View Public Profile
                </Link>
              )}
            </div>

            {companySuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-2xl flex items-center gap-3 text-green-700 dark:text-green-400"
              >
                <CheckCircle size={20} />
                <span className="font-bold">Company profile updated successfully!</span>
              </motion.div>
            )}

            {company || isEditingCompany ? (
              <form onSubmit={handleSaveCompany} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all dark:text-white"
                        placeholder="e.g. Tech Uganda Ltd"
                        value={compName}
                        onChange={(e) => setCompName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Location</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all dark:text-white"
                        placeholder="e.g. Kampala, Uganda"
                        value={compLocation}
                        onChange={(e) => setCompLocation(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Website</label>
                      <input 
                        type="url" 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all dark:text-white"
                        placeholder="https://example.com"
                        value={compWebsite}
                        onChange={(e) => setCompWebsite(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Logo URL</label>
                      <div className="space-y-2">
                        <input 
                          type="url" 
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all dark:text-white"
                          placeholder="https://example.com/logo.png"
                          value={compLogo}
                          onChange={(e) => setCompLogo(e.target.value)}
                        />
                        {compLogo && (
                          <div className="w-16 h-16 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                            <img 
                              src={compLogo} 
                              alt="Logo Preview" 
                              className="w-full h-full object-cover" 
                              onError={(e) => (e.currentTarget.style.display = 'none')} 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Company Description</label>
                      <textarea 
                        required
                        rows={5}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all resize-none dark:text-white"
                        placeholder="Tell us about your company..."
                        value={compDesc}
                        onChange={(e) => setCompDesc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                  >
                    {company ? 'Update Profile' : 'Create Profile'}
                  </button>
                  {isEditingCompany && !company && (
                    <button 
                      type="button"
                      onClick={() => setIsEditingCompany(false)}
                      className="px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-6">
                  <Building2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Setup your Company Profile</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">You need to create a company profile before you can start posting job listings on the platform.</p>
                <button 
                  onClick={() => setIsEditingCompany(true)}
                  className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl hover:bg-blue-700 transition-all transform hover:-translate-y-1"
                >
                  Create Company Profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Job Modal */}
      <AnimatePresence>
        {isAddingJob && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingJob(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 md:p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{isEditingJob ? 'Edit Job Listing' : 'Post a New Job'}</h2>
                <button onClick={() => { setIsAddingJob(false); setIsEditingJob(false); setEditingJobId(null); setJobRequirements(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleAddJob} className="p-5 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Job Title</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all dark:text-white"
                      placeholder="e.g. Senior Software Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Location</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all dark:text-white"
                        placeholder="e.g. Kampala, Uganda"
                        value={jobLocation}
                        onChange={(e) => setJobLocation(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Job Type</label>
                      <select 
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all dark:text-white"
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value as any)}
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="internship">Internship</option>
                        <option value="contract">Contract</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Job Category</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all dark:text-white"
                      value={jobCategory}
                      onChange={(e) => setJobCategory(e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Salary Range (Optional)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all dark:text-white"
                      placeholder="e.g. UGX 2M - 4M"
                      value={jobSalary}
                      onChange={(e) => setJobSalary(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Application Deadline (Optional)</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="date" 
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all dark:text-white"
                        value={jobDeadline}
                        onChange={(e) => setJobDeadline(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Job Description</label>
                    <textarea 
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all resize-none dark:text-white"
                      placeholder="Describe the role, responsibilities, and requirements..."
                      value={jobDesc}
                      onChange={(e) => setJobDesc(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Job Requirements (One per line)</label>
                    <textarea 
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all resize-none dark:text-white"
                      placeholder="e.g. 3+ years of React experience&#10;Bachelor's in Computer Science&#10;Excellent communication skills"
                      value={jobRequirements}
                      onChange={(e) => setJobRequirements(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                    <input 
                      type="checkbox"
                      id="featured"
                      className="w-5 h-5 rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                      checked={jobFeatured}
                      onChange={(e) => setJobFeatured(e.target.checked)}
                    />
                    <label htmlFor="featured" className="flex items-center gap-2 text-sm font-bold text-yellow-800 dark:text-yellow-400 cursor-pointer">
                      <Star size={16} fill={jobFeatured ? "currentColor" : "none"} />
                      Feature this job listing (highlighted at the top)
                    </label>
                  </div>
                </div>
                <div className="pt-6 flex flex-wrap gap-4">
                  <button 
                    type="button"
                    onClick={() => { setIsAddingJob(false); setIsEditingJob(false); setEditingJobId(null); setJobFeatured(false); }}
                    className="flex-grow py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  {!isEditingJob && (
                    <button 
                      type="button"
                      disabled={isSubmittingJob}
                      onClick={(e) => handleAddJob(e, 'pending')}
                      className="flex-grow py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingJob ? <Loader2 size={18} className="animate-spin" /> : <Archive size={18} />}
                      Save as Draft
                    </button>
                  )}
                  <button 
                    type="submit"
                    disabled={isSubmittingJob}
                    className="flex-grow py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {isSubmittingJob ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {isEditingJob ? 'Update Listing' : 'Post Job Now'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Job Confirmation Modal */}
      <AnimatePresence>
        {isDeletingJob && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeletingJob(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 md:p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Delete Job Listing?</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">This action cannot be undone. All applications associated with this job will remain but the listing will be removed.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsDeletingJob(false)}
                  className="flex-grow py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteJob}
                  className="flex-grow py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Applicant Profile Modal */}
      <AnimatePresence>
        {isViewingApplicant && selectedApplicant && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViewingApplicant(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 md:p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Applicant Profile</h2>
                <button onClick={() => setIsViewingApplicant(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-5 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-bold overflow-hidden">
                    {selectedApplicant.photoURL ? <img src={selectedApplicant.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : selectedApplicant.displayName?.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedApplicant.displayName || 'Anonymous Applicant'}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{selectedApplicant.email}</p>
                  </div>
                </div>

                {selectedApplicant.bio && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">About</h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedApplicant.bio}</p>
                  </div>
                )}

                {selectedApplicant.skills && selectedApplicant.skills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplicant.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApplicant.resumeURL && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Resume</h4>
                    <a 
                      href={selectedApplicant.resumeURL} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      <Eye size={18} /> View Resume
                    </a>
                  </div>
                )}
              </div>
              <div className="p-5 md:p-8 bg-gray-50 dark:bg-gray-800/50 flex flex-col gap-4">
                {!showChat ? (
                  <button 
                    onClick={() => setShowChat(true)}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={18} /> Send Message
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-40 overflow-y-auto space-y-2 mb-2 custom-scrollbar">
                      {messages.length === 0 ? (
                        <p className="text-center text-gray-400 text-xs italic py-2">No messages yet.</p>
                      ) : (
                        messages.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.senderId === user?.uid ? 'items-end' : 'items-start'}`}>
                            <div className={`px-3 py-1.5 rounded-xl text-xs max-w-[80%] ${
                              msg.senderId === user?.uid 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input 
                        type="text"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                      />
                      <button 
                        type="submit"
                        disabled={isSending || !messageContent.trim()}
                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowChat(false)}
                        className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                      >
                        <XCircle size={18} />
                      </button>
                    </form>
                  </div>
                )}
                <button 
                  onClick={() => setIsViewingApplicant(false)}
                  className="w-full py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedApplication && (
          <ApplicationDetailsModal
            application={selectedApplication}
            job={jobs.find(j => j.id === selectedApplication.jobId)}
            company={company || undefined}
            applicant={applicantProfiles[selectedApplication.seekerId]}
            onClose={() => setSelectedApplication(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
