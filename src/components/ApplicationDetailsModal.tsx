import React, { useState, useEffect } from 'react';
import { Application, Job, Company, Message, UserProfile } from '../types';
import { X, FileText, Clock, Building2, MapPin, Briefcase, ExternalLink, Download, CheckCircle2, AlertCircle, XCircle, Send, MessageSquare, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../App';
import { messageService } from '../services/messageService';

interface ApplicationDetailsModalProps {
  application: Application;
  job: Job | undefined;
  company: Company | undefined;
  applicant?: UserProfile;
  onClose: () => void;
}

export default function ApplicationDetailsModal({ application, job, company, applicant, onClose }: ApplicationDetailsModalProps) {
  const { user, profile } = useAuth();
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showChat, setShowChat] = useState(false);

  const isEmployer = profile?.role === 'employer';

  useEffect(() => {
    if (application.id) {
      const unsubscribe = messageService.subscribeToApplicationMessages(application.id, setMessages);
      return () => unsubscribe();
    }
  }, [application.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !user) return;

    setIsSending(true);
    try {
      await messageService.sendMessage(
        application.id,
        user.uid,
        isEmployer ? application.seekerId : application.employerId,
        messageContent.trim()
      );
      setMessageContent('');
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "w-4 h-4 md:w-5 md:h-5";
    switch (status) {
      case 'applied': return <Clock className={`${iconClass} text-blue-500`} />;
      case 'reviewed': return <AlertCircle className={`${iconClass} text-yellow-500`} />;
      case 'accepted': return <CheckCircle2 className={`${iconClass} text-green-500`} />;
      case 'rejected': return <XCircle className={`${iconClass} text-red-500`} />;
      default: return <Clock className={`${iconClass} text-gray-500`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'reviewed': return 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30';
      case 'accepted': return 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30';
      default: return 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (date: any) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(date?.toDate?.() || new Date(date)) + ' ago';
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col mt-auto md:mt-0"
      >
        <div className="p-5 md:p-8 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-9 h-9 md:w-12 md:h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl md:rounded-2xl flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
              <FileText className="text-blue-600 dark:text-blue-400 w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight truncate">Application Details</h2>
              <p className="text-gray-500 dark:text-zinc-400 text-[8px] md:text-sm font-medium truncate">ID: {application.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="p-5 md:p-8 overflow-y-auto custom-scrollbar flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 mb-6 md:mb-10">
            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-[9px] md:text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 md:mb-2">Current Status</label>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[9px] md:text-xs font-black uppercase tracking-widest border shadow-sm ${getStatusColor(application.status)}`}>
                  {getStatusIcon(application.status)} {application.status}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-[9px] md:text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 md:mb-2">Applied On</label>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300 font-bold text-xs md:text-sm">
                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500 shrink-0" />
                    <span className="truncate">{formatDate(application.createdAt)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium ml-6">({getTimeAgo(application.createdAt)})</p>
                </div>

                {application.updatedAt && (
                  <div>
                    <label className="block text-[9px] md:text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 md:mb-2">Last Updated</label>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300 font-bold text-xs md:text-sm">
                      <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500 shrink-0" />
                      <span className="truncate">{formatDate(application.updatedAt)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium ml-6">({getTimeAgo(application.updatedAt)})</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-zinc-800 space-y-3 md:space-y-4">
              <h4 className="text-[10px] md:text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                {isEmployer ? 'Applicant Information' : 'Job Information'}
              </h4>
              <div className="space-y-2.5 md:space-y-3">
                {isEmployer ? (
                  <>
                    <div className="flex items-center gap-3">
                      <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500 shrink-0" />
                      <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300 line-clamp-1">{applicant?.displayName || 'Anonymous Applicant'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500 shrink-0" />
                      <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300 line-clamp-1">{job?.title || 'Loading...'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500 shrink-0" />
                      <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300 line-clamp-1">{company?.name || 'Loading...'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500 shrink-0" />
                      <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300 line-clamp-1">{job?.title || 'Loading...'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500 shrink-0" />
                      <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-300 line-clamp-1">{job?.location || 'Loading...'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5 md:space-y-8">
            <div>
              <label className="block text-[9px] md:text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2 md:mb-3">Cover Letter</label>
              <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-zinc-800">
                <p className="text-gray-700 dark:text-zinc-300 text-[11px] md:text-sm leading-relaxed whitespace-pre-wrap">
                  {application.coverLetter || 'No cover letter provided.'}
                </p>
              </div>
            </div>

            {application.resumeURL && (
              <div>
                <label className="block text-[9px] md:text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2 md:mb-3">Attached Resume</label>
                <a 
                  href={application.resumeURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-5 py-2.5 md:px-6 md:py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-xs md:text-sm rounded-xl md:rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-100 dark:border-blue-900/30 w-full sm:w-auto justify-center sm:justify-start"
                >
                  <Download className="w-4 h-4 md:w-4.5 md:h-4.5" />
                  View/Download Resume
                  <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 md:p-8 border-t border-gray-100 dark:border-zinc-800 shrink-0 space-y-3 md:space-y-4 bg-white dark:bg-zinc-900">
          {!showChat ? (
            <button
              onClick={() => setShowChat(true)}
              className="w-full py-3.5 md:py-4 bg-blue-600 text-white font-black rounded-xl md:rounded-2xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <MessageSquare size={18} />
              {isEmployer ? 'Message Applicant' : 'Messages'}
              {messages.length > 0 && (
                <span className="bg-white text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-black">
                  {messages.length}
                </span>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Messages</h4>
                <button 
                  onClick={() => setShowChat(false)}
                  className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline"
                >
                  Hide Chat
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="overflow-y-auto p-4 space-y-4 min-h-[120px] max-h-[30vh] md:max-h-48 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <MessageSquare size={24} className="text-gray-300 dark:text-zinc-700 mb-2" />
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 italic uppercase tracking-widest">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${msg.senderId === user?.uid ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm max-w-[85%] leading-relaxed ${
                          msg.senderId === user?.uid 
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                            : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 rounded-tl-none border border-gray-100 dark:border-zinc-700 shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 mt-1 px-1 uppercase tracking-tighter">
                          {getTimeAgo(msg.createdAt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white transition-all shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !messageContent.trim()}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0"
                  >
                    {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </form>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3.5 md:py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm md:text-base border border-transparent dark:border-gray-200"
          >
            Close Details
          </button>
        </div>
      </motion.div>
    </div>
  );
}
