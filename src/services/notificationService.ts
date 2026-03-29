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
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Notification } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { CONFIG } from '../config';
import { MOCK_NOTIFICATIONS } from '../mockData';

const COLLECTION_NAME = 'notifications';

export const notificationService = {
  subscribeToUserNotifications: (userId: string, callback: (notifications: Notification[]) => void) => {
    if (CONFIG.USE_MOCK) {
      const notifs = MOCK_NOTIFICATIONS.filter(n => n.userId === userId);
      setTimeout(() => callback(notifs), 500);
      return () => {};
    }
    const notificationsRef = collection(db, COLLECTION_NAME);
    const q = query(notificationsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  createNotification: async (notificationData: Partial<Notification>) => {
    if (CONFIG.USE_MOCK) {
      const newNotif = {
        id: `mock_notif_${Date.now()}`,
        ...notificationData,
        read: false,
        createdAt: Timestamp.now(),
      } as Notification;
      MOCK_NOTIFICATIONS.push(newNotif);
      return { id: newNotif.id };
    }
    const notificationsRef = collection(db, COLLECTION_NAME);
    try {
      return await addDoc(notificationsRef, {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  },

  markAsRead: async (notificationId: string) => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_NOTIFICATIONS.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        MOCK_NOTIFICATIONS[index].read = true;
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, notificationId);
    try {
      return await updateDoc(docRef, { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${notificationId}`);
    }
  },

  deleteNotification: async (notificationId: string) => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_NOTIFICATIONS.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        MOCK_NOTIFICATIONS.splice(index, 1);
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, notificationId);
    try {
      return await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${notificationId}`);
    }
  },

  markAllAsRead: async (userId: string) => {
    if (CONFIG.USE_MOCK) {
      MOCK_NOTIFICATIONS.forEach(n => {
        if (n.userId === userId) n.read = true;
      });
      return;
    }
    const notificationsRef = collection(db, COLLECTION_NAME);
    const q = query(notificationsRef, where('userId', '==', userId), where('read', '==', false));
    try {
      const querySnapshot = await getDocs(q);
      const promises = querySnapshot.docs.map(doc => updateDoc(doc.ref, { read: true }));
      await Promise.all(promises);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
    }
  }
};
