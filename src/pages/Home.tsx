import React, { useState, useEffect } from 'react';
import { Job, Company } from '../types';
import { Search, MapPin, Briefcase, DollarSign, Filter, ChevronRight, Loader2, Star, TrendingUp, Laptop, Heart, ShoppingBag, Truck, Utensils, Construction, GraduationCap, Calendar, Send, Building2, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';
import QuickApplyModal from '../components/QuickApplyModal';
import { CATEGORIES } from '../constants';
import { jobService } from '../services/jobService';
import { companyService } from '../services/companyService';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Home() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState(false);
  const [hideExpired, setHideExpired] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    // Fetch Active Jobs
    const unsubscribeJobs = jobService.subscribeToActiveJobs((jobsData) => {
      setJobs(jobsData);
      setLoading(false);
    });

    // Fetch all companies to map names
    const unsubscribeCompanies = companyService.subscribeToAllCompanies((companiesData) => {
      const companiesMap: Record<string, Company> = {};
      companiesData.forEach(company => {
        companiesMap[company.id] = company;
      });
      setCompanies(companiesMap);
    });

    return () => {
      unsubscribeJobs();
      unsubscribeCompanies();
    };
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = !typeFilter || job.jobType === typeFilter;
    const matchesCategory = !categoryFilter || job.category === categoryFilter;
    const matchesSalary = !salaryFilter || (job.salaryRange && job.salaryRange.toLowerCase().includes(salaryFilter.toLowerCase()));
    const matchesFeatured = !featuredFilter || job.featured === true;
    
    let matchesDeadline = true;
    if (hideExpired && job.deadline) {
      const deadlineDate = job.deadline.toDate ? job.deadline.toDate() : new Date(job.deadline);
      matchesDeadline = deadlineDate >= new Date();
    }

    return matchesSearch && matchesLocation && matchesType && matchesCategory && matchesSalary && matchesFeatured && matchesDeadline;
  });

  const locations = ["Kampala", "Entebbe", "Gulu", "Mbarara", "Jinja", "Lira", "Mbale", "Fort Portal", "Remote"];
  const jobTypes = [
    { id: 'full-time', label: 'Full Time' },
    { id: 'part-time', label: 'Part Time' },
    { id: 'internship', label: 'Internship' },
    { id: 'contract', label: 'Contract' }
  ];

  const salaryRanges = [
    { id: '1M', label: '1M+ UGX' },
    { id: '2M', label: '2M+ UGX' },
    { id: '5M', label: '5M+ UGX' },
    { id: 'Negotiable', label: 'Negotiable' }
  ];

  const featuredJobs = jobs.filter(j => j.featured).slice(0, 3);
  const displayJobs = [...filteredJobs].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });

  const handleApplyClick = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (user && profile?.role === 'seeker') {
      setSelectedJob(job);
    } else {
      navigate(`/jobs/${job.id}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-16 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden relative transition-colors duration-300">
        <div className="relative z-10 max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6"
          >
            Uganda Medical Association <span className="text-blue-600 dark:text-blue-400">Job Portal</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed"
          >
            Connect with top employers across the country. From Kampala to Gulu, your next career move starts here.
          </motion.p>

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner">
            <div className="flex-grow flex items-center px-4 py-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
              <Search className="text-gray-400 dark:text-gray-500 mr-3" size={20} />
              <input 
                type="text" 
                placeholder="Job title, keywords, or company..." 
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:w-48 flex items-center px-4 py-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
              <MapPin className="text-gray-400 dark:text-gray-500 mr-3" size={20} />
              <select 
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white appearance-none"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="" className="dark:bg-gray-900">All Locations</option>
                {locations.map(loc => <option key={loc} value={loc} className="dark:bg-gray-900">{loc}</option>)}
              </select>
            </div>
            <div className="md:w-48 flex items-center px-4 py-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
              <Briefcase className="text-gray-400 dark:text-gray-500 mr-3" size={20} />
              <select 
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white appearance-none"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="" className="dark:bg-gray-900">All Categories</option>
                {CATEGORIES.map(cat => <option key={cat.id} value={cat.id} className="dark:bg-gray-900">{cat.label}</option>)}
              </select>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center">
              Search
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-50 dark:bg-blue-900/10 opacity-50 -skew-x-12 transform translate-x-1/4"></div>
      </section>

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <section className="relative py-12 px-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900/40 dark:to-indigo-900/40 overflow-hidden shadow-2xl">
          {/* Decorative background patterns */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                  <Star className="text-yellow-400 fill-yellow-400 animate-pulse" size={32} /> Featured Opportunities
                </h2>
                <p className="text-blue-100/70 font-medium">Hand-picked premium roles from top companies</p>
              </div>
              <button 
                onClick={() => {
                  setFeaturedFilter(true);
                  document.getElementById('job-listings')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-sm font-bold text-white transition-all"
              >
                View All Featured
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, type: 'spring', stiffness: 100 }}
                  className="h-full"
                >
                  <Link 
                    to={`/jobs/${job.id}`}
                    className="block h-full bg-slate-950/40 hover:bg-slate-950/60 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 hover:border-white/30 shadow-2xl hover:shadow-blue-500/30 transition-all group relative overflow-hidden flex flex-col"
                  >
                    {/* Premium Shine Effect */}
                    <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -rotate-45 translate-x-[-100%] group-hover:translate-x-[200%] pointer-events-none"></div>
                    
                    <div className="flex items-start justify-between mb-10">
                      <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl p-4 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shrink-0">
                        {companies[job.companyId]?.logoURL ? (
                          <img src={companies[job.companyId].logoURL} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <Briefcase className="text-blue-600" size={48} />
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white text-[10px] font-black rounded-full uppercase tracking-[0.25em] shadow-xl shadow-orange-500/30 animate-pulse">
                          <Star size={12} fill="currentColor" /> Featured
                        </span>
                        <span className="px-4 py-1.5 bg-white/10 text-white text-[10px] font-black rounded-xl uppercase tracking-widest border border-white/10 backdrop-blur-md">
                          {job.jobType.replace('-', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-10 flex-grow">
                      <h4 className="font-black text-white text-3xl leading-tight group-hover:text-blue-200 transition-colors tracking-tight">
                        {job.title}
                      </h4>
                      <div className="flex flex-col gap-2">
                        <p className="text-blue-100/80 font-black flex items-center gap-2 text-lg">
                          <Building2 size={20} className="text-blue-300" />
                          {companies[job.companyId]?.name}
                        </p>
                        <div className="flex items-center gap-2 text-blue-100/60 text-sm font-bold">
                          <MapPin size={16} className="text-blue-400" />
                          {job.location}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/10">
                      <div className="space-y-1">
                        <p className="text-[10px] text-blue-100/40 uppercase font-black tracking-[0.25em]">Est. Salary</p>
                        <span className="font-black text-white text-2xl tracking-tighter">{job.salaryRange || 'Negotiable'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleApplyClick(e, job)}
                          className="px-8 py-4 bg-white text-blue-700 font-black text-sm rounded-[1.5rem] shadow-2xl hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group/btn"
                        >
                          <Send size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" /> Apply
                        </button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.id}
              onClick={() => {
                setCategoryFilter(cat.id);
                document.getElementById('job-listings')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-3xl border shadow-sm transition-all group ${
                categoryFilter === cat.id 
                  ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20' 
                  : 'border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/50'
              }`}
            >
              <div className={`w-14 h-14 ${cat.color.includes('bg-') ? cat.color.replace('bg-', 'dark:bg-opacity-20 bg-') : cat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <cat.icon size={28} />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter size={18} className="text-blue-600 dark:text-blue-400" /> Filters
              </h3>
              <button 
                onClick={() => { 
                  setSearchTerm(''); 
                  setLocationFilter(''); 
                  setTypeFilter(''); 
                  setCategoryFilter(''); 
                  setSalaryFilter('');
                  setFeaturedFilter(false); 
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Reset All
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Category</label>
                <select 
                  className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-blue-500 transition-all"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Job Type</label>
                <div className="space-y-2">
                  {jobTypes.map(type => (
                    <label key={type.id} className="flex items-center group cursor-pointer">
                      <input 
                        type="radio" 
                        name="jobType"
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-700 focus:ring-blue-500 rounded"
                        checked={typeFilter === type.id}
                        onChange={() => setTypeFilter(type.id)}
                      />
                      <span className="ml-3 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{type.label}</span>
                    </label>
                  ))}
                  <label className="flex items-center group cursor-pointer">
                    <input 
                      type="radio" 
                      name="jobType"
                      className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-700 focus:ring-blue-500 rounded"
                      checked={typeFilter === ''}
                      onChange={() => setTypeFilter('')}
                    />
                    <span className="ml-3 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">All Types</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Salary Range</label>
                <select 
                  className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-blue-500 transition-all"
                  value={salaryFilter}
                  onChange={(e) => setSalaryFilter(e.target.value)}
                >
                  <option value="">Any Salary</option>
                  {salaryRanges.map(range => <option key={range.id} value={range.id}>{range.label}</option>)}
                </select>
              </div>

              <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                <label className="flex items-center group cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-700 focus:ring-blue-500 rounded"
                    checked={featuredFilter}
                    onChange={(e) => setFeaturedFilter(e.target.checked)}
                  />
                  <span className="ml-3 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" /> Featured Only
                  </span>
                </label>
              </div>

              <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                <label className="flex items-center group cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-700 focus:ring-blue-500 rounded"
                    checked={hideExpired}
                    onChange={(e) => setHideExpired(e.target.checked)}
                  />
                  <span className="ml-3 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Hide Expired Jobs
                  </span>
                </label>
              </div>

              <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm mb-2">Get Job Alerts</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-4 leading-relaxed">We'll notify you when new jobs matching your criteria are posted.</p>
                  <button className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
                    Enable Alerts
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Job Listings */}
        <div id="job-listings" className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {loading ? 'Loading jobs...' : `${filteredJobs.length} Jobs Found`}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Sort by:</span>
              <select className="bg-transparent border-none focus:ring-0 font-semibold text-gray-900 dark:text-white cursor-pointer">
                <option className="dark:bg-gray-900">Newest First</option>
                <option className="dark:bg-gray-900">Salary: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mb-4" size={40} />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Fetching the latest opportunities...</p>
            </div>
          ) : displayJobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {displayJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="h-full"
                  >
                    <div 
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className={`block group rounded-[2.5rem] p-8 border transition-all duration-500 cursor-pointer relative overflow-hidden ${
                        job.featured 
                          ? 'bg-gradient-to-br from-slate-900/5 to-white dark:from-slate-900/40 dark:to-gray-900 border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-slate-400 dark:hover:border-slate-600 ring-1 ring-slate-100 dark:ring-slate-900/30' 
                          : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900/50'
                      }`}
                    >
                      {job.featured && (
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                      )}
                      
                      <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center border transition-all duration-500 overflow-hidden shrink-0 ${
                          job.featured
                            ? 'bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-700 shadow-xl group-hover:scale-110 group-hover:rotate-3'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 group-hover:bg-white dark:group-hover:bg-gray-800 group-hover:shadow-lg'
                        }`}>
                          {companies[job.companyId]?.logoURL ? (
                            <img src={companies[job.companyId].logoURL} alt="Logo" className="w-full h-full object-contain p-3" referrerPolicy="no-referrer" />
                          ) : (
                            <Briefcase className={`${
                              job.featured ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600 group-hover:text-blue-500'
                            }`} size={44} />
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className={`px-4 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-[0.15em] ${
                              job.featured
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50'
                            }`}>
                              {job.jobType.replace('-', ' ')}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                              <Clock size={12} />
                              {formatDistanceToNow(job.createdAt.toDate())} ago
                            </span>
                          </div>
                          
                          <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center flex-wrap gap-3 leading-tight">
                            {job.title}
                            {job.featured && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20">
                                <Star size={10} fill="currentColor" /> Featured
                              </span>
                            )}
                          </h3>
                          
                          <div className="flex items-center gap-2 mb-6">
                            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                              <Building2 size={12} className="text-blue-500" />
                            </div>
                            <Link 
                              to={`/company/${job.companyId}`} 
                              className="text-gray-600 dark:text-gray-400 font-bold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {companies[job.companyId]?.name || 'Unknown Company'}
                            </Link>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 md:gap-8">
                            <div className="flex items-center gap-3 group/info">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover/info:scale-110 transition-transform">
                                <MapPin size={18} className="text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Location</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{job.location}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 group/info">
                              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center group-hover/info:scale-110 transition-transform">
                                <DollarSign size={18} className="text-green-600 dark:text-green-400" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Salary</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{job.salaryRange || 'Negotiable'}</p>
                              </div>
                            </div>

                            {job.deadline && (
                              <div className="flex items-center gap-3 group/info">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center group-hover/info:scale-110 transition-transform">
                                  <Calendar size={18} className="text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Deadline</p>
                                  <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                    {job.deadline.toDate ? job.deadline.toDate().toLocaleDateString() : new Date(job.deadline).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-4 shrink-0">
                          <button
                            onClick={(e) => handleApplyClick(e, job)}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0"
                          >
                            <Send size={18} /> Quick Apply
                          </button>
                          <div className="hidden md:flex w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white group-hover:rotate-90 transition-all duration-500">
                            <ChevronRight size={24} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No jobs found</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Try adjusting your search terms or filters to find more opportunities.</p>
              <button 
                onClick={() => { setSearchTerm(''); setLocationFilter(''); setTypeFilter(''); setCategoryFilter(''); }}
                className="mt-6 text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
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
      </AnimatePresence>
    </div>
  );
}
