import React, { useState } from 'react';
import { applicationService } from '../services/applicationService';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../App';
import { Job, Company } from '../types';
import { X, Loader2, Send, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickApplyModalProps {
  job: Job;
  company: Company | undefined;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickApplyModal({ job, company, onClose, onSuccess }: QuickApplyModalProps) {
  const { user, profile } = useAuth();
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSubmitting(true);
    setError('');

    try {
      // 1. Create Application
      await applicationService.createApplication({
        jobId: job.id,
        seekerId: user.uid,
        employerId: job.employerId,
        status: 'applied',
        coverLetter,
        resumeURL: profile.photoURL || '' // Simplified for demo
      });

      // 2. Notify Employer
      await notificationService.createNotification({
        userId: job.employerId,
        title: 'New Application',
        message: `${profile.displayName || 'A seeker'} applied for your job: ${job.title}`,
        type: 'new_application',
        link: '/employer-dashboard'
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden mt-auto md:mt-0"
      >
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6 md:mb-8">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl md:rounded-2xl flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                <FileText className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Quick Apply</h2>
                <p className="text-gray-500 dark:text-zinc-400 text-[10px] md:text-sm font-medium">Applying for <span className="text-blue-600 dark:text-blue-400">{job.title}</span></p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {success ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Application Sent!</h3>
              <p className="text-gray-500 dark:text-zinc-400">Your application has been submitted successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Your profile will be shared</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 ml-11">
                  Employer will see your name, skills, and experience from your professional profile.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Cover Letter (Optional)</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell the employer why you're a great fit for this role..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white min-h-[150px] resize-none transition-all"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-900/30">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 md:py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Submit Application
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
