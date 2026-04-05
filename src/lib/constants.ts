// ============================================================
// GenZ IITian Connect — Constants & Configuration
// ============================================================

import { Plan } from '@/types';

export const APP_NAME = 'GenZ IITian Connect';
export const APP_TAGLINE = 'Anonymous Study Connect for Verified IIT Madras BS Students';
export const APP_VERSION = '1.0.0';

// Plan configurations
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    currency: 'INR',
    period: 'forever',
    matchesPerDay: 20,
    videoEnabled: true,
    topicFilters: false,
    priorityMatching: false,
    features: [
      'Text + Video chat',
      '20 connects per day',
      'Random matching',
      'Basic reporting',
      'Community access',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    currency: 'INR',
    period: 'month',
    matchesPerDay: 50,
    videoEnabled: true,
    topicFilters: true,
    priorityMatching: false,
    highlighted: true,
    features: [
      'Everything in Starter',
      '50 connects per day',
      'Subject-wise courses',
      'Topic-based matching',
      '1:1 Mentorship sessions',
      'Study group access',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 299,
    currency: 'INR',
    period: 'month',
    matchesPerDay: -1, // unlimited
    videoEnabled: true,
    topicFilters: true,
    priorityMatching: true,
    features: [
      'Everything in Pro',
      'Unlimited connects',
      '1:1 Mentorship with toppers',
      'Subject-wise doubt sessions',
      'Priority matching',
      'AI study assistant',
      'Exam prep matching',
    ],
  },
];

// Community rules
export const COMMUNITY_RULES = [
  {
    icon: '🚫',
    title: 'No Nudity or Sexual Content',
    description: 'Any explicit content will result in immediate permanent ban.',
  },
  {
    icon: '🛡️',
    title: 'No Harassment or Bullying',
    description: 'Treat every student with respect and dignity.',
  },
  {
    icon: '🚷',
    title: 'No Hate Speech',
    description: 'Discrimination based on caste, religion, gender, etc. is strictly prohibited.',
  },
  {
    icon: '📵',
    title: 'No Recording or Screenshots',
    description: 'Recording conversations without consent is illegal under Indian law.',
  },
  {
    icon: '🤖',
    title: 'No Spam or Bot Activity',
    description: 'Automated messaging or spam will result in account suspension.',
  },
  {
    icon: '👤',
    title: 'No Impersonation',
    description: 'Do not pretend to be someone else or use fake credentials.',
  },
];

// Study topics for smart matching
export const STUDY_TOPICS = [
  'Mathematics',
  'Physics',
  'Programming (Python)',
  'Programming (C/C++)',
  'Programming (Java)',
  'Data Structures & Algorithms',
  'Machine Learning',
  'Statistics',
  'English Communication',
  'Business & Economics',
  'General Discussion',
];

export const COURSE_LEVELS = [
  'Foundation Level',
  'Diploma Level',
  'Degree Level',
  'All Levels',
];

export const DEGREE_TYPES = [
  'BS in Data Science',
  'BS in Electronic Systems',
  'Diploma in Programming',
  'Diploma in Data Science',
];

// Legal config
export const GRIEVANCE_OFFICER = {
  name: 'Grievance Officer — GenZ IITian Connect',
  email: 'grievance@genziitian.com',
  address: 'India',
  responseTime: '48 hours',
};

export const LEGAL_LINKS = {
  privacyPolicy: '/legal/privacy',
  terms: '/legal/terms',
  dataRetention: '/legal/data-retention',
  dataDeletion: '/legal/data-deletion',
  communityGuidelines: '/legal/guidelines',
};

// Rate limits
export const RATE_LIMITS = {
  free: { matchesPerDay: 5, messagesPerMinute: 20 },
  pro: { matchesPerDay: 50, messagesPerMinute: 60 },
  premium: { matchesPerDay: -1, messagesPerMinute: 120 },
};
