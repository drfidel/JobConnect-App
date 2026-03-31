import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Calendar, Share2, Facebook, Twitter, Linkedin, Bookmark } from 'lucide-react';
import { articles } from '../data/articles';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';

export default function ArticleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const article = articles.find(a => a.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!article) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Article Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">The article you are looking for does not exist or has been removed.</p>
        <Link to="/career-advice" className="text-blue-600 hover:underline font-bold flex items-center justify-center gap-2">
          <ArrowLeft size={20} /> Back to Career Advice
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back Button */}
      <Link 
        to="/career-advice" 
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold mb-12 transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Career Advice
      </Link>

      {/* Article Header */}
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-6">
          <span>{article.category}</span>
          <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
          <span>{article.readTime}</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-8 leading-tight tracking-tight">
          {article.title}
        </h1>
        
        <div className="flex flex-wrap items-center justify-between gap-6 py-8 border-y border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User size={24} />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-bold">{article.author}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar size={14} /> {article.date}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
              <Share2 size={20} />
            </button>
            <button className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
              <Bookmark size={20} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Featured Image */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-16 rounded-3xl overflow-hidden shadow-2xl"
      >
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="w-full h-auto object-cover max-h-[500px]"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      {/* Article Content */}
      <motion.article 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-img:rounded-3xl"
      >
        <div className="markdown-body">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
      </motion.article>

      {/* Social Share Footer */}
      <div className="mt-20 pt-12 border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Share this article</h3>
            <p className="text-gray-600 dark:text-gray-400">Help your network grow by sharing these insights.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-[#1877F2] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all">
              <Facebook size={20} /> Facebook
            </button>
            <button className="flex items-center gap-2 bg-[#1DA1F2] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all">
              <Twitter size={20} /> Twitter
            </button>
            <button className="flex items-center gap-2 bg-[#0A66C2] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all">
              <Linkedin size={20} /> LinkedIn
            </button>
          </div>
        </div>
      </div>

      {/* Related Articles (Simple list) */}
      <div className="mt-24">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">More from Career Advice</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.filter(a => a.id !== id).slice(0, 2).map(related => (
            <Link 
              key={related.id} 
              to={`/career-advice/${related.id}`}
              className="group flex gap-6 items-center p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all"
            >
              <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                <img 
                  src={related.imageUrl} 
                  alt={related.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-1 block">
                  {related.category}
                </span>
                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
                  {related.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
