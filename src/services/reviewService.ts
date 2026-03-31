import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDocs,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Review } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { CONFIG } from '../config';
import { MOCK_REVIEWS } from '../mockData';

const REVIEWS_COLLECTION = 'reviews';

export const reviewService = {
  async createReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'status'>) {
    if (CONFIG.USE_MOCK) {
      const newReview = {
        id: `mock_review_${Date.now()}`,
        ...reviewData,
        status: 'pending',
        createdAt: Timestamp.now(),
      } as Review;
      MOCK_REVIEWS.push(newReview);
      return newReview.id;
    }
    try {
      const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
        ...reviewData,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, REVIEWS_COLLECTION);
    }
  },

  async updateReview(reviewId: string, updates: Partial<Review>) {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_REVIEWS.findIndex(r => r.id === reviewId);
      if (index !== -1) {
        MOCK_REVIEWS[index] = { ...MOCK_REVIEWS[index], ...updates };
      }
      return;
    }
    try {
      const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${REVIEWS_COLLECTION}/${reviewId}`);
    }
  },

  async deleteReview(reviewId: string) {
    if (CONFIG.USE_MOCK) {
      const index = MOCK_REVIEWS.findIndex(r => r.id === reviewId);
      if (index !== -1) {
        MOCK_REVIEWS.splice(index, 1);
      }
      return;
    }
    try {
      await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${REVIEWS_COLLECTION}/${reviewId}`);
    }
  },

  subscribeToCompanyReviews(companyId: string, callback: (reviews: Review[]) => void) {
    if (CONFIG.USE_MOCK) {
      const reviews = MOCK_REVIEWS.filter(r => r.companyId === companyId && r.status === 'approved');
      setTimeout(() => callback(reviews), 500);
      return () => {};
    }
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('companyId', '==', companyId),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      callback(reviews);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, REVIEWS_COLLECTION);
    });
  },

  async getPendingReviews() {
    if (CONFIG.USE_MOCK) {
      return MOCK_REVIEWS.filter(r => r.status === 'pending');
    }
    try {
      const q = query(
        collection(db, REVIEWS_COLLECTION),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, REVIEWS_COLLECTION);
    }
  },

  async flagReview(reviewId: string, reason: string) {
    return this.updateReview(reviewId, {
      status: 'flagged',
      flagReason: reason
    });
  },

  async approveReview(reviewId: string) {
    return this.updateReview(reviewId, {
      status: 'approved'
    });
  },

  async rejectReview(reviewId: string) {
    return this.updateReview(reviewId, {
      status: 'rejected'
    });
  },

  subscribeToAllReviews(callback: (reviews: Review[]) => void) {
    if (CONFIG.USE_MOCK) {
      setTimeout(() => callback([...MOCK_REVIEWS]), 500);
      return () => {};
    }
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      callback(reviews);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, REVIEWS_COLLECTION);
    });
  }
};
