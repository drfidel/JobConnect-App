import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { Message } from '../types';

export const messageService = {
  async sendMessage(applicationId: string, senderId: string, receiverId: string, content: string) {
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        applicationId,
        senderId,
        receiverId,
        content,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  subscribeToApplicationMessages(applicationId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'messages'),
      where('applicationId', '==', applicationId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      callback(messages);
    });
  }
};
