import React, { useState, useEffect } from 'react';
import { useAuth, useDarkMode } from '../App';
import { Job, UserProfile, Company, Application, Review } from '../types';
import { Shield, Users, Briefcase, CheckCircle, XCircle, Trash2, Loader2, Search, Filter, AlertTriangle, ChevronRight, LayoutDashboard, BarChart3, Star, Sun, Moon, TrendingUp, User, MessageSquare, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';
import { jobService } from '../services/jobService';
import { profileService } from '../services/profileService';
import { applicationService } from '../services/applicationService';
import { reviewService } from '../services/reviewService';

export default function AdminPanel() {
  const { user, profile } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'users' | 'analytics' | 'reviews'>('jobs');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    // Fetch all jobs
    const unsubscribeJobs = jobService.subscribeToAllJobs((jobsData) => {
      setJobs(jobsData);
    });

    // Fetch all users
    const unsubscribeUsers = profileService.subscribeToAllProfiles((usersData) => {
      setUsers(usersData);
    });

    // Fetch all applications
    const unsubscribeApps = applicationService.subscribeToAllApplications((appsData) => {
      setApplications(appsData);
    });

    // Fetch all reviews
    const unsubscribeReviews = reviewService.subscribeToAllReviews((reviewsData) => {
      setReviews(reviewsData);
      setLoading(false);
    });

    return () => {
      unsubscribeJobs();
      unsubscribeUsers();
      unsubscribeApps();
      unsubscribeReviews();
    };
  }, [profile]);

  const handleUpdateJobStatus = async (jobId: string, status: 'active' | 'rejected' | 'closed') => {
    try {
      await jobService.updateJob(jobId, { status });
    } catch (err) {
      console.error("Error updating job status:", err);
    }
  };

  const handleToggleFeatured = async (jobId: string, currentFeatured: boolean) => {
    try {
      await jobService.updateJob(jobId, { featured: !currentFeatured });
    } catch (err) {
      console.error("Error toggling featured status:", err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm("Are you sure you want to delete this job listing? This action cannot be undone.")) {
      try {
        await jobService.deleteJob(jobId);
      } catch (err) {
        console.error("Error deleting job:", err);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await profileService.deleteProfile(userId);
      } catch (err) {
        console.error("Error deleting user:", err);
      }
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      await reviewService.approveReview(reviewId);
    } catch (err) {
      console.error("Error approving review:", err);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      await reviewService.rejectReview(reviewId);
    } catch (err) {
      console.error("Error rejecting review:", err);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      try {
        await reviewService.deleteReview(reviewId);
      } catch (err) {
        console.error("Error deleting review:", err);
      }
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <Shield size={64} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400">You do not have administrative privileges to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gray-900 dark:bg-gray-800 text-white p-10 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden transition-colors duration-300">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-blue-400" size={24} />
            <span className="text-blue-400 font-bold uppercase tracking-widest text-xs">Administrative Control</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">System Management</h1>
          <p className="text-gray-400 dark:text-gray-300 mt-2">Oversee users, moderate jobs, and monitor platform health.</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 dark:border-white/20 text-center min-w-[120px]">
            <div className="text-2xl font-bold dark:text-white">{users.length}</div>
            <div className="text-xs text-gray-400 dark:text-gray-300 font-medium uppercase">Total Users</div>
          </div>
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 dark:border-white/20 text-center min-w-[120px]">
            <div className="text-2xl font-bold dark:text-white">{jobs.length}</div>
            <div className="text-xs text-gray-400 dark:text-gray-300 font-medium uppercase">Total Jobs</div>
          </div>
        </div>
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent"></div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit transition-colors duration-300">
        {[
          { id: 'jobs', label: 'Job Moderation', icon: Briefcase },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'reviews', label: 'Review Moderation', icon: MessageSquare },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-md' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300' 
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'jobs' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
            <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pending & Active Jobs</h3>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search jobs..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Job Details</th>
                    <th className="px-6 py-4">Employer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Views</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {jobs.filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase())).map(job => (
                    <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{job.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{job.location} • {job.jobType}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {job.employerId.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          job.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                          job.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                          job.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                          'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                        {job.viewCount || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(job.createdAt.toDate())} ago
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleToggleFeatured(job.id, !!job.featured)}
                            className={`p-2 rounded-lg transition-all ${job.featured ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`}
                            title={job.featured ? "Unfeature" : "Feature"}
                          >
                            <Star size={18} fill={job.featured ? "currentColor" : "none"} />
                          </button>
                          {job.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleUpdateJobStatus(job.id, 'active')}
                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all" 
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button 
                                onClick={() => handleUpdateJobStatus(job.id, 'rejected')}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleUpdateJobStatus(job.id, 'closed')}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all" 
                            title="Close Listing"
                          >
                            <XCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                            title="Delete Job"
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
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
            <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Platform Users</h3>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {users.filter(u => u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                    <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden">
                            {u.photoURL ? <img src={u.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : u.displayName?.substring(0, 1).toUpperCase()}
                          </div>
                          <div className="font-bold text-gray-900 dark:text-white">{u.displayName || 'Anonymous'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          u.role === 'admin' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' :
                          u.role === 'employer' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                          'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                        }`}>
                          {u.role === 'admin' && <Shield size={10} />}
                          {u.role === 'employer' && <Briefcase size={10} />}
                          {u.role === 'seeker' && <User size={10} />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {u.createdAt ? formatDistanceToNow(u.createdAt.toDate()) + ' ago' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteUser(u.uid)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
            <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review Moderation</h3>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search reviews..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-900 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Review Details</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {reviews.filter(r => r.comment.toLowerCase().includes(searchTerm.toLowerCase()) || r.companyName?.toLowerCase().includes(searchTerm.toLowerCase())).map(review => (
                    <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{review.companyName || 'Unknown Company'}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{review.comment}</p>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold mt-1">
                          By: {review.isAnonymous ? 'Anonymous Seeker' : review.authorName || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star size={14} fill="currentColor" />
                          <span className="text-sm font-bold">{review.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${
                          review.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                          review.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                          review.status === 'flagged' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' :
                          'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        }`}>
                          {review.status === 'flagged' && <Flag size={10} />}
                          {review.status}
                        </span>
                        {review.status === 'flagged' && review.flagReason && (
                          <div className="text-[10px] text-orange-600 dark:text-orange-400 mt-1 italic">
                            Reason: {review.flagReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {review.createdAt ? formatDistanceToNow(review.createdAt.toDate()) + ' ago' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(review.status === 'pending' || review.status === 'flagged' || review.status === 'rejected') && (
                            <button 
                              onClick={() => handleApproveReview(review.id)}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all" 
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          {(review.status === 'pending' || review.status === 'flagged' || review.status === 'approved') && (
                            <button 
                              onClick={() => handleRejectReview(review.id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                            title="Delete Review"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reviews.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 italic">
                        No reviews found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                <h4 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">User Growth</h4>
                <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">+{users.length}</div>
                <p className="text-green-600 dark:text-green-400 text-sm font-bold flex items-center gap-1">
                  <TrendingUp size={16} /> 12% this month
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                <h4 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">Active Listings</h4>
                <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                  {jobs.filter(j => j.status === 'active').length}
                </div>
                <p className="text-green-600 dark:text-green-400 text-sm font-bold flex items-center gap-1">
                  <TrendingUp size={16} /> Live on platform
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                <h4 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">Job Categories</h4>
                <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                  {new Set(jobs.map(j => j.category).filter(Boolean)).size}
                </div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-bold flex items-center gap-1">
                  <TrendingUp size={16} /> Across all sectors
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                <h4 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">Avg Apps / Job</h4>
                <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                  {jobs.length > 0 ? (applications.length / jobs.length).toFixed(1) : '0'}
                </div>
                <p className="text-orange-600 dark:text-orange-400 text-sm font-bold flex items-center gap-1">
                  <TrendingUp size={16} /> Engagement rate
                </p>
              </div>
            </div>

            {/* Top Jobs & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Top 5 Most Viewed Jobs */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top 5 Most Viewed Jobs</h4>
                <div className="space-y-4">
                  {jobs
                    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                    .slice(0, 5)
                    .map((job, index) => (
                      <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 dark:text-white truncate text-sm">{job.title}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{job.category || 'Uncategorized'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-blue-600 dark:text-blue-400">{job.viewCount || 0}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">Views</div>
                        </div>
                      </div>
                    ))}
                  {jobs.length === 0 && (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 italic">
                      No job data available yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Top 5 Most Applied Jobs */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top 5 Most Applied Jobs</h4>
                <div className="space-y-4">
                  {jobs
                    .map(job => ({
                      ...job,
                      appCount: applications.filter(a => a.jobId === job.id).length
                    }))
                    .sort((a, b) => b.appCount - a.appCount)
                    .slice(0, 5)
                    .map((job, index) => (
                      <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 dark:text-white truncate text-sm">{job.title}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{job.category || 'Uncategorized'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-blue-600 dark:text-blue-400">{job.appCount}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">Apps</div>
                        </div>
                      </div>
                    ))}
                  {jobs.length === 0 && (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 italic">
                      No job data available yet.
                    </div>
                  )}
                </div>
              </div>

              {/* User Distribution */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">User Distribution</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { role: 'Seekers', count: users.filter(u => u.role === 'seeker').length },
                      { role: 'Employers', count: users.filter(u => u.role === 'employer').length },
                      { role: 'Admins', count: users.filter(u => u.role === 'admin').length },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#f3f4f6'} vertical={false} />
                      <XAxis dataKey="role" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#111827' : '#fff', 
                          borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                          borderRadius: '12px',
                          color: isDarkMode ? '#fff' : '#000'
                        }} 
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Job Status Distribution */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Job Listings Status</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: jobs.filter(j => j.status === 'active').length },
                          { name: 'Pending', value: jobs.filter(j => j.status === 'pending').length },
                          { name: 'Closed', value: jobs.filter(j => j.status === 'closed').length },
                          { name: 'Rejected', value: jobs.filter(j => j.status === 'rejected').length },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Active', color: '#10b981' },
                          { name: 'Pending', color: '#f59e0b' },
                          { name: 'Closed', color: '#6b7280' },
                          { name: 'Rejected', color: '#ef4444' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#111827' : '#fff', 
                          borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                          borderRadius: '12px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {[
                    { label: 'Active', color: 'bg-green-500' },
                    { label: 'Pending', color: 'bg-yellow-500' },
                    { label: 'Closed', color: 'bg-gray-500' },
                    { label: 'Rejected', color: 'bg-red-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Full Job Performance Table */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">Full Job Performance Report</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Job Title</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Views</th>
                      <th className="px-6 py-4 text-center">Applications</th>
                      <th className="px-6 py-4 text-center">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {jobs.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).map(job => {
                      const appCount = applications.filter(a => a.jobId === job.id).length;
                      const convRate = job.viewCount && job.viewCount > 0 
                        ? ((appCount / job.viewCount) * 100).toFixed(1) 
                        : '0.0';
                      
                      return (
                        <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900 dark:text-white">{job.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{job.location}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {job.category || 'Uncategorized'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              job.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                              job.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                              'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">
                            {job.viewCount || 0}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">
                            {appCount}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{convRate}%</span>
                              <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500" 
                                  style={{ width: `${Math.min(parseFloat(convRate), 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
