import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from './firebase';
import { User, ChatMessage } from '../types';
import { CURRENT_USER, INITIAL_USERS, TOKUDOME_INITIAL_MESSAGES, OTHER_USERS_SEEDS } from './sampleData';

const CHATS_COLLECTION = 'chats';
const USERS_COLLECTION = 'users';

/**
 * Remove any undefined values recursively before saving to Firestore,
 * as Firestore throws an error when any field is explicitly undefined.
 */
export function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Helper to construct a deterministic 1-on-1 chatId from two user IDs
export function getChatId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `chat_${sorted[0]}_${sorted[1]}`;
}

// Seed the database with initial users and messages if not already seeded
export async function seedInitialDataIfNeeded(): Promise<void> {
  try {
    const usersCol = collection(db, USERS_COLLECTION);
    const userSnapshot = await getDocs(usersCol);

    if (userSnapshot.empty) {
      console.log('Seeding initial users and chats into Firestore...');
      
      // Save current user and contacts
      const allUsers = [CURRENT_USER, ...INITIAL_USERS];
      for (const u of allUsers) {
        await setDoc(doc(db, USERS_COLLECTION, u.id), removeUndefinedFields(u));
      }

      // Seed Tokudome conversation
      const tokudomeChatId = getChatId(CURRENT_USER.id, 'tokudome');
      const chatDocRef = doc(db, CHATS_COLLECTION, tokudomeChatId);
      
      await setDoc(chatDocRef, removeUndefinedFields({
        id: tokudomeChatId,
        participantIds: [CURRENT_USER.id, 'tokudome'],
        lastMessageText: 'よろしく',
        lastMessageSenderId: 'tokudome',
        lastMessageTime: Date.now() - 3600000 * 0.1,
        unreadCount: 0,
        createdAt: Date.now()
      }));

      const messagesCol = collection(chatDocRef, 'messages');
      for (const msg of TOKUDOME_INITIAL_MESSAGES) {
        await setDoc(doc(messagesCol, msg.id), removeUndefinedFields({
          ...msg,
          chatId: tokudomeChatId
        }));
      }

      // Seed other contacts conversations
      for (const otherId of Object.keys(OTHER_USERS_SEEDS)) {
        const otherChatId = getChatId(CURRENT_USER.id, otherId);
        const otherChatDocRef = doc(db, CHATS_COLLECTION, otherChatId);
        const seedMsgs = OTHER_USERS_SEEDS[otherId];
        const lastMsg = seedMsgs[seedMsgs.length - 1];

        await setDoc(otherChatDocRef, removeUndefinedFields({
          id: otherChatId,
          participantIds: [CURRENT_USER.id, otherId],
          lastMessageText: lastMsg.text,
          lastMessageSenderId: lastMsg.senderId,
          lastMessageTime: lastMsg.timestamp,
          unreadCount: 0,
          createdAt: Date.now()
        }));

        const otherMessagesCol = collection(otherChatDocRef, 'messages');
        for (const msg of seedMsgs) {
          await setDoc(doc(otherMessagesCol, msg.id), removeUndefinedFields({
            ...msg,
            chatId: otherChatId
          }));
        }
      }
    }
  } catch (error) {
    console.warn('Firestore seeding notice (running client mode if offline):', error);
  }
}

// Subscribe to users collection in real-time
export function subscribeToUsers(
  callback: (users: User[]) => void
): () => void {
  try {
    const usersCol = collection(db, USERS_COLLECTION);

    const unsubscribe = onSnapshot(usersCol, async (snapshot) => {
      if (snapshot.empty) {
        // If Firestore is completely empty on first load, seed initial data
        console.log('No users found in Firestore, seeding default users...');
        await seedInitialDataIfNeeded();
        return;
      }

      const fetchedUsers: User[] = [];
      snapshot.forEach((docSnap) => {
        fetchedUsers.push({
          id: docSnap.id,
          ...docSnap.data()
        } as User);
      });

      // Sort by creation or maintain stable ordering
      callback(fetchedUsers);
    }, (err) => {
      console.warn('Users snapshot listener error:', err);
    });

    return unsubscribe;
  } catch (err) {
    console.error('Error creating users subscriber:', err);
    return () => {};
  }
}

// Subscribe to messages in a specific chat in real-time
export function subscribeToMessages(
  chatId: string, 
  callback: (messages: ChatMessage[]) => void
): () => void {
  try {
    const messagesCol = collection(db, CHATS_COLLECTION, chatId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push({
          id: docSnap.id,
          ...docSnap.data()
        } as ChatMessage);
      });
      callback(msgs);
    }, (err) => {
      console.warn('Snapshot listener error, fallback to initial state:', err);
    });

    return unsubscribe;
  } catch (err) {
    console.error('Error creating messages subscriber:', err);
    return () => {};
  }
}

