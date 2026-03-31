import React from 'react';
import { Check, Star, Zap, Shield, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for small businesses starting their hiring journey.',
    features: [
      '1 active job post',
      '30 days visibility',
      'Standard applicant tracking',
      'Basic support',
    ],
    cta: 'Start for Free',
    popular: false,
    icon: <Zap className="text-blue-500" size={24} />,
  },
  {
    name: 'Standard',
    price: '150,000',
    description: 'Ideal for growing teams with multiple open positions.',
    features: [
      '5 active job posts',
      '60 days visibility',
      'Priority applicant tracking',
      'Featured job badge',
      'Priority email support',
    ],
    cta: 'Choose Standard',
    popular: true,
    icon: <Star className="text-yellow-500" size={24} />,
  },
  {
    name: 'Premium',
    price: '450,000',
    description: 'For large organizations with high-volume hiring needs.',
    features: [
      'Unlimited job posts',
      '90 days visibility',
      'Advanced analytics',
      'Featured job badge',
      'Social media promotion',
      '24/7 dedicated support',
    ],
    cta: 'Go Premium',
    popular: false,
    icon: <Shield className="text-purple-500" size={24} />,
  },
];

export default function Pricing() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl"
          >
            Simple, Transparent <span className="text-blue-600">Pricing</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 max-w-xl mx-auto text-xl text-gray-500 dark:text-zinc-400"
          >
            Choose the plan that's right for your business and start hiring the best talent in Uganda today.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex flex-col rounded-3xl border ${
                plan.popular 
                  ? 'border-blue-600 shadow-2xl scale-105 z-10 bg-white dark:bg-gray-900' 
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 shadow-lg'
              } p-8 transition-all duration-300 hover:shadow-xl`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="inline-flex rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold tracking-wide text-white uppercase shadow-md">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                  {plan.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h2>
              </div>

              <p className="text-gray-500 dark:text-zinc-400 mb-6 min-h-[3rem]">
                {plan.description}
              </p>

              <div className="mb-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-base font-medium text-gray-500 dark:text-zinc-400"> UGX</span>
                <span className="text-sm text-gray-500 dark:text-zinc-400 block mt-1">per month</span>
              </div>

              <ul className="flex-grow space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-700 dark:text-zinc-300">
                      {feature}
                    </p>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.name === 'Free' ? '/register' : '/contact'}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-center transition-all duration-200 ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <HelpCircle size={18} className="text-blue-500" />
                Can I change plans later?
              </h4>
              <p className="text-gray-600 dark:text-zinc-400">
                Yes, you can upgrade or downgrade your plan at any time from your dashboard settings.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <HelpCircle size={18} className="text-blue-500" />
                What payment methods do you accept?
              </h4>
              <p className="text-gray-600 dark:text-zinc-400">
                We accept Mobile Money (MTN & Airtel), credit cards, and bank transfers for annual plans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
