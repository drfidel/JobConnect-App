import { Job, Company, Application, UserProfile, Notification, JobAlert, Review } from './types';
import { Timestamp } from 'firebase/firestore';

const now = Timestamp.now();

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'comp1',
    name: 'TechFlow Uganda',
    location: 'Kampala',
    website: 'https://techflow.ug',
    description: 'Leading software development house in East Africa.',
    logoURL: 'https://picsum.photos/seed/techflow/200/200',
    ownerId: 'employer1',
    createdAt: now
  },
  {
    id: 'comp2',
    name: 'Green Energy Solutions',
    location: 'Entebbe',
    website: 'https://greenenergy.ug',
    description: 'Renewable energy provider for residential and commercial sectors.',
    logoURL: 'https://picsum.photos/seed/green/200/200',
    ownerId: 'employer2',
    createdAt: now
  },
  {
    id: 'comp3',
    name: 'Global Logistics Ltd',
    location: 'Kampala',
    website: 'https://globallogistics.ug',
    description: 'Specializing in international shipping and supply chain management.',
    logoURL: 'https://picsum.photos/seed/logistics/200/200',
    ownerId: 'employer3',
    createdAt: now
  }
];

export const MOCK_JOBS: Job[] = [
  {
    id: 'job1',
    title: 'Senior Frontend Developer',
    description: 'We are looking for an experienced React developer to join our team.',
    location: 'Kampala',
    salaryRange: '3M - 5M UGX',
    jobType: 'full-time',
    category: 'Software Development',
    companyId: 'comp1',
    employerId: 'employer1',
    status: 'active',
    featured: true,
    viewCount: 150,
    createdAt: now,
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'UI/UX design skills']
  },
  {
    id: 'job2',
    title: 'Marketing Specialist',
    description: 'Join our marketing team to drive growth and brand awareness.',
    location: 'Remote',
    salaryRange: '1.5M - 2.5M UGX',
    jobType: 'part-time',
    category: 'Marketing',
    companyId: 'comp2',
    employerId: 'employer2',
    status: 'active',
    featured: false,
    viewCount: 45,
    createdAt: now,
    requirements: ['Social media management', 'Content creation', 'SEO knowledge']
  },
  {
    id: 'job3',
    title: 'Operations Manager',
    description: 'We are seeking a highly organized individual to oversee our logistics operations.',
    location: 'Kampala',
    salaryRange: '4M - 6M UGX',
    jobType: 'full-time',
    category: 'Operations',
    companyId: 'comp3',
    employerId: 'employer3',
    status: 'active',
    featured: true,
    viewCount: 25,
    createdAt: now,
    requirements: ['5+ years in logistics', 'Strong leadership skills', 'Degree in Business Administration']
  }
];

