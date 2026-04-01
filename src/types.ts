export type UserRole = 'employer' | 'seeker' | 'admin';

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  requirements?: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  resumeURL?: string;
  companyId?: string;
  bio?: string;
  skills?: string[];
  experience?: Experience[];
  education?: Education[];
  savedJobs?: string[];
  createdAt: any;
}

export interface Job {
  id: string;
  employerId: string;
  companyId: string;
  title: string;
  description: string;
  salaryRange?: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'internship' | 'contract';
  category?: string;
  requirements?: string[];
  featured?: boolean;
  deadline?: any;
  status: 'pending' | 'active' | 'closed' | 'rejected';
  viewCount?: number;
  createdAt: any;
}

export interface Application {
  id: string;
  jobId: string;
  seekerId: string;
  employerId: string;
  status: 'applied' | 'reviewed' | 'accepted' | 'rejected';
  resumeURL?: string;
  coverLetter?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Company {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  logoURL?: string;
  website?: string;
  location: string;
  createdAt: any;
}

export interface JobAlert {
  id: string;
  userId: string;
  keywords: string;
  location: string;
  jobType: string;
  enabled: boolean;
  createdAt: any;
}

export interface Message {
  id: string;
  applicationId?: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'status_change' | 'new_application' | 'info';
  read: boolean;
  link?: string;
  createdAt: any;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  imageUrl: string; // Keep for backward compatibility with mock data
  readTime: string;
  status: 'draft' | 'published';
  createdAt?: any;
  updatedAt?: any;
}

export interface Review {
  id: string;
  companyId: string;
  companyName: string; // Denormalized for easier display
  seekerId: string;
  authorName?: string; // Optional for anonymous reviews, renamed from seekerName
  rating: number; // Overall rating
  workLifeBalance: number;
  management: number;
  culture: number;
  comment: string;
  isAnonymous: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  flagReason?: string;
  createdAt: any;
  updatedAt?: any;
}
