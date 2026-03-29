import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Company } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { CONFIG } from '../config';
import { MOCK_COMPANIES } from '../mockData';

const COLLECTION_NAME = 'companies';

export const companyService = {
  getCompanyByOwner: async (ownerId: string): Promise<Company | null> => {
    if (CONFIG.USE_MOCK) {
      return MOCK_COMPANIES.find(c => c.ownerId === ownerId) || null;
    }
    const companiesRef = collection(db, COLLECTION_NAME);
    const q = query(companiesRef, where('ownerId', '==', ownerId));
    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Company;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return null;
    }
  },

  subscribeToCompanyByOwner: (ownerId: string, callback: (company: Company | null) => void) => {
    if (CONFIG.USE_MOCK) {
      const company = MOCK_COMPANIES.find(c => c.ownerId === ownerId) || null;
      setTimeout(() => callback(company), 500);
      return () => {};
    }
    const companiesRef = collection(db, COLLECTION_NAME);
    const q = query(companiesRef, where('ownerId', '==', ownerId));
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Company);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  getCompanyById: async (companyId: string): Promise<Company | null> => {
    if (CONFIG.USE_MOCK) {
      return MOCK_COMPANIES.find(c => c.id === companyId) || null;
    }
    const docRef = doc(db, COLLECTION_NAME, companyId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Company;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${companyId}`);
      return null;
    }
  },

  createCompany: async (companyData: Partial<Company>) => {
    if (CONFIG.USE_MOCK) {
      const newCompany = {
        id: `mock_comp_${Date.now()}`,
        ...companyData,
        createdAt: Timestamp.now(),
      } as Company;
      MOCK_COMPANIES.push(newCompany);
      return { id: newCompany.id };
    }
    const companiesRef = collection(db, COLLECTION_NAME);
    try {
      return await addDoc(companiesRef, {
        ...companyData,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  },

  updateCompany: async (companyId: string, companyData: Partial<Company>) => {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_COMPANIES.findIndex(c => c.id === companyId);
      if (index !== -1) {
        MOCK_COMPANIES[index] = { ...MOCK_COMPANIES[index], ...companyData };
      }
      return;
    }
    const docRef = doc(db, COLLECTION_NAME, companyId);
    try {
      return await updateDoc(docRef, companyData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${companyId}`);
    }
  },

  subscribeToAllCompanies: (callback: (companies: Company[]) => void) => {
    if (CONFIG.USE_MOCK) {
      setTimeout(() => callback([...MOCK_COMPANIES]), 500);
      return () => {};
    }
    const companiesRef = collection(db, COLLECTION_NAME);
    return onSnapshot(companiesRef, (snapshot) => {
      const companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      callback(companies);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  }
};
