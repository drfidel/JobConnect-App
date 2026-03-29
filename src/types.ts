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
