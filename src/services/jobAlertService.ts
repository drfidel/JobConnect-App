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
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { JobAlert } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { CONFIG } from '../config';
import { MOCK_ALERTS } from '../mockData';

const COLLECTION_NAME = 'jobAlerts';

export const jobAlertService = {
  subscribeToUserAlerts: (userId: string, callback: (alerts: JobAlert[]) => void) => {
    if (CONFIG.USE_MOCK) {
      const alerts = MOCK_ALERTS.filter(a => a.userId === userId);
      setTimeout(() => callback(alerts), 500);
      return () => {};
    }
    const alertsRef = collection(db, COLLECTION_NAME);
    const q = query(alertsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobAlert)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  createAlert: async (alertData: Partial<JobAlert>) => {
    if (CONFIG.USE_MOCK) {
      const newAlert = {
        id: `mock_alert_${Date.now()}`,
        ...alertData,
        enabled: true,
        createdAt: Timestamp.now(),
      } as JobAlert;
      MOCK_ALERTS.push(newAlert);
      return { id: newAlert.id };
    }
    const alertsRef = collection(db, COLLECTION_NAME);
    try {
      return await addDoc(alertsRef, {
        ...alertData,
        enabled: true,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  },

  updateAlert: async (alertId: string, alertData: Partial<JobAlert>) => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_ALERTS.findIndex(a => a.id === alertId);
      if (index !== -1) {
        MOCK_ALERTS[index] = { ...MOCK_ALERTS[index], ...alertData };
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, alertId);
    try {
      return await updateDoc(docRef, alertData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${alertId}`);
    }
  },

  deleteAlert: async (alertId: string) => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_ALERTS.findIndex(a => a.id === alertId);
      if (index !== -1) {
        MOCK_ALERTS.splice(index, 1);
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, alertId);
    try {
      return await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${alertId}`);
    }
  },

  toggleAlert: async (alertId: string, enabled: boolean) => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_ALERTS.findIndex(a => a.id === alertId);
      if (index !== -1) {
        MOCK_ALERTS[index].enabled = enabled;
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, alertId);
    try {
      return await updateDoc(docRef, { enabled });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${alertId}`);
    }
  }
};
