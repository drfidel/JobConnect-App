import React, { useState, useEffect } from 'react';
import { Star, Flag, User, Clock, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { reviewService } from '../services/reviewService';
import { Review } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';

interface ReviewListProps {
  companyId: string;
}

export default function ReviewList({ companyId }: ReviewListProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');

  useEffect(() => {
    const unsubscribe = reviewService.subscribeToCompanyReviews(companyId, (data) => {
      setReviews(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [companyId]);

  const handleFlag = async (reviewId: string) => {
    if (!flagReason.trim()) return;
    try {
      await reviewService.flagReview(reviewId, flagReason);
      setFlaggingId(null);
      setFlagReason('');
    } catch (err) {
      console.error('Error flagging review:', err);
    }
  };

  const calculateAverage = (field: keyof Review) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Reviews Summary */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="text-center md:border-r border-gray-100 dark:border-zinc-800">
            <p className="text-4xl font-black text-gray-900 dark:text-white mb-1">{calculateAverage('rating')}</p>
            <div className="flex justify-center gap-0.5 text-yellow-400 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} fill={s <= Number(calculateAverage('rating')) ? 'currentColor' : 'none'} />
              ))}
            </div>
            <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Overall Rating</p>
          </div>
          <div className="text-center md:border-r border-gray-100 dark:border-zinc-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{calculateAverage('workLifeBalance')}</p>
            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Work-Life Balance</p>
          </div>
          <div className="text-center md:border-r border-gray-100 dark:border-zinc-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{calculateAverage('management')}</p>
            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Management</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{calculateAverage('culture')}</p>
            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Culture</p>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm relative group"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-grow space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{review.isAnonymous ? 'Anonymous Seeker' : review.authorName || 'Anonymous Seeker'}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500">
                        <Clock size={12} />
                        {formatDistanceToNow(review.createdAt.toDate())} ago
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={16} fill={s <= review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>

                  <p className="text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {review.comment}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-50 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400">
                      <span className="text-gray-400 dark:text-zinc-500">WLB:</span> {review.workLifeBalance}/5
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400">
                      <span className="text-gray-400 dark:text-zinc-500">Management:</span> {review.management}/5
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400">
                      <span className="text-gray-400 dark:text-zinc-500">Culture:</span> {review.culture}/5
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {user && user.uid !== review.seekerId && (
                    <button
                      onClick={() => setFlaggingId(review.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Flag inappropriate content"
                    >
                      <Flag size={18} />
                    </button>
                  )}
                  {review.status === 'approved' && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-green-100 dark:border-green-900/30">
                      <ShieldCheck size={10} /> Verified
                    </div>
                  )}
                </div>
              </div>

              {/* Flag Modal Overlay */}
              <AnimatePresence>
                {flaggingId === review.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-3xl flex items-center justify-center p-6 z-20"
                  >
                    <div className="w-full max-w-sm space-y-4">
                      <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-2">
                        <AlertTriangle size={24} />
                        <h4 className="font-bold text-lg">Flag Review</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-zinc-400">Why are you flagging this review? Our moderation team will investigate.</p>
                      <textarea
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        placeholder="Reason for flagging..."
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm min-h-[100px] text-gray-900 dark:text-white"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => setFlaggingId(null)}
                          className="flex-grow py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400 font-bold rounded-xl transition-all text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleFlag(review.id)}
                          className="flex-grow py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-red-500/20"
                        >
                          Submit Flag
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800 shadow-sm">
            <Star className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" size={48} />
            <p className="text-gray-500 dark:text-zinc-400 font-medium text-lg">No reviews yet.</p>
            <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">Be the first to share your experience!</p>
          </div>
        )}
      </div>
    </div>
  );
}
