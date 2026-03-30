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
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Review } from '../types';

const REVIEWS_COLLECTION = 'reviews';

export const reviewService = {
  async createReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'status'>) {
    try {
      const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
        ...reviewData,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  async updateReview(reviewId: string, updates: Partial<Review>) {
    try {
      const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  async deleteReview(reviewId: string) {
    try {
      await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  subscribeToCompanyReviews(companyId: string, callback: (reviews: Review[]) => void) {
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
      console.error('Error fetching reviews:', error);
    });
  },

  async getPendingReviews() {
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
      console.error('Error getting pending reviews:', error);
      throw error;
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
      console.error('Error fetching all reviews:', error);
    });
  }
};
