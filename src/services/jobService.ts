import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDoc,
  orderBy,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Job } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { CONFIG } from '../config';
import { MOCK_JOBS } from '../mockData';

const COLLECTION_NAME = 'jobs';

export const jobService = {
  subscribeToEmployerJobs: (employerId: string, callback: (jobs: Job[]) => void) => {
    if (CONFIG.USE_MOCK) {
      const jobs = MOCK_JOBS.filter(j => j.employerId === employerId);
      setTimeout(() => callback(jobs), 500);
      return () => {};
    }
    const jobsRef = collection(db, COLLECTION_NAME);
    const q = query(jobsRef, where('employerId', '==', employerId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  subscribeToAllJobs: (callback: (jobs: Job[]) => void) => {
    if (CONFIG.USE_MOCK) {
      setTimeout(() => callback(MOCK_JOBS), 500);
      return () => {};
    }
    const jobsRef = collection(db, COLLECTION_NAME);
    const q = query(jobsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  subscribeToCompanyJobs: (companyId: string, callback: (jobs: Job[]) => void) => {
    if (CONFIG.USE_MOCK) {
      const jobs = MOCK_JOBS.filter(j => j.companyId === companyId);
      setTimeout(() => callback(jobs), 500);
      return () => {};
    }
    const jobsRef = collection(db, COLLECTION_NAME);
    const q = query(jobsRef, where('companyId', '==', companyId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  subscribeToActiveJobs: (callback: (jobs: Job[]) => void, filters?: QueryConstraint[]) => {
    if (CONFIG.USE_MOCK) {
      const jobs = MOCK_JOBS.filter(j => j.status === 'active');
      setTimeout(() => callback(jobs), 500);
      return () => {};
    }
    const jobsRef = collection(db, COLLECTION_NAME);
    const constraints: QueryConstraint[] = [
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    ];
    if (filters) {
      constraints.push(...filters);
    }
    const q = query(jobsRef, ...constraints);
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  getJobById: async (jobId: string): Promise<Job | null> => {
    if (CONFIG.USE_MOCK) {
      return MOCK_JOBS.find(j => j.id === jobId) || null;
    }
    const docRef = doc(db, COLLECTION_NAME, jobId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Job;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${jobId}`);
      return null;
    }
  },

  createJob: async (jobData: Partial<Job>) => {
    if (CONFIG.USE_MOCK) {
      const newJob = {
        id: `mock_job_${Date.now()}`,
        ...jobData,
        status: 'active',
        viewCount: 0,
        createdAt: Timestamp.now(),
      } as Job;
      MOCK_JOBS.push(newJob);
      return { id: newJob.id };
    }
    const jobsRef = collection(db, COLLECTION_NAME);
    try {
      return await addDoc(jobsRef, {
        ...jobData,
        status: 'active',
        viewCount: 0,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  },

  updateJob: async (jobId: string, jobData: Partial<Job>) => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_JOBS.findIndex(j => j.id === jobId);
      if (index !== -1) {
        MOCK_JOBS[index] = { ...MOCK_JOBS[index], ...jobData };
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, jobId);
    try {
      return await updateDoc(docRef, jobData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${jobId}`);
    }
  },

  deleteJob: async (jobId: string) => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_JOBS.findIndex(j => j.id === jobId);
      if (index !== -1) {
        MOCK_JOBS.splice(index, 1);
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, jobId);
    try {
      return await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${jobId}`);
    }
  },

  incrementViewCount: async (jobId: string) => {
    if (CONFIG.USE_MOCK) {
      const job = MOCK_JOBS.find(j => j.id === jobId);
      if (job) {
        job.viewCount = (job.viewCount || 0) + 1;
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, jobId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentCount = docSnap.data().viewCount || 0;
        return await updateDoc(docRef, { viewCount: currentCount + 1 });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${jobId}`);
    }
  }
};
