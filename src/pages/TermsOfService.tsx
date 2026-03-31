import React from 'react';
import { FileText, CheckCircle, AlertCircle, HelpCircle, Scale, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function TermsOfService() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mb-4"
          >
            <Scale size={32} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl tracking-tight"
          >
            Terms of <span className="text-blue-600">Service</span>
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
              <FileText className="text-blue-600" size={24} />
              1. Agreement to Terms
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
              By accessing or using the Uganda Medical Association (UMA) Job Portal, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <ShieldCheck className="text-blue-600" size={24} />
              2. User Eligibility
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">
              You must be at least 18 years old and a qualified medical professional or a legitimate healthcare employer to use this platform.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-zinc-400">
              <li><strong>Job Seekers:</strong> Must provide accurate information about their qualifications and registration status.</li>
              <li><strong>Employers:</strong> Must provide accurate information about their organization and the job opportunities they post.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <CheckCircle className="text-blue-600" size={24} />
              3. User Conduct
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-zinc-400">
              <li>Post false, inaccurate, or misleading information.</li>
              <li>Violate any laws or regulations.</li>
              <li>Infringe upon the intellectual property rights of others.</li>
              <li>Use the platform for any fraudulent or malicious purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <AlertCircle className="text-blue-600" size={24} />
              4. Limitation of Liability
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
              UMA Job Portal is a platform connecting job seekers and employers. We do not guarantee employment or the accuracy of job postings. We are not liable for any direct, indirect, or consequential damages arising from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <HelpCircle className="text-blue-600" size={24} />
              5. Changes to Terms
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new terms on this page. Your continued use of the platform after such changes constitutes your acceptance of the new terms.
            </p>
          </section>

          <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Questions?</h2>
            <p className="text-gray-600 dark:text-zinc-400">
              If you have any questions about these Terms of Service, please contact us at:
              <br />
              <span className="font-semibold text-blue-600">legal@uma.ug</span>
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
