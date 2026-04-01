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
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Application, Job, UserProfile, Company } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { CONFIG } from '../config';
import { MOCK_APPLICATIONS, MOCK_JOBS, MOCK_PROFILES, MOCK_COMPANIES } from '../mockData';
import { emailService } from './emailService';

const COLLECTION_NAME = 'applications';

export const applicationService = {
  subscribeToEmployerApplications: (employerId: string, callback: (apps: Application[]) => void) => {
    if (CONFIG.USE_MOCK) {
      const apps = MOCK_APPLICATIONS.filter(a => a.employerId === employerId);
      setTimeout(() => callback(apps), 500);
      return () => {};
    }
    const appsRef = collection(db, COLLECTION_NAME);
    const q = query(appsRef, where('employerId', '==', employerId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  subscribeToSeekerApplications: (seekerId: string, callback: (apps: Application[]) => void) => {
    if (CONFIG.USE_MOCK) {
      const apps = MOCK_APPLICATIONS.filter(a => a.seekerId === seekerId);
      setTimeout(() => callback(apps), 500);
      return () => {};
    }
    const appsRef = collection(db, COLLECTION_NAME);
    const q = query(appsRef, where('seekerId', '==', seekerId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  subscribeToAllApplications: (callback: (apps: Application[]) => void) => {
    if (CONFIG.USE_MOCK) {
      setTimeout(() => callback(MOCK_APPLICATIONS), 500);
      return () => {};
    }
    const appsRef = collection(db, COLLECTION_NAME);
    const q = query(appsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  hasUserApplied: async (seekerId: string, jobId: string): Promise<boolean> => {
    if (CONFIG.USE_MOCK) {
      return MOCK_APPLICATIONS.some(a => a.seekerId === seekerId && a.jobId === jobId);
    }
    const appsRef = collection(db, COLLECTION_NAME);
    const q = query(appsRef, where('seekerId', '==', seekerId), where('jobId', '==', jobId));
    try {
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return false;
    }
  },

  createApplication: async (appData: Partial<Application>) => {
    if (CONFIG.USE_MOCK) {
      const newApp = {
        id: `mock_app_${Date.now()}`,
        ...appData,
        status: 'applied',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      } as Application;
      MOCK_APPLICATIONS.push(newApp);
      return { id: newApp.id };
    }
    const appsRef = collection(db, COLLECTION_NAME);
    try {
      return await addDoc(appsRef, {
        ...appData,
        status: 'applied',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  },

  getApplicationById: async (appId: string): Promise<Application | null> => {
    if (CONFIG.USE_MOCK) {
      return MOCK_APPLICATIONS.find(a => a.id === appId) || null;
    }
    const docRef = doc(db, COLLECTION_NAME, appId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Application;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${appId}`);
      return null;
    }
  },

  updateApplicationStatus: async (appId: string, status: Application['status']) => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_APPLICATIONS.findIndex(a => a.id === appId);
      if (index !== -1) {
        const app = MOCK_APPLICATIONS[index];
        app.status = status;
        app.updatedAt = Timestamp.now();

        // Send mock email notification
        const job = MOCK_JOBS.find(j => j.id === app.jobId);
        const seeker = MOCK_PROFILES.find(p => p.uid === app.seekerId);
        const company = MOCK_COMPANIES.find(c => c.id === job?.companyId);

        if (seeker && job && company) {
          emailService.sendApplicationStatusUpdate(
            seeker.email,
            seeker.displayName || 'Applicant',
            job.title,
            company.name,
            status
          );
        }
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, appId);
    try {
      await updateDoc(docRef, { 
        status,
        updatedAt: serverTimestamp()
      });

      // Fetch details for email notification
      const appSnap = await getDoc(docRef);
      if (appSnap.exists()) {
        const app = { id: appSnap.id, ...appSnap.data() } as Application;
        
        // Get Job
        const jobSnap = await getDoc(doc(db, 'jobs', app.jobId));
        if (jobSnap.exists()) {
          const job = { id: jobSnap.id, ...jobSnap.data() } as Job;
          
          // Get Seeker Profile
          const seekerSnap = await getDoc(doc(db, 'users', app.seekerId));
          if (seekerSnap.exists()) {
            const seeker = { uid: seekerSnap.id, ...seekerSnap.data() } as UserProfile;
            
            // Get Company
            const companySnap = await getDoc(doc(db, 'companies', job.companyId));
            if (companySnap.exists()) {
              const company = { id: companySnap.id, ...companySnap.data() } as Company;
              
              // Send Email
              await emailService.sendApplicationStatusUpdate(
                seeker.email,
                seeker.displayName || 'Applicant',
                job.title,
                company.name,
                status
              );
            }
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${appId}`);
    }
  },

  deleteApplication: async (appId: string) => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_APPLICATIONS.findIndex(a => a.id === appId);
      if (index !== -1) {
        MOCK_APPLICATIONS.splice(index, 1);
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, appId);
    try {
      return await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${appId}`);
    }
  }
};