export const MOCK_PROFILES: UserProfile[] = [
  {
    uid: 'seeker1',
    email: 'seeker@example.com',
    displayName: 'John Seeker',
    role: 'seeker',
    bio: 'Passionate developer looking for new challenges.',
    skills: ['React', 'TypeScript', 'Node.js'],
    experience: [
      {
        id: 'exp1',
        company: 'Old Tech',
        position: 'Junior Dev',
        location: 'Kampala',
        startDate: '2020-01-01',
        endDate: '2022-01-01',
        current: false,
        description: 'Worked on legacy systems.'
      }
    ],
    education: [
      {
        id: 'edu1',
        school: 'Makerere University',
        degree: 'BSc Computer Science',
        fieldOfStudy: 'Computing',
        startDate: '2016-09-01',
        endDate: '2020-06-01',
        description: 'Graduated with honors.'
      }
    ],
    savedJobs: ['job1'],
    createdAt: now
  },
  {
    uid: 'employer1',
    email: 'employer@example.com',
    displayName: 'Jane Employer',
    role: 'employer',
    createdAt: now
  },
  {
    uid: 'employer2',
    email: 'employer2@example.com',
    displayName: 'Robert Green',
    role: 'employer',
    createdAt: now
  },
  {
    uid: 'employer3',
    email: 'employer3@example.com',
    displayName: 'David Boss',
    role: 'employer',
    createdAt: now
  },
  {
    uid: 'seeker2',
    email: 'seeker2@example.com',
    displayName: 'Sarah Dev',
    role: 'seeker',
    bio: 'Senior Backend Engineer with 8 years of experience in distributed systems and cloud architecture. Expert in Node.js, Go, and Kubernetes.',
    skills: ['Node.js', 'Go', 'Kubernetes', 'PostgreSQL', 'Docker', 'AWS'],
    experience: [
      {
        id: 'exp2',
        company: 'CloudScale Solutions',
        position: 'Senior Engineer',
        location: 'Remote',
        startDate: '2020-03-01',
        endDate: '',
        current: true,
        description: 'Leading the migration of monolithic services to microservices architecture.'
      },
      {
        id: 'exp3',
        company: 'DataFlow Inc',
        position: 'Software Engineer',
        location: 'Kampala',
        startDate: '2017-06-01',
        endDate: '2020-02-01',
        current: false,
        description: 'Developed real-time data processing pipelines.'
      }
    ],
    education: [
      {
        id: 'edu2',
        school: 'Stanford University',
        degree: 'MS Computer Science',
        fieldOfStudy: 'Systems',
        startDate: '2015-09-01',
        endDate: '2017-05-01',
        description: 'Specialized in distributed systems.'
      }
    ],
    createdAt: now
  },
  {
    uid: 'seeker3',
    email: 'employee@example.com',
    displayName: 'Michael Employee',
    role: 'seeker',
    bio: 'Experienced software engineer with a focus on cloud-native applications.',
    skills: ['React', 'Node.js', 'AWS', 'Docker'],
    experience: [
      {
        id: 'exp4',
        company: 'Innovatech',
        position: 'Software Engineer',
        location: 'Kampala',
        startDate: '2022-02-01',
        endDate: '',
        current: true,
        description: 'Building scalable web applications.'
      }
    ],
    education: [
      {
        id: 'edu3',
        school: 'Makerere University',
        degree: 'BSc Software Engineering',
        fieldOfStudy: 'Engineering',
        startDate: '2018-09-01',
        endDate: '2022-06-01',
        description: 'Focus on distributed systems.'
      }
    ],
    createdAt: now
  },
  {
    uid: 'admin1',
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: 'admin',
    createdAt: now
  }
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app1',
    jobId: 'job1',
    seekerId: 'seeker1',
    employerId: 'employer1',
    status: 'applied',
    coverLetter: 'I am very interested in this role.',
    resumeURL: '',
    createdAt: now
  },
  {
    id: 'app2',
    jobId: 'job1',
    seekerId: 'seeker2',
    employerId: 'employer1',
    status: 'applied',
    coverLetter: 'I have extensive experience with React and backend systems. I believe I would be a great fit for your team.',
    resumeURL: '',
    createdAt: now
  },
  {
    id: 'app3',
    jobId: 'job2',
    seekerId: 'seeker3',
    employerId: 'employer2',
    status: 'applied',
    coverLetter: 'I have the marketing and technical skills you are looking for.',
    resumeURL: '',
    createdAt: now
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif1',
    userId: 'employer1',
    title: 'New Application',
    message: 'John Seeker applied for Senior Frontend Developer',
    type: 'new_application',
    read: false,
    createdAt: now,
    link: '/employer-dashboard'
  }
];

export const MOCK_ALERTS: JobAlert[] = [
  {
    id: 'alert1',
    userId: 'seeker1',
    keywords: 'React',
    location: 'Kampala',
    jobType: 'full-time',
    enabled: true,
    createdAt: now
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev1',
    companyId: 'comp1',
    companyName: 'TechFlow Uganda',
    seekerId: 'seeker1',
    authorName: 'John Seeker',
    rating: 4,
    workLifeBalance: 4,
    management: 3,
    culture: 5,
    comment: 'Great place to work, very innovative!',
    isAnonymous: false,
    status: 'approved',
    createdAt: now
  },
  {
    id: 'rev2',
    companyId: 'comp1',
    companyName: 'TechFlow Uganda',
    seekerId: 'seeker2',
    authorName: 'Sarah Dev',
    rating: 5,
    workLifeBalance: 5,
    management: 5,
    culture: 5,
    comment: 'The best tech company in Uganda.',
    isAnonymous: false,
    status: 'approved',
    createdAt: now
  },
  {
    id: 'rev3',
    companyId: 'comp2',
    companyName: 'Green Energy Solutions',
    seekerId: 'seeker3',
    authorName: 'Michael Employee',
    rating: 3,
    workLifeBalance: 2,
    management: 3,
    culture: 4,
    comment: 'Good mission, but work-life balance is tough.',
    isAnonymous: true,
    status: 'pending',
    createdAt: now
  }
];
