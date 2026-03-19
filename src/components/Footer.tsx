import React from 'react';
import { Briefcase, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-16 pb-8 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                <Briefcase size={24} />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">JobConnect <span className="text-blue-600">Uganda</span></span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              The leading job platform in Uganda, connecting talented professionals with top employers across the country.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-blue-600 hover:text-white transition-all">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-blue-600 hover:text-white transition-all">
                <Twitter size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-blue-600 hover:text-white transition-all">
                <Linkedin size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-blue-600 hover:text-white transition-all">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-xs">For Job Seekers</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Browse Jobs</Link></li>
              <li><Link to="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">My Applications</Link></li>
              <li><Link to="/profile" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Career Advice</Link></li>
              <li><Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Job Alerts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-xs">For Employers</h4>
            <ul className="space-y-4">
              <li><Link to="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Post a Job</Link></li>
              <li><Link to="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Browse Talent</Link></li>
              <li><Link to="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Employer Branding</Link></li>
              <li><Link to="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing Plans</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-500 dark:text-gray-400">
                <MapPin size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Plot 12, Acacia Avenue, Kampala, Uganda</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <Phone size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span>+256 700 000 000</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <Mail size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span>support@jobconnect.ug</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-50 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            © {new Date().getFullYear()} JobConnect Uganda. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 text-sm">
            <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
