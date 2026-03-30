import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../App';
import { Job, Application, Company, JobAlert, Experience, Education } from '../types';
import { Briefcase, CheckCircle, Clock, XCircle, Search, MapPin, DollarSign, Loader2, User, FileText, Bookmark, ChevronRight, LayoutDashboard, Settings, Bell, Plus, Trash2, Send, Star, Camera, Upload, Save, CheckCircle2, AlertCircle, X, GraduationCap, Building2, Calendar as CalendarIcon, Pencil, Filter, ListFilter } from 'lucide-react';
import SkillAutocomplete from '../components/SkillAutocomplete';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import QuickApplyModal from '../components/QuickApplyModal';
import ApplicationDetailsModal from '../components/ApplicationDetailsModal';
import { GoogleGenAI, Type } from "@google/genai";
import { profileService } from '../services/profileService';
import { applicationService } from '../services/applicationService';
import { jobService } from '../services/jobService';
import { companyService } from '../services/companyService';
import { jobAlertService } from '../services/jobAlertService';
import { getJobDeadlineStatus } from '../lib/jobUtils';
import { collection, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function SeekerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'recommended' | 'saved' | 'profile' | 'alerts'>('applications');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const recentAppsCount = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return applications.filter(app => {
      const createdAt = app.createdAt?.toDate ? app.createdAt.toDate() : new Date(app.createdAt);
      return createdAt > sevenDaysAgo;
    }).length;
  }, [applications]);

  // Job Alert Form State
  const [alertKeywords, setAlertKeywords] = useState('');
  const [alertLocation, setAlertLocation] = useState('');
  const [alertJobType, setAlertJobType] = useState('all');
  const [alertSearchTerm, setAlertSearchTerm] = useState('');
  const [isAddingAlert, setIsAddingAlert] = useState(false);

  // Profile Form State
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [parsingResume, setParsingResume] = useState(false);

  // Experience & Education State
  const [experience, setExperience] = useState<Experience[]>(profile?.experience || []);
  const [education, setEducation] = useState<Education[]>(profile?.education || []);
  const [isAddingExp, setIsAddingExp] = useState(false);
  const [isAddingEdu, setIsAddingEdu] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  
  const [expForm, setExpForm] = useState<Partial<Experience>>({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    requirements: ''
  });

  const [eduForm, setEduForm] = useState<Partial<Education>>({
    school: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setSkills(profile.skills || []);
      setExperience(profile.experience || []);
      setEducation(profile.education || []);
    }
  }, [profile]);

  const handleFileUpload = async (file: File, type: 'photo' | 'resume') => {
    if (!user) return;
    setUploading(true);
    setProfileError('');

    // If it's a resume, we also want to parse it
    if (type === 'resume') {
      setParsingResume(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        
        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
        });

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              inlineData: {
                mimeType: file.type,
                data: base64Data,
              },
            },
            {
              text: "Extract work experience and education from this resume. Return a JSON object with 'experience' and 'education' arrays. Each experience should have 'company', 'position', 'location', 'startDate', 'endDate', 'current' (boolean), 'description', and 'requirements' (key skills or qualifications required for that role). Each education should have 'school', 'degree', 'fieldOfStudy', 'startDate', 'endDate', and 'description'. Use ISO date format (YYYY-MM-DD) for dates if possible, or just the year. If a date is missing, leave it empty.",
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                experience: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      company: { type: Type.STRING },
                      position: { type: Type.STRING },
                      location: { type: Type.STRING },
                      startDate: { type: Type.STRING },
                      endDate: { type: Type.STRING },
                      current: { type: Type.BOOLEAN },
                      description: { type: Type.STRING },
                      requirements: { type: Type.STRING },
                    },
                  },
                },
                education: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      school: { type: Type.STRING },
                      degree: { type: Type.STRING },
                      fieldOfStudy: { type: Type.STRING },
                      startDate: { type: Type.STRING },
                      endDate: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
        });

        const parsedData = JSON.parse(response.text);
        
        if (parsedData.experience || parsedData.education) {
          const newExperience = [
            ...(profile?.experience || []),
            ...(parsedData.experience || []).map((exp: any) => ({
              ...exp,
              id: Math.random().toString(36).substring(2, 11)
            }))
          ];

          const newEducation = [
            ...(profile?.education || []),
            ...(parsedData.education || []).map((edu: any) => ({
              ...edu,
              id: Math.random().toString(36).substring(2, 11)
            }))
          ];

          await profileService.updateProfile(user.uid, {
            experience: newExperience,
            education: newEducation
          });

          setExperience(newExperience);
          setEducation(newEducation);
        }
      } catch (err: any) {
        console.error("Resume parsing error:", err);
        // We don't block the upload if parsing fails, but we log it
      } finally {
        setParsingResume(false);
      }
    }

    try {
      const downloadURL = await profileService.uploadFile(user.uid, file, type === 'photo' ? 'avatars' : 'resumes');
      await profileService.updateProfile(user.uid, {
        [type === 'photo' ? 'photoURL' : 'resumeURL']: downloadURL
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setLoading(true);
    setProfileError('');
    setProfileSuccess(false);
    try {
      await profileService.updateProfile(user.uid, {
        displayName,
        bio,
        skills,
        experience,
        education
      });
      setProfileSuccess(true);
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const addExperience = () => {
    if (expForm.company && expForm.position && expForm.startDate) {
      if (editingExpId) {
        setExperience(experience.map(exp => exp.id === editingExpId ? { ...exp, ...expForm } as Experience : exp));
        setEditingExpId(null);
      } else {
        const newExp: Experience = {
          id: Math.random().toString(36).substr(2, 9),
          company: expForm.company!,
          position: expForm.position!,
          location: expForm.location || '',
          startDate: expForm.startDate!,
          endDate: expForm.current ? '' : expForm.endDate,
          current: expForm.current || false,
          description: expForm.description || '',
          requirements: expForm.requirements || ''
        };
        setExperience([...experience, newExp]);
      }
      setExpForm({
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        requirements: ''
      });
      setIsAddingExp(false);
    }
  };

  const startEditExperience = (exp: Experience) => {
    setExpForm({
      company: exp.company,
      position: exp.position,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      current: exp.current,
      description: exp.description,
      requirements: exp.requirements || ''
    });
    setEditingExpId(exp.id);
    setIsAddingExp(false);
  };

  const cancelExpEdit = () => {
    setEditingExpId(null);
    setIsAddingExp(false);
    setExpForm({
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      requirements: ''
    });
  };

  const removeExperience = (id: string) => {
    setExperience(experience.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    if (eduForm.school && eduForm.degree && eduForm.startDate) {
      if (editingEduId) {
        setEducation(education.map(edu => edu.id === editingEduId ? { ...edu, ...eduForm } as Education : edu));
        setEditingEduId(null);
      } else {
        const newEdu: Education = {
          id: Math.random().toString(36).substr(2, 9),
          school: eduForm.school!,
          degree: eduForm.degree!,
          fieldOfStudy: eduForm.fieldOfStudy || '',
          startDate: eduForm.startDate!,
          endDate: eduForm.endDate,
          description: eduForm.description || ''
        };
        setEducation([...education, newEdu]);
      }
      setEduForm({
        school: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        description: ''
      });
      setIsAddingEdu(false);
    }
  };

  const startEditEducation = (edu: Education) => {
    setEduForm({
      school: edu.school,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: edu.startDate,
      endDate: edu.endDate,
      description: edu.description
    });
    setEditingEduId(edu.id);
    setIsAddingEdu(false);
  };

  const cancelEduEdit = () => {
    setEditingEduId(null);
    setIsAddingEdu(false);
    setEduForm({
      school: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      description: ''
    });
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  const handleCancelEdit = () => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setSkills(profile.skills || []);
      setExperience(profile.experience || []);
      setEducation(profile.education || []);
    }
    setIsEditingProfile(false);
    setIsAddingExp(false);
    setIsAddingEdu(false);
    setEditingExpId(null);
    setEditingEduId(null);
  };

  useEffect(() => {
    if (!user) return;

    // Fetch Seeker's Applications
    const unsubscribeApps = applicationService.subscribeToSeekerApplications(user.uid, (appsData) => {
      setApplications(appsData);
      setLoading(false);
    });

    // Fetch all jobs to map names
    const unsubscribeJobs = jobService.subscribeToActiveJobs((jobsData) => {
      const jobsMap: Record<string, Job> = {};
      jobsData.forEach(job => {
        jobsMap[job.id] = job;
      });
      setJobs(jobsMap);
    });

    // Fetch all companies to map names
    const unsubscribeCompanies = companyService.subscribeToAllCompanies((companiesData) => {
      const companiesMap: Record<string, Company> = {};
      companiesData.forEach(company => {
        companiesMap[company.id] = company;
      });
      setCompanies(companiesMap);
    });

    // Fetch Seeker's Job Alerts
    const unsubscribeAlerts = jobAlertService.subscribeToUserAlerts(user.uid, setAlerts);

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
      case 'applied': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
      default: return 'bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-100 dark:border-zinc-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle size={14} />;
      case 'rejected': return <XCircle size={14} />;
      case 'reviewed': return <Clock size={14} />;
      case 'applied': return <Send size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await jobAlertService.createAlert({
        userId: user.uid,
        keywords: alertKeywords,
        location: alertLocation,
        jobType: alertJobType
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
    // Optimistic update for immediate UI feedback
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, enabled: !currentStatus } : a));
    
    try {
      await jobAlertService.toggleAlert(alertId, !currentStatus);
    } catch (error) {
      console.error('Error toggling alert:', error);
      // Revert on error
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, enabled: currentStatus } : a));
    }
  };

  const handleApplyClick = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedJob(job);
  };

  const recommendedJobs = Object.values(jobs).filter(job => 
    job.status === 'active' && 
    !applications.some(app => app.jobId === job.id)
  ).slice(0, 10);

  const savedJobs = profile?.savedJobs 
    ? Object.values(jobs).filter(job => profile.savedJobs!.includes(job.id))
    : [];

  const handleDeleteAlert = async (alertId: string) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    try {
      await jobAlertService.deleteAlert(alertId);
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
      <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
        {[
          { id: 'applications', label: 'My Applications', icon: FileText },
          { id: 'recommended', label: 'Recommended', icon: Briefcase },
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
            {tab.id === 'applications' && recentAppsCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] rounded-full border border-blue-200 dark:border-blue-800">
                {recentAppsCount} new
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* Status Filter Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-gray-50/50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-gray-100 dark:border-zinc-800 shadow-sm">
                  <ListFilter size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Filter by Status</label>
                  <div className="flex items-center gap-2">
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none pr-10 relative cursor-pointer"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                    >
                      <option value="all">All Applications</option>
                      <option value="applied">Applied</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    {statusFilter !== 'all' && (
                      <button 
                        onClick={() => setStatusFilter('all')}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Clear filter"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                  {applications.filter(app => statusFilter === 'all' || app.status === statusFilter).length} Applications Found
                </p>
              </div>
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
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="bg-white dark:bg-zinc-900 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900/50 transition-all group relative overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 relative z-10">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-50 dark:bg-zinc-800 rounded-2xl md:rounded-3xl flex items-center justify-center border border-gray-100 dark:border-zinc-700 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                          {company?.logoURL ? (
                            <img src={company.logoURL} alt="Logo" className="w-full h-full object-contain p-2 md:p-3" referrerPolicy="no-referrer" />
                          ) : (
                            <Briefcase className="text-gray-300 dark:text-zinc-600" size={32} />
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-5">
                            <span className={`flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(app.status)}`}>
                              {getStatusIcon(app.status)} {app.status}
                            </span>
                            <span className="inline-flex items-center gap-2 text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
                              <Clock size={12} className="text-blue-500" />
                              Applied {formatDistanceToNow(app.createdAt?.toDate?.() || new Date(app.createdAt))} ago
                            </span>
                            {app.updatedAt && (
                              <span className="inline-flex items-center gap-2 text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
                                <Clock size={12} className="text-green-500" />
                                Updated {formatDistanceToNow(app.updatedAt?.toDate?.() || new Date(app.updatedAt))} ago
                              </span>
                            )}
                            {job?.jobType && (
                              <span className="px-2 py-0.5 md:px-3 md:py-1 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-[9px] md:text-[10px] font-black rounded-lg uppercase tracking-wider border border-gray-200 dark:border-zinc-700">
                                {job.jobType.replace('-', ' ')}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight tracking-tight">{job?.title || 'Loading Job...'}</h3>
                          
                          <div className="flex items-center gap-2 mb-6 md:mb-8">
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                              <Building2 size={10} className="text-blue-500" />
                            </div>
                            <Link to={`/company/${job?.companyId}`} className="text-sm md:text-base text-blue-600 dark:text-blue-400 font-black hover:underline transition-all">{company?.name || 'Loading Company...'}</Link>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 md:gap-8">
                            <div className="flex items-center gap-2 md:gap-3 group/info">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover/info:scale-110 transition-transform">
                                <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">Location</p>
                                <p className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300">{job?.location}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 group/info">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center group-hover/info:scale-110 transition-transform">
                                <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">Salary</p>
                                <p className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300">{job?.salaryRange || 'Negotiable'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                          <button 
                            onClick={() => setSelectedApplication(app)}
                            className="flex items-center justify-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 font-black text-xs rounded-xl md:rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all shadow-sm w-full md:w-auto"
                          >
                            View Application <FileText size={18} />
                          </button>
                          <Link 
                            to={`/jobs/${app.jobId}`}
                            className="flex items-center justify-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black text-xs rounded-xl md:rounded-2xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm hover:shadow-blue-600/20 w-full md:w-auto"
                          >
                            Job Details <ChevronRight size={18} />
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

        {activeTab === 'recommended' && (
          <div className="grid grid-cols-1 gap-8">
            {recommendedJobs.length > 0 ? (
              recommendedJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className={`p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border transition-all group relative overflow-hidden ${
                    job.featured
                      ? 'bg-slate-900/5 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-xl'
                      : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 relative z-10">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-50 dark:bg-zinc-800 rounded-2xl md:rounded-3xl flex items-center justify-center border border-gray-100 dark:border-zinc-700 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                      {companies[job.companyId]?.logoURL ? (
                        <img src={companies[job.companyId].logoURL} alt="Logo" className="w-full h-full object-contain p-2 md:p-3" referrerPolicy="no-referrer" />
                      ) : (
                        <Briefcase className="text-gray-300 dark:text-zinc-600" size={32} />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-5">
                        <h3 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight tracking-tight">{job.title}</h3>
                        {job.featured && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[9px] md:text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20">
                            <Star size={10} fill="currentColor" /> Featured
                          </span>
                        )}
                        {getJobDeadlineStatus(job) === 'expired' ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 bg-red-500 text-white text-[9px] md:text-[10px] font-black rounded-full uppercase tracking-widest border border-red-600 shadow-lg shadow-red-500/20">
                            <XCircle size={10} fill="currentColor" /> Expired
                          </span>
                        ) : getJobDeadlineStatus(job) === 'nearing' && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 bg-orange-500 text-white text-[9px] md:text-[10px] font-black rounded-full uppercase tracking-widest border border-orange-600 shadow-lg shadow-orange-500/20 animate-pulse">
                            <AlertCircle size={10} fill="currentColor" /> Closing Soon
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-6 md:mb-8">
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                          <Building2 size={10} className="text-blue-500" />
                        </div>
                        <Link to={`/company/${job.companyId}`} className="text-sm md:text-base text-blue-600 dark:text-blue-400 font-black hover:underline transition-all">{companies[job.companyId]?.name || 'Unknown Company'}</Link>
                      </div>

                      <div className="flex flex-wrap gap-4 md:gap-8">
                        <div className="flex items-center gap-2 md:gap-3 group/info">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover/info:scale-110 transition-transform">
                            <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">Location</p>
                            <p className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300">{job.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 group/info">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center group-hover/info:scale-110 transition-transform">
                            <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">Salary</p>
                            <p className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300">{job.salaryRange || 'Negotiable'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 group/info">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover/info:scale-110 transition-transform">
                            <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">Job Type</p>
                            <p className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300">{job.jobType.replace('-', ' ')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row md:flex-col md:items-end gap-3 md:gap-4 shrink-0">
                      <button
                        onClick={(e) => handleApplyClick(e, job)}
                        className="px-6 py-3 md:px-8 md:py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs md:text-sm rounded-xl md:rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0 w-full md:w-auto"
                      >
                        <Send size={18} /> Quick Apply
                      </button>
                      <Link 
                        to={`/jobs/${job.id}`}
                        className="text-[10px] md:text-xs text-gray-400 hover:text-blue-600 font-black tracking-widest uppercase transition-colors text-center md:text-right"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
                <Briefcase className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No recommendations yet</h3>
                <p className="text-gray-500 dark:text-zinc-400">Check back later for new opportunities matching your profile.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="grid grid-cols-1 gap-8">
            {savedJobs.length > 0 ? (
              savedJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className={`p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border transition-all group relative overflow-hidden ${
                    job.featured
                      ? 'bg-slate-900/5 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-xl'
                      : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 relative z-10">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-50 dark:bg-zinc-800 rounded-2xl md:rounded-3xl flex items-center justify-center border border-gray-100 dark:border-zinc-700 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                      {companies[job.companyId]?.logoURL ? (
                        <img src={companies[job.companyId].logoURL} alt="Logo" className="w-full h-full object-contain p-2 md:p-3" referrerPolicy="no-referrer" />
                      ) : (
                        <Briefcase className="text-gray-300 dark:text-zinc-600" size={32} />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-5">
                        <h3 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight tracking-tight">{job.title}</h3>
                        {job.featured && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[9px] md:text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20">
                            <Star size={10} fill="currentColor" /> Featured
                          </span>
                        )}
                        {getJobDeadlineStatus(job) === 'expired' ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 bg-red-500 text-white text-[9px] md:text-[10px] font-black rounded-full uppercase tracking-widest border border-red-600 shadow-lg shadow-red-500/20">
                            <XCircle size={10} fill="currentColor" /> Expired
                          </span>
                        ) : getJobDeadlineStatus(job) === 'nearing' && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 bg-orange-500 text-white text-[9px] md:text-[10px] font-black rounded-full uppercase tracking-widest border border-orange-600 shadow-lg shadow-orange-500/20 animate-pulse">
                            <AlertCircle size={10} fill="currentColor" /> Closing Soon
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-6 md:mb-8">
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                           <Building2 size={10} className="text-blue-500" />
                        </div>
                        <Link to={`/company/${job.companyId}`} className="text-sm md:text-base text-blue-600 dark:text-blue-400 font-black hover:underline transition-all">{companies[job.companyId]?.name || 'Unknown Company'}</Link>
                      </div>

                      <div className="flex flex-wrap gap-4 md:gap-8">
                        <div className="flex items-center gap-2 md:gap-3 group/info">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover/info:scale-110 transition-transform">
                            <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">Location</p>
                            <p className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300">{job.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 group/info">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center group-hover/info:scale-110 transition-transform">
                            <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">Salary</p>
                            <p className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300">{job.salaryRange || 'Negotiable'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 group/info">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover/info:scale-110 transition-transform">
                            <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">Job Type</p>
                            <p className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300">{job.jobType.replace('-', ' ')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row md:flex-col md:items-end gap-3 md:gap-4 shrink-0">
                      <button
                        onClick={(e) => handleApplyClick(e, job)}
                        className="px-6 py-3 md:px-8 md:py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs md:text-sm rounded-xl md:rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0 w-full md:w-auto"
                      >
                        <Send size={18} /> Quick Apply
                      </button>
                      <Link 
                        to={`/jobs/${job.id}`}
                        className="text-[10px] md:text-xs text-gray-400 hover:text-blue-600 font-black tracking-widest uppercase transition-colors text-center md:text-right"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
                <Bookmark className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No saved jobs</h3>
                <p className="text-gray-500 dark:text-zinc-400">Save jobs you're interested in to view them later.</p>
                <Link 
                  to="/"
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline mt-4 inline-block"
                >
                  Browse open positions
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 rounded-3xl bg-blue-50 dark:bg-zinc-800 flex items-center justify-center text-blue-600 dark:text-blue-400 border-4 border-white dark:border-zinc-900 shadow-lg overflow-hidden">
                    {profile?.photoURL ? <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <User size={64} />}
                  </div>
                  <button 
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all border-2 border-white dark:border-zinc-900"
                  >
                    <Camera size={18} />
                  </button>
                  <input 
                    type="file" 
                    ref={photoInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'photo')}
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.displayName || 'User'}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">{profile?.email}</p>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                  {profile?.role}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-blue-600 dark:text-blue-400" /> Resume / CV
                </h4>
                {profile?.resumeURL ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                      <div className="flex items-center gap-3">
                        <FileText className="text-blue-600 dark:text-blue-400" />
                        <div className="text-xs font-bold text-blue-900 dark:text-blue-100">My Resume.pdf</div>
                      </div>
                      <a 
                        href={profile.resumeURL} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    </div>
                    <button 
                      type="button"
                      onClick={() => resumeInputRef.current?.click()}
                      className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-gray-500 dark:text-zinc-400 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                    >
                      Replace Resume
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-zinc-600 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                  >
                    <Upload size={24} />
                    <span className="text-sm font-bold">Upload Resume</span>
                  </button>
                )}
                <input 
                  type="file" 
                  ref={resumeInputRef} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'resume')}
                />
                {parsingResume && (
                  <div className="mt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs animate-pulse">
                    <Loader2 size={14} className="animate-spin" />
                    Parsing resume with AI...
                  </div>
                )}
                {uploading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Profile Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <User className="text-blue-600 dark:text-blue-400" /> Professional Profile
                  </h3>
                  {!isEditingProfile ? (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="px-6 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleUpdateProfile()}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-70"
                      >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save</>}
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {isEditingProfile ? (
                    <motion.form 
                      key="edit-form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleUpdateProfile} 
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 ml-1">Display Name</label>
                        <input
                          type="text"
                          required
                          className="block w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all"
                          placeholder="Your full name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 ml-1">Professional Bio</label>
                        <textarea
                          rows={6}
                          className="block w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all resize-none"
                          placeholder="Tell employers about yourself..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 ml-1">Skills</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {skills.map(skill => (
                            <span key={skill} className="group flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-bold rounded-lg border border-gray-100 dark:border-zinc-700 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                              {skill}
                              <button type="button" onClick={() => removeSkill(skill)} className="text-gray-300 dark:text-zinc-600 group-hover:text-red-500 dark:group-hover:text-red-400">
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <SkillAutocomplete 
                            onSelect={(skill) => {
                              if (!skills.includes(skill)) {
                                setSkills([...skills, skill]);
                              }
                            }}
                            existingSkills={skills}
                          />
                        </div>
                      </div>

                      {/* Experience Management */}
                      <div className="pt-6 border-t border-gray-50 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 ml-1">Work Experience</label>
                          {!isAddingExp && (
                            <button 
                              type="button" 
                              onClick={() => setIsAddingExp(true)}
                              className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                            >
                              <Plus size={14} /> Add Experience
                            </button>
                          )}
                        </div>

                        <div className="space-y-4 mb-4">
                          {experience.map(exp => (
                            <div key={exp.id}>
                              {editingExpId === exp.id ? (
                                <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-900/50 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                      type="text"
                                      placeholder="Company"
                                      className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                      value={expForm.company}
                                      onChange={(e) => setExpForm({...expForm, company: e.target.value})}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Position"
                                      className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                      value={expForm.position}
                                      onChange={(e) => setExpForm({...expForm, position: e.target.value})}
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                      type="text"
                                      placeholder="Location"
                                      className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                      value={expForm.location}
                                      onChange={(e) => setExpForm({...expForm, location: e.target.value})}
                                    />
                                    <div className="flex items-center gap-2 px-4">
                                      <input
                                        type="checkbox"
                                        id={`current-job-${exp.id}`}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={expForm.current}
                                        onChange={(e) => setExpForm({...expForm, current: e.target.checked})}
                                      />
                                      <label htmlFor={`current-job-${exp.id}`} className="text-sm text-gray-600 dark:text-zinc-400">I currently work here</label>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Start Date</label>
                                      <input
                                        type="month"
                                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                        value={expForm.startDate}
                                        onChange={(e) => setExpForm({...expForm, startDate: e.target.value})}
                                      />
                                    </div>
                                    {!expForm.current && (
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">End Date</label>
                                        <input
                                          type="month"
                                          className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                          value={expForm.endDate}
                                          onChange={(e) => setExpForm({...expForm, endDate: e.target.value})}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <textarea
                                    placeholder="Description of your responsibilities..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
                                    value={expForm.description}
                                    onChange={(e) => setExpForm({...expForm, description: e.target.value})}
                                  />
                                  <textarea
                                    placeholder="Job Requirements (e.g. specific skills or qualifications required for this role)..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
                                    value={expForm.requirements}
                                    onChange={(e) => setExpForm({...expForm, requirements: e.target.value})}
                                  />
                                  <div className="flex justify-end gap-3">
                                    <button 
                                      type="button" 
                                      onClick={cancelExpEdit}
                                      className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={addExperience}
                                      className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => startEditExperience(exp)}
                                  className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 flex justify-between items-start gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors group"
                                >
                                  <div>
                                    <h5 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{exp.position}</h5>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{exp.company}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-zinc-500 mt-1 uppercase tracking-wider">{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); startEditExperience(exp); }}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); removeExperience(exp.id); }}
                                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {isAddingExp && (
                          <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                placeholder="Company"
                                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                value={expForm.company}
                                onChange={(e) => setExpForm({...expForm, company: e.target.value})}
                              />
                              <input
                                type="text"
                                placeholder="Position"
                                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                value={expForm.position}
                                onChange={(e) => setExpForm({...expForm, position: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                placeholder="Location"
                                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                value={expForm.location}
                                onChange={(e) => setExpForm({...expForm, location: e.target.value})}
                              />
                              <div className="flex items-center gap-2 px-4">
                                <input
                                  type="checkbox"
                                  id="current-job"
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={expForm.current}
                                  onChange={(e) => setExpForm({...expForm, current: e.target.checked})}
                                />
                                <label htmlFor="current-job" className="text-sm text-gray-600 dark:text-zinc-400">I currently work here</label>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Start Date</label>
                                <input
                                  type="month"
                                  className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                  value={expForm.startDate}
                                  onChange={(e) => setExpForm({...expForm, startDate: e.target.value})}
                                />
                              </div>
                              {!expForm.current && (
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">End Date</label>
                                  <input
                                    type="month"
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                    value={expForm.endDate}
                                    onChange={(e) => setExpForm({...expForm, endDate: e.target.value})}
                                  />
                                </div>
                              )}
                            </div>
                            <textarea
                              placeholder="Description of your responsibilities..."
                              rows={3}
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
                              value={expForm.description}
                              onChange={(e) => setExpForm({...expForm, description: e.target.value})}
                            />
                            <textarea
                              placeholder="Job Requirements (e.g. specific skills or qualifications required for this role)..."
                              rows={3}
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
                              value={expForm.requirements}
                              onChange={(e) => setExpForm({...expForm, requirements: e.target.value})}
                            />
                            <div className="flex justify-end gap-3">
                              <button 
                                type="button" 
                                onClick={() => setIsAddingExp(false)}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                              <button 
                                type="button" 
                                onClick={addExperience}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Education Management */}
                      <div className="pt-6 border-t border-gray-50 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 ml-1">Education</label>
                          {!isAddingEdu && (
                            <button 
                              type="button" 
                              onClick={() => setIsAddingEdu(true)}
                              className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                            >
                              <Plus size={14} /> Add Education
                            </button>
                          )}
                        </div>

                        <div className="space-y-4 mb-4">
                          {education.map(edu => (
                            <div key={edu.id}>
                              {editingEduId === edu.id ? (
                                <div className="p-6 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-900/50 space-y-4">
                                  <input
                                    type="text"
                                    placeholder="School / University"
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                    value={eduForm.school}
                                    onChange={(e) => setEduForm({...eduForm, school: e.target.value})}
                                  />
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                      type="text"
                                      placeholder="Degree (e.g. Bachelor's)"
                                      className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                      value={eduForm.degree}
                                      onChange={(e) => setEduForm({...eduForm, degree: e.target.value})}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Field of Study"
                                      className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                      value={eduForm.fieldOfStudy}
                                      onChange={(e) => setEduForm({...eduForm, fieldOfStudy: e.target.value})}
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Start Date</label>
                                      <input
                                        type="month"
                                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                        value={eduForm.startDate}
                                        onChange={(e) => setEduForm({...eduForm, startDate: e.target.value})}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">End Date (or expected)</label>
                                      <input
                                        type="month"
                                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                        value={eduForm.endDate}
                                        onChange={(e) => setEduForm({...eduForm, endDate: e.target.value})}
                                      />
                                    </div>
                                  </div>
                                  <textarea
                                    placeholder="Additional details..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
                                    value={eduForm.description}
                                    onChange={(e) => setEduForm({...eduForm, description: e.target.value})}
                                  />
                                  <div className="flex justify-end gap-3">
                                    <button 
                                      type="button" 
                                      onClick={cancelEduEdit}
                                      className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={addEducation}
                                      className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => startEditEducation(edu)}
                                  className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 flex justify-between items-start gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors group"
                                >
                                  <div>
                                    <h5 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{edu.degree} in {edu.fieldOfStudy}</h5>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{edu.school}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-zinc-500 mt-1 uppercase tracking-wider">{edu.startDate} — {edu.endDate || 'Present'}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); startEditEducation(edu); }}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); removeEducation(edu.id); }}
                                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {isAddingEdu && (
                          <div className="p-6 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30 space-y-4">
                            <input
                              type="text"
                              placeholder="School / University"
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                              value={eduForm.school}
                              onChange={(e) => setEduForm({...eduForm, school: e.target.value})}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                placeholder="Degree (e.g. Bachelor's)"
                                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                value={eduForm.degree}
                                onChange={(e) => setEduForm({...eduForm, degree: e.target.value})}
                              />
                              <input
                                type="text"
                                placeholder="Field of Study"
                                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                value={eduForm.fieldOfStudy}
                                onChange={(e) => setEduForm({...eduForm, fieldOfStudy: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Start Date</label>
                                <input
                                  type="month"
                                  className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                  value={eduForm.startDate}
                                  onChange={(e) => setEduForm({...eduForm, startDate: e.target.value})}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">End Date (or expected)</label>
                                <input
                                  type="month"
                                  className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                  value={eduForm.endDate}
                                  onChange={(e) => setEduForm({...eduForm, endDate: e.target.value})}
                                />
                              </div>
                            </div>
                            <textarea
                              placeholder="Additional details..."
                              rows={3}
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
                              value={eduForm.description}
                              onChange={(e) => setEduForm({...eduForm, description: e.target.value})}
                            />
                            <div className="flex justify-end gap-3">
                              <button 
                                type="button" 
                                onClick={() => setIsAddingEdu(false)}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                              <button 
                                type="button" 
                                onClick={addEducation}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-gray-50 dark:border-zinc-800 flex gap-4">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-8 py-3.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-70"
                        >
                          {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save</>}
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.div 
                      key="view-profile"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-8"
                    >
                      <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">About Me</label>
                        <p className="text-gray-700 dark:text-zinc-300 leading-relaxed bg-gray-50 dark:bg-zinc-800 p-6 rounded-2xl border border-gray-100 dark:border-zinc-700 italic">
                          {profile?.bio || 'No bio provided yet. Tell employers about yourself!'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">My Skills</label>
                        <div className="flex flex-wrap gap-2">
                          {profile?.skills && profile.skills.length > 0 ? (
                            profile.skills.map(skill => (
                              <span key={skill} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-xl border border-blue-100 dark:border-blue-900/30">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-zinc-500 italic">No skills listed yet.</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-8 border-t border-gray-50 dark:border-zinc-800">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                          <Building2 size={20} className="text-blue-600 dark:text-blue-400" /> Work Experience
                        </h4>
                        <div className="space-y-6">
                          {profile?.experience && profile.experience.length > 0 ? (
                            profile.experience.map((exp) => (
                              <div key={exp.id} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100 dark:before:bg-zinc-800">
                                <div className="absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full bg-blue-600 border-4 border-white dark:border-zinc-900 shadow-sm" />
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                  <h5 className="font-bold text-gray-900 dark:text-white">{exp.position}</h5>
                                  <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                                    {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">{exp.company} • {exp.location}</div>
                                <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">{exp.description}</p>
                                {exp.requirements && (
                                  <div className="mt-3">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Job Requirements</p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-500 leading-relaxed bg-gray-50/50 dark:bg-zinc-800/50 p-3 rounded-xl border border-gray-100 dark:border-zinc-700/50 italic">
                                      {exp.requirements}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-zinc-500 italic">No work experience listed yet.</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-8 border-t border-gray-50 dark:border-zinc-800">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                          <GraduationCap size={20} className="text-blue-600 dark:text-blue-400" /> Education
                        </h4>
                        <div className="space-y-6">
                          {profile?.education && profile.education.length > 0 ? (
                            profile.education.map((edu) => (
                              <div key={edu.id} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100 dark:before:bg-zinc-800">
                                <div className="absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full bg-green-600 border-4 border-white dark:border-zinc-900 shadow-sm" />
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                  <h5 className="font-bold text-gray-900 dark:text-white">{edu.degree} in {edu.fieldOfStudy}</h5>
                                  <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                                    {edu.startDate} — {edu.endDate || 'Present'}
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">{edu.school}</div>
                                <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">{edu.description}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-zinc-500 italic">No education details listed yet.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {profileSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50"
                    >
                      <CheckCircle2 size={24} />
                      <p className="font-bold">Profile updated successfully!</p>
                    </motion.div>
                  )}
                  {profileError && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="fixed bottom-8 right-8 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50"
                    >
                      <AlertCircle size={24} />
                      <p className="font-bold">{profileError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search alerts by keywords or location..."
                  value={alertSearchTerm}
                  onChange={(e) => setAlertSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white shadow-sm"
                />
              </div>
              <button
                onClick={() => setIsAddingAlert(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all shrink-0"
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
              {alerts.filter(alert => 
                alert.keywords.toLowerCase().includes(alertSearchTerm.toLowerCase()) ||
                alert.location.toLowerCase().includes(alertSearchTerm.toLowerCase())
              ).length > 0 ? (
                alerts
                  .filter(alert => 
                    alert.keywords.toLowerCase().includes(alertSearchTerm.toLowerCase()) ||
                    alert.location.toLowerCase().includes(alertSearchTerm.toLowerCase())
                  )
                  .map((alert) => (
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
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${alert.enabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-600'}`}>
                          {alert.enabled ? 'Active' : 'Paused'}
                        </span>
                        <button
                          onClick={() => handleToggleAlert(alert.id, alert.enabled)}
                          role="switch"
                          aria-checked={alert.enabled}
                          aria-label={`Toggle ${alert.keywords} alert`}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                            alert.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                              alert.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-2.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 hover:border-red-100 dark:hover:border-red-900/30"
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

      <AnimatePresence>
        {selectedJob && (
          <QuickApplyModal
            job={selectedJob}
            company={companies[selectedJob.companyId]}
            onClose={() => setSelectedJob(null)}
            onSuccess={() => {
              // Optional: show a toast or something
            }}
          />
        )}
        {selectedApplication && (
          <ApplicationDetailsModal
            application={selectedApplication}
            job={jobs[selectedApplication.jobId]}
            company={jobs[selectedApplication.jobId] ? companies[jobs[selectedApplication.jobId].companyId] : undefined}
            onClose={() => setSelectedApplication(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
