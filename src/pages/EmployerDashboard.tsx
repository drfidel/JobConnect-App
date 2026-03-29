import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth, useDarkMode } from '../App';
import { Job, Application, Company, UserProfile } from '../types';
import { Plus, Briefcase, Users, Settings, Trash2, Edit2, CheckCircle, XCircle, Loader2, MapPin, DollarSign, Clock, LayoutDashboard, Building2, ChevronRight, Eye, Calendar, Search, Star, LayoutGrid, List, Activity, BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
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
import { jobService } from '../services/jobService';
import { applicationService } from '../services/applicationService';
import { companyService } from '../services/companyService';
import { profileService } from '../services/profileService';
import { notificationService } from '../services/notificationService';

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
  const [selectedApplicant, setSelectedApplicant] = useState<UserProfile | null>(null);
  const [isViewingApplicant, setIsViewingApplicant] = useState(false);
  const [isDeletingJob, setIsDeletingJob] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(null);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applicants' | 'company'>(
    (location.state as any)?.activeTab || 'overview'
  );
  const [applicantJobFilter, setApplicantJobFilter] = useState<string>('all');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<string>('all');
  const [applicantProfiles, setApplicantProfiles] = useState<Record<string, UserProfile>>({});
  
  // Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState<'full-time' | 'part-time' | 'internship' | 'contract'>('full-time');
  const [jobSalary, setJobSalary] = useState('');
  const [jobDeadline, setJobDeadline] = useState('');
  const [jobCategory, setJobCategory] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');

  // Company Form State
  const [compName, setCompName] = useState('');
  const [compLocation, setCompLocation] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compLogo, setCompLogo] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) {
      alert("Please create a company profile first!");
      setActiveTab('company');
      return;
    }

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
        requirements: requirementsArray
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
      setJobDeadline('');
      setJobCategory('');
      setJobRequirements('');
    } catch (err) {
      console.error("Error saving job:", err);
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
      }
    } catch (err) {
      console.error("Error fetching applicant profile:", err);
    }
  };

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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Employer Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your job listings and track applicants.</p>
        </div>
        {!company ? (
          <button 
            onClick={() => { setActiveTab('company'); setIsEditingCompany(true); }}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
          >
            <Building2 size={20} /> Create Company Profile
          </button>
        ) : (
          <button 
            onClick={() => setIsAddingJob(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={20} /> Post a New Job
          </button>
        )}
      </div>
      
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-5 transition-all hover:shadow-md"
        >
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Briefcase size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Jobs</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{jobs.length}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-5 transition-all hover:shadow-md"
        >
          <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Applications</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{applications.length}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-5 transition-all hover:shadow-md"
        >
          <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg. Apps / Job</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {jobs.length > 0 ? (applications.length / jobs.length).toFixed(1) : '0.0'}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit transition-colors duration-300">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'jobs', label: 'My Jobs', icon: Briefcase },
          { id: 'applicants', label: 'Applicants', icon: Users },
          { id: 'company', label: 'Company Profile', icon: Building2 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
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
              <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="text-blue-600 dark:text-blue-400" /> Recent Applications
                </h3>
                <button 
                  onClick={() => setActiveTab('applicants')}
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentApplications.length > 0 ? (
                  recentApplications.map(app => {
                    const job = jobs.find(j => j.id === app.jobId);
                    return (
                      <div key={app.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold group-hover:scale-110 transition-transform">
                            {app.seekerId.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">New application for {job?.title || 'Unknown Job'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDistanceToNow(app.createdAt?.toDate ? app.createdAt.toDate() : new Date(app.createdAt))} ago</p>
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filter by Status:</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
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
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Showing {jobs.filter(j => statusFilter === 'all' || j.status === statusFilter).length} jobs
              </p>
            </div>

            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                  <Briefcase className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No jobs posted yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Start hiring by posting your first job opportunity.</p>
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
                      <div className="grid grid-cols-1 gap-4">
                        {jobs
                          .filter(j => statusFilter === 'all' || j.status === statusFilter)
                          .map(job => (
                            <div key={job.id} className={`p-6 rounded-2xl border transition-all group ${
                              job.featured
                                ? 'bg-slate-900/5 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 shadow-md'
                                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:border-blue-100 dark:hover:border-blue-900'
                            }`}>
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-grow">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      job.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                    }`}>
                                      {job.status}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                      Posted {formatDistanceToNow(job.createdAt?.toDate() || new Date())} ago
                                    </span>
                                    {job.deadline && job.status === 'active' && (
                                      (() => {
                                        const deadlineDate = job.deadline.toDate ? job.deadline.toDate() : new Date(job.deadline);
                                        const daysLeft = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                        if (daysLeft >= 0 && daysLeft <= 3) {
                                          return (
                                            <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider border border-orange-100 dark:border-orange-900/50 animate-pulse">
                                              Expiring Soon ({daysLeft} days)
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                      {job.title}
                                      {job.featured && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold rounded-full border border-yellow-100 dark:border-yellow-900/50 uppercase tracking-wider">
                                          <Star size={10} fill="currentColor" /> Featured
                                        </span>
                                      )}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold rounded-lg border border-blue-100 dark:border-blue-900/50">
                                      <Users size={14} />
                                      {applications.filter(a => a.jobId === job.id).length} Applications
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[11px] font-bold rounded-lg border border-gray-100 dark:border-gray-700">
                                      <Eye size={14} />
                                      {job.viewCount || 0} Views
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1.5"><MapPin size={16} /> {job.location}</div>
                                    <div className="flex items-center gap-1.5"><Clock size={16} /> {job.jobType}</div>
                                    {job.deadline && (
                                      <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-medium">
                                        <Calendar size={16} /> 
                                        Deadline: {job.deadline.toDate ? job.deadline.toDate().toLocaleDateString() : new Date(job.deadline).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      setApplicantJobFilter(job.id);
                                      setActiveTab('applicants');
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                                  >
                                    View Applicants
                                  </button>
                                  <button 
                                    onClick={() => handleEditJobClick(job)}
                                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" 
                                    title="Edit"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteJob(job.id)}
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
                                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
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
                                          onClick={() => {
                                            setApplicantJobFilter(job.id);
                                            setActiveTab('applicants');
                                          }}
                                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                          title="View Applicants"
                                        >
                                          <Users size={18} />
                                        </button>
                                        <button 
                                          onClick={() => handleEditJobClick(job)}
                                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" 
                                          title="Edit"
                                        >
                                          <Edit2 size={18} />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteJob(job.id)}
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
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="text-blue-600 dark:text-blue-400" /> All Applications
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Job:</span>
                  <select 
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                    value={applicantJobFilter}
                    onChange={(e) => setApplicantJobFilter(e.target.value)}
                  >
                    <option value="all">All Jobs</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <select 
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
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
                  className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/30 p-4 flex items-center gap-3 text-green-700 dark:text-green-400 text-sm font-bold"
                >
                  <CheckCircle size={18} />
                  {statusUpdateSuccess}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="overflow-x-auto">
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
                              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden">
                                {applicant?.photoURL ? (
                                  <img src={applicant.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  (applicant?.displayName || 'A').substring(0, 1).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white">{applicant?.displayName || 'Anonymous Applicant'}</div>
                                <button 
                                  onClick={() => handleViewApplicant(app.seekerId)}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  View Profile
                                </button>
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
              <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditingJob ? 'Edit Job Listing' : 'Post a New Job'}</h2>
                <button onClick={() => { setIsAddingJob(false); setIsEditingJob(false); setEditingJobId(null); setJobRequirements(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleAddJob} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
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
                </div>
                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddingJob(false)}
                    className="flex-grow py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-grow py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                  >
                    {isEditingJob ? 'Update Job' : 'Post Job'}
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
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 text-center"
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
              <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Applicant Profile</h2>
                <button onClick={() => setIsViewingApplicant(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
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
              <div className="p-8 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                <button 
                  onClick={() => setIsViewingApplicant(false)}
                  className="px-8 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
