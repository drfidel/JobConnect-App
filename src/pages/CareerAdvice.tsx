import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Clock, User, ArrowRight, ChevronRight, Filter } from 'lucide-react';
import { articles as mockArticles } from '../data/articles';
import { articleService } from '../services/articleService';
import { Article } from '../types';
import { motion } from 'motion/react';

export default function CareerAdvice() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching articles from Firestore...');
        const firestoreArticles = await articleService.getAllArticles().catch(err => {
          console.error('Firestore fetch failed, using mock data only:', err);
          return [];
        });
        
        if (!isMounted) return;

        // Combine mock articles with firestore articles, avoiding duplicates by title
        const combined = [...firestoreArticles];
        const firestoreTitles = new Set(firestoreArticles.map(a => a.title.toLowerCase()));
        
        mockArticles.forEach(mock => {
          if (!firestoreTitles.has(mock.title.toLowerCase())) {
            combined.push({
              ...mock,
              image: mock.imageUrl, // Map imageUrl to image for consistency
              status: 'published'
            } as Article);
          }
        });
        
        console.log(`Loaded ${combined.length} articles total.`);
        setArticles(combined);
      } catch (error) {
        console.error('Error in fetchArticles effect:', error);
        if (isMounted) {
          setArticles(mockArticles.map(m => ({ ...m, image: m.imageUrl, status: 'published' } as Article)));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchArticles();
    return () => { isMounted = false; };
  }, []);

  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    articles.forEach(article => {
      counts[article.category] = (counts[article.category] || 0) + 1;
    });
    
    // Use ARTICLE_CATEGORIES to maintain a consistent order, but only show those that have articles
    // or just show all of them if we want to encourage content creation?
    // Let's stick to dynamic categories for now but with counts.
    const dynamicCategories = Object.keys(counts).sort();
    return [
      { name: 'All', count: articles.length },
      ...dynamicCategories.map(name => ({ name, count: counts[name] }))
    ];
  }, [articles]);

  const filteredArticles = useMemo(() => articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [articles, searchTerm, selectedCategory]);

  const featuredArticle = articles.length > 0 ? articles[0] : null;

  if (isLoading && articles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Career <span className="text-blue-600 italic serif">Advice</span> & Insights
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Expert tips, industry trends, and practical guides to help you navigate your professional journey and land your dream job.
          </p>
        </motion.div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
            <Filter size={18} className="text-gray-400 mr-2 hidden md:block" />
            {categoriesWithCounts.map(category => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedCategory === category.name
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span>{category.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedCategory === category.name
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Article */}
      {searchTerm === '' && selectedCategory === 'All' && featuredArticle && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-blue-50 dark:bg-blue-900/10 rounded-3xl overflow-hidden border border-blue-100 dark:border-blue-900/20">
            <div className="h-64 lg:h-full relative">
              <img 
                src={featuredArticle.image || featuredArticle.imageUrl} 
                alt={featuredArticle.title}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                  Featured
                </span>
              </div>
            </div>
            <div className="p-8 lg:p-12">
              <div className="flex items-center gap-4 text-sm text-blue-600 dark:text-blue-400 font-semibold mb-4 uppercase tracking-widest">
                <span>{featuredArticle.category}</span>
                <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                <span>{featuredArticle.readTime}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                {featuredArticle.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 line-clamp-3">
                {featuredArticle.excerpt}
              </p>
              <Link 
                to={`/career-advice/${featuredArticle.id}`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Read Full Article <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredArticles.map((article, index) => (
          <motion.article
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300 flex flex-col"
          >
            <Link to={`/career-advice/${article.id}`} className="relative h-48 overflow-hidden">
              <img 
                src={article.image || article.imageUrl} 
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-900 dark:text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                  {article.category}
                </span>
              </div>
            </Link>
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
                <span className="flex items-center gap-1"><User size={14} /> {article.author}</span>
                <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></span>
                <span className="flex items-center gap-1"><Clock size={14} /> {article.readTime}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                <Link to={`/career-advice/${article.id}`}>{article.title}</Link>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">
                {article.excerpt}
              </p>
              <Link 
                to={`/career-advice/${article.id}`}
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-sm hover:gap-2 transition-all"
              >
                Read More <ChevronRight size={16} />
              </Link>
            </div>
          </motion.article>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-20">
          <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <BookOpen size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No articles found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or category filter.</p>
        </div>
      )}

      {/* Newsletter Section */}
      <div className="mt-24 bg-gray-900 dark:bg-blue-950 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Get Career Advice in Your Inbox</h2>
          <p className="text-gray-400 mb-8">Join 50,000+ professionals receiving our weekly newsletter with the latest job market insights and career growth tips.</p>
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Enter your email address"
              className="flex-grow px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all whitespace-nowrap">
              Subscribe Now
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-4">We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </div>
    </div>
  );
}
