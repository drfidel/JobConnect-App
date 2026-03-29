import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { CONFIG } from '../config';
import { MOCK_PROFILES } from '../mockData';

let mockAuthListeners: ((user: User | null) => void)[] = [];

export const authService = {
  onAuthStateChange: (callback: (user: User | null) => void) => {
    if (CONFIG.USE_MOCK) {
      mockAuthListeners.push(callback);
      const storedUid = localStorage.getItem('mock_uid') || 'seeker1';
      const profile = MOCK_PROFILES.find(p => p.uid === storedUid);
      
      const mockUser = {
        uid: profile?.uid || 'seeker1',
        email: profile?.email || 'seeker@example.com',
        displayName: profile?.displayName || 'John Seeker',
        photoURL: `https://picsum.photos/seed/${profile?.uid}/200/200`,
        emailVerified: true,
        isAnonymous: false,
        providerData: [],
        metadata: {},
        phoneNumber: null,
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({})
      } as unknown as User;
      
      setTimeout(() => callback(mockUser), 500);
      return () => {
        mockAuthListeners = mockAuthListeners.filter(l => l !== callback);
      };
    }
    return onAuthStateChanged(auth, callback);
  },

  signInWithEmail: async (email: string, password: string) => {
    if (CONFIG.USE_MOCK) {
      const profile = MOCK_PROFILES.find(p => p.email === email);
      if (profile) {
        localStorage.setItem('mock_uid', profile.uid);
        
        const mockUser = {
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          photoURL: `https://picsum.photos/seed/${profile.uid}/200/200`,
          emailVerified: true,
        } as unknown as User;
        
        mockAuthListeners.forEach(l => l(mockUser));
        return mockUser;
      }
      throw new Error('User not found in mock data');
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  registerWithEmail: async (email: string, password: string, displayName: string, role: UserRole) => {
    if (CONFIG.USE_MOCK) {
      const newUser = { uid: `mock_${Date.now()}`, email } as User;
      return newUser;
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName,
      role,
      createdAt: serverTimestamp(),
      bio: '',
      skills: [],
      experience: [],
      education: []
    };
    
    await setDoc(doc(db, 'users', user.uid), profile);
    return user;
  },

  signInWithGoogle: async () => {
    if (CONFIG.USE_MOCK) {
      return { uid: 'seeker1', email: 'seeker@example.com', displayName: 'John Seeker' } as User;
    }
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  },

  logout: async () => {
    if (CONFIG.USE_MOCK) {
      localStorage.removeItem('mock_uid');
      mockAuthListeners.forEach(l => l(null));
      return;
    }
    await signOut(auth);
  },

  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    if (CONFIG.USE_MOCK) {
      return MOCK_PROFILES.find(p => p.uid === uid) || null;
    }
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  createUserProfile: async (user: User, role: UserRole): Promise<UserProfile> => {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role,
      createdAt: serverTimestamp(),
    };
    if (CONFIG.USE_MOCK) {
      MOCK_PROFILES.push(profile);
      return profile;
    }
    await setDoc(doc(db, 'users', user.uid), profile);
    return profile;
  }
};
