import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Job, Company } from '../types';
import { Search, MapPin, Briefcase, DollarSign, Filter, ChevronRight, Loader2, Star, TrendingUp, Laptop, Heart, ShoppingBag, Truck, Utensils, Construction, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef, 
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(jobsData);
      setLoading(false);

      // Fetch companies for these jobs
      const companyIds = Array.from(new Set(jobsData.map(j => j.companyId)));
      companyIds.forEach(async (id) => {
        if (!companies[id]) {
          const companyRef = collection(db, 'companies');
          // In a real app, we'd batch this or use a more efficient way
          // For now, we'll just let the snapshot handle it if we had a listener
        }
      });
    }, (error) => {
      console.error("Error fetching jobs:", error);
      setLoading(false);
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

    return () => {
      unsubscribe();
      unsubscribeCompanies();
    };
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = !typeFilter || job.jobType === typeFilter;
    return matchesSearch && matchesLocation && matchesType;
  });

  const locations = ["Kampala", "Entebbe", "Gulu", "Mbarara", "Jinja", "Lira", "Mbale", "Fort Portal", "Remote"];
  const jobTypes = [
    { id: 'full-time', label: 'Full Time' },
    { id: 'part-time', label: 'Part Time' },
    { id: 'internship', label: 'Internship' },
    { id: 'contract', label: 'Contract' }
  ];

  const categories = [
    { id: 'tech', label: 'Technology', icon: Laptop, color: 'bg-blue-50 text-blue-600' },
    { id: 'health', label: 'Healthcare', icon: Heart, color: 'bg-red-50 text-red-600' },
    { id: 'sales', label: 'Sales & Marketing', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { id: 'retail', label: 'Retail', icon: ShoppingBag, color: 'bg-orange-50 text-orange-600' },
    { id: 'logistics', label: 'Logistics', icon: Truck, color: 'bg-purple-50 text-purple-600' },
    { id: 'food', label: 'Food & Beverage', icon: Utensils, color: 'bg-yellow-50 text-yellow-600' },
    { id: 'construction', label: 'Construction', icon: Construction, color: 'bg-stone-50 text-stone-600' },
    { id: 'education', label: 'Education', icon: GraduationCap, color: 'bg-indigo-50 text-indigo-600' }
  ];

  const featuredJobs = jobs.filter(j => j.featured).slice(0, 3);
  const regularJobs = jobs.filter(j => !j.featured);

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
            Find your dream job in <span className="text-blue-600 dark:text-blue-400">Uganda</span>
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
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="text-yellow-500 fill-yellow-500" size={24} /> Featured Opportunities
            </h2>
            <Link to="/jobs" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">View all featured</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredJobs.map(job => (
              <Link 
                key={job.id} 
                to={`/jobs/${job.id}`}
                className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center overflow-hidden border border-blue-100 dark:border-blue-900/30 group-hover:bg-blue-600 transition-colors">
                    {companies[job.companyId]?.logoURL ? (
                      <img src={companies[job.companyId].logoURL} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Briefcase className="text-blue-600 dark:text-blue-400 group-hover:text-white" size={28} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{job.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{companies[job.companyId]?.name}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {job.jobType}
                  </span>
                  <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {job.location}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-900 dark:text-white">{job.salaryRange || 'Negotiable'}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                    Apply <ChevronRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(cat => (
            <button 
              key={cat.id}
              className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/50 transition-all group"
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
                onClick={() => { setSearchTerm(''); setLocationFilter(''); setTypeFilter(''); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Reset All
              </button>
            </div>

            <div className="space-y-6">
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
        <div className="lg:col-span-3 space-y-6">
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
          ) : regularJobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {regularJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Link 
                      to={`/jobs/${job.id}`}
                      className="block group bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors overflow-hidden">
                          {companies[job.companyId]?.logoURL ? (
                            <img src={companies[job.companyId].logoURL} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Briefcase className="text-gray-300 dark:text-gray-600 group-hover:text-blue-300 dark:group-hover:text-blue-400" size={32} />
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
                              {job.jobType.replace('-', ' ')}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                              Posted {formatDistanceToNow(job.createdAt.toDate())} ago
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                            {job.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 font-medium mb-4">
                            {companies[job.companyId]?.name || 'Unknown Company'}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={16} className="text-gray-400 dark:text-gray-500" />
                              {job.location}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign size={16} className="text-gray-400 dark:text-gray-500" />
                              {job.salaryRange || 'Negotiable'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end">
                          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <ChevronRight size={20} />
                          </div>
                        </div>
                      </div>
                    </Link>
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
                onClick={() => { setSearchTerm(''); setLocationFilter(''); setTypeFilter(''); }}
                className="mt-6 text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