// Send a new message
export async function sendChatMessage(
  chatId: string,
  messageData: Omit<ChatMessage, 'id' | 'chatId'>
): Promise<string> {
  try {
    const messagesCol = collection(db, CHATS_COLLECTION, chatId, 'messages');
    
    // Clean data to prevent undefined errors in Firestore
    const cleanedMessageData = removeUndefinedFields({
      ...messageData,
      chatId,
      timestamp: Date.now()
    });

    const docRef = await addDoc(messagesCol, cleanedMessageData);

    // Update conversation summary
    const chatDocRef = doc(db, CHATS_COLLECTION, chatId);
    const lastText = messageData.imageUrl 
      ? '写真を送信しました。' 
      : (messageData.fileName ? '添付ファイルを送信しました。' : (messageData.text || ''));

    await setDoc(chatDocRef, removeUndefinedFields({
      id: chatId,
      lastMessageText: lastText,
      lastMessageSenderId: messageData.senderId,
      lastMessageTime: Date.now(),
      unreadCount: 0
    }), { merge: true });

    return docRef.id;
  } catch (error) {
    console.error('Error sending message to Firestore:', error);
    throw error;
  }
}

// Toggle a reaction on a message
export async function toggleMessageReaction(
  chatId: string,
  messageId: string,
  emoji: string,
  userId: string,
  currentReactions: Record<string, string[]> = {}
): Promise<void> {
  try {
    const messageDocRef = doc(db, CHATS_COLLECTION, chatId, 'messages', messageId);
    const reactions = { ...currentReactions };
    const userList = reactions[emoji] ? [...reactions[emoji]] : [];
    const index = userList.indexOf(userId);

    if (index > -1) {
      userList.splice(index, 1);
      if (userList.length === 0) {
        delete reactions[emoji];
      } else {
        reactions[emoji] = userList;
      }
    } else {
      userList.push(userId);
      reactions[emoji] = userList;
    }

    await updateDoc(messageDocRef, { reactions });
  } catch (error) {
    console.error('Error toggling reaction:', error);
  }
}

// Delete a message
export async function deleteChatMessage(chatId: string, messageId: string): Promise<void> {
  try {
    const messageDocRef = doc(db, CHATS_COLLECTION, chatId, 'messages', messageId);
    await deleteDoc(messageDocRef);
  } catch (error) {
    console.error('Error deleting message:', error);
  }
}

// Clear all users and conversations
export async function clearAllUsersAndChats(): Promise<void> {
  try {
    const usersCol = collection(db, USERS_COLLECTION);
    const userSnapshot = await getDocs(usersCol);
    for (const docSnap of userSnapshot.docs) {
      await deleteDoc(doc(db, USERS_COLLECTION, docSnap.id));
    }

    const chatsCol = collection(db, CHATS_COLLECTION);
    const chatsSnapshot = await getDocs(chatsCol);
    for (const chatSnap of chatsSnapshot.docs) {
      const messagesCol = collection(db, CHATS_COLLECTION, chatSnap.id, 'messages');
      const messagesSnap = await getDocs(messagesCol);
      for (const msgSnap of messagesSnap.docs) {
        await deleteDoc(doc(messagesCol, msgSnap.id));
      }
      await deleteDoc(doc(db, CHATS_COLLECTION, chatSnap.id));
    }
  } catch (error) {
    console.error('Error clearing users and chats:', error);
  }
}

// Add a new user to Firestore
export async function createFirestoreUser(user: User): Promise<void> {
  try {
    await setDoc(doc(db, USERS_COLLECTION, user.id), removeUndefinedFields(user));
  } catch (error) {
    console.error('Error creating user in Firestore:', error);
  }
}

// Update a user in Firestore
export async function updateFirestoreUser(user: User): Promise<void> {
  try {
    await setDoc(doc(db, USERS_COLLECTION, user.id), removeUndefinedFields(user), { merge: true });
  } catch (error) {
    console.error('Error updating user in Firestore:', error);
  }
}

// Delete a user from Firestore
export async function deleteFirestoreUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  } catch (error) {
    console.error('Error deleting user in Firestore:', error);
  }
}

// Reset chat messages and restore sample replica
export async function resetTokudomeChat(): Promise<void> {
  try {
    // Clear & re-seed users
    const allUsers = [CURRENT_USER, ...INITIAL_USERS];
    for (const u of allUsers) {
      await setDoc(doc(db, USERS_COLLECTION, u.id), removeUndefinedFields(u));
    }

    const tokudomeChatId = getChatId(CURRENT_USER.id, 'tokudome');
    const messagesCol = collection(db, CHATS_COLLECTION, tokudomeChatId, 'messages');
    
    // Get all existing messages and delete
    const snapshot = await getDocs(messagesCol);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(messagesCol, docSnap.id));
    }

    // Reseed Tokudome messages
    for (const msg of TOKUDOME_INITIAL_MESSAGES) {
      await setDoc(doc(messagesCol, msg.id), removeUndefinedFields({
        ...msg,
        chatId: tokudomeChatId
      }));
    }
  } catch (err) {
    console.error('Reset error in Firestore:', err);
  }
}
