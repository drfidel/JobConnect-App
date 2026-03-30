import React, { useState } from 'react';
import { Star, Loader2, User, ShieldCheck } from 'lucide-react';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../App';
import { motion } from 'motion/react';

interface ReviewFormProps {
  companyId: string;
  companyName: string;
  onSuccess: () => void;
}

export default function ReviewForm({ companyId, companyName, onSuccess }: ReviewFormProps) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [workLifeBalance, setWorkLifeBalance] = useState(0);
  const [management, setManagement] = useState(0);
  const [culture, setCulture] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (rating === 0) {
      setError('Please provide an overall rating.');
      return;
    }
    if (comment.trim().length < 10) {
      setError('Please provide a more detailed comment (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await reviewService.createReview({
        companyId,
        companyName,
        seekerId: user.uid,
        authorName: isAnonymous ? 'Anonymous Seeker' : profile?.displayName || user.displayName || 'Anonymous Seeker',
        rating,
        workLifeBalance,
        management,
        culture,
        comment,
        isAnonymous,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number, onChange: (v: number) => void, label: string }) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-gray-700 dark:text-zinc-300">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`transition-all duration-200 ${star <= value ? 'text-yellow-400 scale-110' : 'text-gray-300 dark:text-zinc-700 hover:text-yellow-200'}`}
          >
            <Star size={24} fill={star <= value ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  );

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 dark:bg-green-900/20 p-8 rounded-3xl border border-green-100 dark:border-green-900/30 text-center"
      >
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="text-green-600 dark:text-green-400" size={32} />
        </div>
        <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">Review Submitted!</h3>
        <p className="text-green-700 dark:text-green-300">Thank you for your feedback. Your review is now pending moderation.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-zinc-900 p-6 md:p-10 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Write a Review</h3>
        <p className="text-gray-500 dark:text-zinc-400">Share your experience to help other job seekers.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-100 dark:border-red-900/30">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StarRating label="Overall Rating" value={rating} onChange={setRating} />
        <StarRating label="Work-Life Balance" value={workLifeBalance} onChange={setWorkLifeBalance} />
        <StarRating label="Management" value={management} onChange={setManagement} />
        <StarRating label="Culture" value={culture} onChange={setCulture} />
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300">Written Feedback</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What's it like to work here? Pros, cons, and advice for management..."
          className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[150px] text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-blue-600 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            <User size={16} /> Post Anonymously
          </div>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}
