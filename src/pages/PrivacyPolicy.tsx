import React from 'react';
import { Shield, Lock, Eye, FileText, Bell, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export default function PrivacyPolicy() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mb-4"
          >
            <Shield size={32} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl tracking-tight"
          >
            Privacy <span className="text-blue-600">Policy</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-xl text-gray-500 dark:text-zinc-400"
          >
            Last updated: March 31, 2026
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 md:p-12 space-y-12"
        >
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Eye className="text-blue-600" size={24} />
              1. Introduction
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
              Welcome to the Uganda Medical Association (UMA) Job Portal. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <FileText className="text-blue-600" size={24} />
              2. Data We Collect
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-zinc-400">
              <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
              <li><strong>Professional Data:</strong> includes your CV, medical registration details, education history, and work experience.</li>
              <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Lock className="text-blue-600" size={24} />
              3. How We Use Your Data
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-zinc-400">
              <li>To register you as a new user (Job Seeker or Employer).</li>
              <li>To facilitate the job application process.</li>
              <li>To manage our relationship with you.</li>
              <li>To improve our website, services, and user experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Globe className="text-blue-600" size={24} />
              4. Data Sharing
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
              When you apply for a job, your profile and application data will be shared with the respective Employer. We do not sell your personal data to third parties. We may share your data with service providers who assist us in operating our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Bell className="text-blue-600" size={24} />
              5. Your Rights
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, or to object to processing.
            </p>
          </section>

          <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-gray-600 dark:text-zinc-400">
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
              <br />
              <span className="font-semibold text-blue-600">privacy@uma.ug</span>
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
