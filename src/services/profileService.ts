import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  getDocs,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { CONFIG } from '../config';
import { MOCK_PROFILES } from '../mockData';

const COLLECTION_NAME = 'users';

export const profileService = {
  getProfile: async (uid: string): Promise<UserProfile | null> => {
    if (CONFIG.USE_MOCK) {
      return MOCK_PROFILES.find(p => p.uid === uid) || null;
    }
    const docRef = doc(db, COLLECTION_NAME, uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${uid}`);
      return null;
    }
  },

  updateProfile: async (uid: string, profileData: Partial<UserProfile>) => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_PROFILES.findIndex(p => p.uid === uid);
      if (index !== -1) {
        MOCK_PROFILES[index] = { ...MOCK_PROFILES[index], ...profileData };
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, uid);
    try {
      return await updateDoc(docRef, profileData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${uid}`);
    }
  },

  subscribeToProfile: (uid: string, callback: (profile: UserProfile | null) => void) => {
    if (CONFIG.USE_MOCK) {
      const profile = MOCK_PROFILES.find(p => p.uid === uid) || null;
      setTimeout(() => callback(profile), 500);
      return () => {};
    }
    const docRef = doc(db, COLLECTION_NAME, uid);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ uid: snapshot.id, ...snapshot.data() } as UserProfile);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${uid}`);
    });
  },

  subscribeToAllProfiles: (callback: (profiles: UserProfile[]) => void) => {
    if (CONFIG.USE_MOCK) {
      setTimeout(() => callback([...MOCK_PROFILES]), 500);
      return () => {};
    }
    const usersRef = collection(db, COLLECTION_NAME);
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  deleteProfile: async (uid: string): Promise<void> => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_PROFILES.findIndex(p => p.uid === uid);
      if (index !== -1) {
        MOCK_PROFILES.splice(index, 1);
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, uid);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${uid}`);
    }
  },

  addSavedJob: async (uid: string, jobId: string): Promise<void> => {
    if (CONFIG.USE_MOCK) {
      const profile = MOCK_PROFILES.find(p => p.uid === uid);
      if (profile) {
        if (!profile.savedJobs) profile.savedJobs = [];
        if (!profile.savedJobs.includes(jobId)) {
          profile.savedJobs.push(jobId);
        }
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, uid);
    try {
      await updateDoc(docRef, {
        savedJobs: arrayUnion(jobId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${uid}`);
    }
  },

  removeSavedJob: async (uid: string, jobId: string): Promise<void> => {
    if (CONFIG.USE_MOCK) {
      const profile = MOCK_PROFILES.find(p => p.uid === uid);
      if (profile && profile.savedJobs) {
        profile.savedJobs = profile.savedJobs.filter(id => id !== jobId);
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, uid);
    try {
      await updateDoc(docRef, {
        savedJobs: arrayRemove(jobId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${uid}`);
    }
  },

  uploadFile: async (uid: string, file: File, folder: string): Promise<string> => {
    if (CONFIG.USE_MOCK) {
      return `https://mock-storage.example.com/${folder}/${uid}/${file.name}`;
    }
    const storageRef = ref(storage, `${folder}/${uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  },

  searchSkills: async (searchTerm: string): Promise<string[]> => {
    if (CONFIG.USE_MOCK) {
      const skillsSet = new Set<string>();
      MOCK_PROFILES.forEach(profile => {
        profile.skills?.forEach(skill => {
          if (skill.toLowerCase().includes(searchTerm.toLowerCase())) {
            skillsSet.add(skill);
          }
        });
      });
      return Array.from(skillsSet);
    }
    const usersRef = collection(db, COLLECTION_NAME);
    const q = query(usersRef, where('skills', 'array-contains-any', [searchTerm]));
    try {
      const querySnapshot = await getDocs(q);
      const skillsSet = new Set<string>();
      querySnapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        data.skills?.forEach(skill => {
          if (skill.toLowerCase().includes(searchTerm.toLowerCase())) {
            skillsSet.add(skill);
          }
        });
      });
      return Array.from(skillsSet);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  }
};
