import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Calendar, Share2, Facebook, Twitter, Linkedin, Bookmark } from 'lucide-react';
import { articles as mockArticles } from '../data/articles';
import { articleService } from '../services/articleService';
import { Article } from '../types';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';

export default function ArticleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;
    const fetchArticle = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        // Try Firestore first
        const data = await articleService.getArticleById(id).catch(err => {
          console.error('Firestore getArticleById failed:', err);
          return null;
        });
        
        if (!isMounted) return;

        if (data) {
          setArticle(data);
        } else {
          // Try mock data
          const mock = mockArticles.find(a => a.id === id);
          if (mock) {
            setArticle({ ...mock, image: mock.imageUrl, status: 'published' } as Article);
          }
        }
        
        // Fetch related
        const all = await articleService.getAllArticles().catch(err => {
          console.error('Firestore getAllArticles failed:', err);
          return [];
        });
        
        if (!isMounted) return;

        const filtered = all.filter(a => a.id !== id).slice(0, 2);
        if (filtered.length === 0) {
          setRelatedArticles(mockArticles.filter(a => a.id !== id).slice(0, 2).map(m => ({ ...m, image: m.imageUrl } as Article)));
        } else {
          setRelatedArticles(filtered);
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchArticle();
    return () => { isMounted = false; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
          src={article.image || article.imageUrl} 
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
          {relatedArticles.map(related => (
            <Link 
              key={related.id} 
              to={`/career-advice/${related.id}`}
              className="group flex gap-6 items-center p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all"
            >
              <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                <img 
                  src={related.image || related.imageUrl} 
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
