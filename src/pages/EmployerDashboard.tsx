import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, useDarkMode } from '../App';
import { Job, Application, Company, UserProfile } from '../types';
import { Plus, Briefcase, Users, Settings, Trash2, Edit2, CheckCircle, XCircle, Loader2, MapPin, DollarSign, Clock, LayoutDashboard, Building2, ChevronRight, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function EmployerDashboard() {
  const { user, profile } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<UserProfile | null>(null);
  const [isViewingApplicant, setIsViewingApplicant] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applicants' | 'company'>('jobs');
  
  // Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState<'full-time' | 'part-time' | 'internship' | 'contract'>('full-time');
  const [jobSalary, setJobSalary] = useState('');

  // Company Form State
  const [compName, setCompName] = useState('');
  const [compLocation, setCompLocation] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compLogo, setCompLogo] = useState('');

  useEffect(() => {
    if (!user) return;

    // Fetch Employer's Jobs
    const jobsRef = collection(db, 'jobs');
    const qJobs = query(jobsRef, where('employerId', '==', user.uid));
    const unsubscribeJobs = onSnapshot(qJobs, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    });

    // Fetch Applications for Employer's Jobs
    const appsRef = collection(db, 'applications');
    const qApps = query(appsRef, where('employerId', '==', user.uid));
    const unsubscribeApps = onSnapshot(qApps, (snapshot) => {
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    });

    // Fetch Company Profile
    const companiesRef = collection(db, 'companies');
    const qCompany = query(companiesRef, where('ownerId', '==', user.uid));
    const unsubscribeCompany = onSnapshot(qCompany, (snapshot) => {
      if (!snapshot.empty) {
        const compData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Company;
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

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) {
      alert("Please create a company profile first!");
      setActiveTab('company');
      return;
    }

    try {
      const jobData = {
        employerId: user?.uid,
        companyId: company.id,
        title: jobTitle,
        description: jobDesc,
        location: jobLocation,
        jobType,
        salaryRange: jobSalary,
        status: 'active',
        updatedAt: serverTimestamp(),
        requirements: []
      };

      if (isEditingJob && editingJobId) {
        await updateDoc(doc(db, 'jobs', editingJobId), jobData);
      } else {
        await addDoc(collection(db, 'jobs'), {
          ...jobData,
          createdAt: serverTimestamp(),
        });
      }

      setIsAddingJob(false);
      setIsEditingJob(false);
      setEditingJobId(null);
      setJobTitle('');
      setJobDesc('');
      setJobLocation('');
      setJobSalary('');
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
    setIsEditingJob(true);
    setIsAddingJob(true);
  };

  const handleViewApplicant = async (seekerId: string) => {
    try {
      const userRef = doc(db, 'users', seekerId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setSelectedApplicant({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
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
        updatedAt: serverTimestamp(),
      };

      if (company) {
        await updateDoc(doc(db, 'companies', company.id), companyData);
      } else {
        await addDoc(collection(db, 'companies'), {
          ...companyData,
          createdAt: serverTimestamp(),
        });
      }
      setIsEditingCompany(false);
    } catch (err) {
      console.error("Error saving company:", err);
    }
  };

  const handleUpdateAppStatus = async (appId: string, status: 'reviewed' | 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status });
    } catch (err) {
      console.error("Error updating application:", err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm("Are you sure you want to delete this job listing?")) {
      await deleteDoc(doc(db, 'jobs', jobId));
    }
  };

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

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit transition-colors duration-300">
        {[
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
        {activeTab === 'jobs' && (
          <div className="grid grid-cols-1 gap-4">
            {jobs.length > 0 ? (
              jobs.map(job => (
                <div key={job.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-blue-100 dark:hover:border-blue-900 transition-all group">
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
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{job.title}</h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full">
                          <Users size={12} />
                          {applications.filter(a => a.jobId === job.id).length} Applicants
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5"><MapPin size={16} /> {job.location}</div>
                        <div className="flex items-center gap-1.5"><Clock size={16} /> {job.jobType}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
              ))
            ) : (
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
            )}
          </div>
        )}

        {activeTab === 'applicants' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
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
                  {applications.length > 0 ? (
                    applications.map(app => {
                      const job = jobs.find(j => j.id === app.jobId);
                      return (
                        <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                {app.seekerId.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white">Applicant ID: {app.seekerId.substring(0, 8)}</div>
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
                              <button 
                                onClick={() => handleUpdateAppStatus(app.id, 'accepted')}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all" 
                                title="Accept"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button 
                                onClick={() => handleUpdateAppStatus(app.id, 'rejected')}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
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
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm max-w-2xl transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Building2 className="text-blue-600 dark:text-blue-400" /> Company Information
            </h3>
            {company ? (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                    {company.logoURL ? <img src={company.logoURL} alt="Logo" className="w-full h-full object-cover" /> : <Building2 size={40} className="text-gray-300 dark:text-gray-600" />}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h4>
                    <p className="text-gray-500 dark:text-gray-400">{company.location}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Description</label>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{company.description || 'No description provided.'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Website</label>
                    <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{company.website || 'N/A'}</a>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingCompany(true)}
                  className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't set up your company profile yet. This is required to post jobs.</p>
                <button 
                  onClick={() => setIsEditingCompany(true)}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
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
                <button onClick={() => { setIsAddingJob(false); setIsEditingJob(false); setEditingJobId(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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

      {/* Company Profile Modal */}
      <AnimatePresence>
        {isEditingCompany && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingCompany(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{company ? 'Edit Company Profile' : 'Create Company Profile'}</h2>
                <button onClick={() => setIsEditingCompany(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleSaveCompany} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
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
                  <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Logo URL (Optional)</label>
                    <input 
                      type="url" 
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all dark:text-white"
                      placeholder="https://example.com/logo.png"
                      value={compLogo}
                      onChange={(e) => setCompLogo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Company Description</label>
                    <textarea 
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all resize-none dark:text-white"
                      placeholder="Tell us about your company..."
                      value={compDesc}
                      onChange={(e) => setCompDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditingCompany(false)}
                    className="flex-grow py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-grow py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                  >
                    {company ? 'Update Profile' : 'Create Profile'}
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
