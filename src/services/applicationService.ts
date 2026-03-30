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
import { Application } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { CONFIG } from '../config';
import { MOCK_APPLICATIONS } from '../mockData';

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

  updateApplicationStatus: async (appId: string, status: Application['status']) => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_APPLICATIONS.findIndex(a => a.id === appId);
      if (index !== -1) {
        MOCK_APPLICATIONS[index].status = status;
        MOCK_APPLICATIONS[index].updatedAt = Timestamp.now();
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, appId);
    try {
      return await updateDoc(docRef, { 
        status,
        updatedAt: serverTimestamp()
      });
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
