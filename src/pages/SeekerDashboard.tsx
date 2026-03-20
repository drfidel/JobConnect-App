import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { Job, Application, Company, JobAlert } from '../types';
import { Briefcase, CheckCircle, Clock, XCircle, Search, MapPin, DollarSign, Loader2, User, FileText, Bookmark, ChevronRight, LayoutDashboard, Settings, Bell, Plus, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function SeekerDashboard() {
  const { user, profile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'saved' | 'profile' | 'alerts'>('applications');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Job Alert Form State
  const [alertKeywords, setAlertKeywords] = useState('');
  const [alertLocation, setAlertLocation] = useState('');
  const [alertJobType, setAlertJobType] = useState('all');
  const [isAddingAlert, setIsAddingAlert] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch Seeker's Applications
    const appsRef = collection(db, 'applications');
    const qApps = query(appsRef, where('seekerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribeApps = onSnapshot(qApps, async (snapshot) => {
      const appsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      setApplications(appsData);

      // Fetch related jobs and companies
      const jobIds = Array.from(new Set(appsData.map(a => a.jobId)));
      const companyIds = Array.from(new Set(appsData.map(a => a.employerId))); // Assuming employerId is used to find company

      // In a real app, we'd fetch these more efficiently
      // For now, we'll just let the snapshot handle it if we had listeners
      setLoading(false);
    });

    // Fetch all jobs to map names (simplified for demo)
    const jobsRef = collection(db, 'jobs');
    const unsubscribeJobs = onSnapshot(jobsRef, (snapshot) => {
      const jobsMap: Record<string, Job> = {};
      snapshot.docs.forEach(doc => {
        jobsMap[doc.id] = { id: doc.id, ...doc.data() } as Job;
      });
      setJobs(jobsMap);
    });

    // Fetch all companies to map names
    const companiesRef = collection(db, 'companies');
    const unsubscribeCompanies = onSnapshot(companiesRef, (snapshot) => {
      const companiesMap: Record<string, Company> = {};
      snapshot.docs.forEach(doc => {
        companiesMap[doc.id] = { id: doc.id, ...doc.data() } as Company;
      });
      setCompanies(companiesMap);
    });

    // Fetch Seeker's Job Alerts
    const alertsRef = collection(db, 'job_alerts');
    const qAlerts = query(alertsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobAlert)));
    });

    return () => {
      unsubscribeApps();
      unsubscribeJobs();
      unsubscribeCompanies();
      unsubscribeAlerts();
    };
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30';
      case 'rejected': return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30';
      case 'reviewed': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
      default: return 'bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-100 dark:border-zinc-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle size={14} />;
      case 'rejected': return <XCircle size={14} />;
      case 'reviewed': return <Clock size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'job_alerts'), {
        userId: user.uid,
        keywords: alertKeywords,
        location: alertLocation,
        jobType: alertJobType,
        enabled: true,
        createdAt: serverTimestamp()
      });
      setAlertKeywords('');
      setAlertLocation('');
      setAlertJobType('all');
      setIsAddingAlert(false);
    } catch (error) {
      console.error('Error adding alert:', error);
    }
  };

  const handleToggleAlert = async (alertId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'job_alerts', alertId), {
        enabled: !currentStatus
      });
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteDoc(doc(db, 'job_alerts', alertId));
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center gap-8">
        <div className="w-24 h-24 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 overflow-hidden">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={48} />
          )}
        </div>
        <div className="flex-grow">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Welcome back, {profile?.displayName || 'User'}</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">You have {applications.length} active applications.</p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 rounded-lg text-sm font-medium text-gray-600 dark:text-zinc-300 border border-gray-100 dark:border-zinc-700">
              <Briefcase size={16} className="text-blue-600 dark:text-blue-400" /> {applications.length} Applied
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 rounded-lg text-sm font-medium text-gray-600 dark:text-zinc-300 border border-gray-100 dark:border-zinc-700">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" /> {applications.filter(a => a.status === 'accepted').length} Accepted
            </div>
          </div>
        </div>
        <Link 
          to="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg text-center"
        >
          Find More Jobs
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl w-fit">
        {[
          { id: 'applications', label: 'My Applications', icon: FileText },
          { id: 'saved', label: 'Saved Jobs', icon: Bookmark },
          { id: 'alerts', label: 'Job Alerts', icon: Bell },
          { id: 'profile', label: 'My Profile', icon: User }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2 pb-2">
              {['all', 'reviewed', 'accepted', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border-gray-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900/50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {applications.filter(app => statusFilter === 'all' || app.status === statusFilter).length > 0 ? (
              applications
                .filter(app => statusFilter === 'all' || app.status === statusFilter)
                .map((app, index) => {
                const job = jobs[app.jobId];
                const company = job ? companies[job.companyId] : null;
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:border-blue-100 dark:hover:border-blue-900/50 transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-gray-100 dark:border-zinc-700 overflow-hidden shrink-0">
                        {company?.logoURL ? (
                          <img src={company.logoURL} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Briefcase className="text-gray-300 dark:text-zinc-600" size={32} />
                        )}
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(app.status)}`}>
                            {getStatusIcon(app.status)} {app.status}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                            Applied {formatDistanceToNow(app.createdAt?.toDate() || new Date())} ago
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{job?.title || 'Loading Job...'}</h3>
                        <p className="text-gray-600 dark:text-zinc-400 font-medium mb-4">{company?.name || 'Loading Company...'}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-zinc-400">
                          <div className="flex items-center gap-1.5"><MapPin size={16} /> {job?.location}</div>
                          <div className="flex items-center gap-1.5"><DollarSign size={16} /> {job?.salaryRange || 'Negotiable'}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <Link 
                          to={`/jobs/${app.jobId}`}
                          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                          View Job <ChevronRight size={18} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
                <FileText className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No applications yet</h3>
                <p className="text-gray-500 dark:text-zinc-400 mb-6">You haven't applied for any jobs yet. Start exploring!</p>
                <Link 
                  to="/"
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  Browse open positions
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <Bookmark className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No saved jobs</h3>
            <p className="text-gray-500 dark:text-zinc-400">Save jobs you're interested in to view them later.</p>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 shadow-sm max-w-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User className="text-blue-600 dark:text-blue-400" /> Professional Profile
            </h3>
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
                  {profile?.photoURL ? <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-300 dark:text-zinc-600" />}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.displayName}</h4>
                  <p className="text-gray-500 dark:text-zinc-400">{profile?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">About Me</label>
                  <p className="text-gray-700 dark:text-zinc-300 leading-relaxed bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 italic">
                    {profile?.bio || 'No bio provided yet. Tell employers about yourself!'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {profile?.skills && profile.skills.length > 0 ? (
                      profile.skills.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-100 dark:border-blue-900/30">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-zinc-500 italic">No skills listed yet.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-50 dark:border-zinc-800">
                <Link 
                  to="/profile"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                >
                  Edit Full Profile
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Job Alerts</h2>
                <p className="text-gray-500 dark:text-zinc-400">Get notified when new jobs match your preferences.</p>
              </div>
              <button
                onClick={() => setIsAddingAlert(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all"
              >
                <Plus size={18} /> Create Alert
              </button>
            </div>

            <AnimatePresence>
              {isAddingAlert && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleAddAlert} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Keywords</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={alertKeywords}
                            onChange={(e) => setAlertKeywords(e.target.value)}
                            placeholder="e.g. Developer, Designer"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={alertLocation}
                            onChange={(e) => setAlertLocation(e.target.value)}
                            placeholder="e.g. Kampala, Remote"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Job Type</label>
                        <select
                          value={alertJobType}
                          onChange={(e) => setAlertJobType(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none"
                        >
                          <option value="all">All Types</option>
                          <option value="full-time">Full-time</option>
                          <option value="part-time">Part-time</option>
                          <option value="contract">Contract</option>
                          <option value="internship">Internship</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsAddingAlert(false)}
                        className="px-6 py-2.5 text-gray-500 dark:text-zinc-400 font-bold hover:text-gray-700 dark:hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all"
                      >
                        Save Alert
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                        alert.enabled 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' 
                          : 'bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 border-gray-100 dark:border-zinc-700'
                      }`}>
                        <Bell size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {alert.keywords}
                          {!alert.enabled && <span className="text-[10px] uppercase tracking-widest bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 px-2 py-0.5 rounded-full font-black">Disabled</span>}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-zinc-400 mt-1">
                          <span className="flex items-center gap-1"><MapPin size={14} /> {alert.location || 'Anywhere'}</span>
                          <span className="flex items-center gap-1"><Briefcase size={14} /> {alert.jobType === 'all' ? 'All Types' : alert.jobType}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleAlert(alert.id, alert.enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          alert.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            alert.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete Alert"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
                  <Bell className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" size={48} />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No job alerts</h3>
                  <p className="text-gray-500 dark:text-zinc-400">Create alerts to get notified about new job opportunities.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
