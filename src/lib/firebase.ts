import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  type Firestore
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigData.projectId || "gen-lang-client-0105505780",
  appId: firebaseConfigData.appId || "1:195274843550:web:b9df896894df45d039e28f",
  apiKey: firebaseConfigData.apiKey || "AIzaSyB25JN_ZaselKMXEPbTyOPyxXsweA2bOwo",
  authDomain: firebaseConfigData.authDomain || "gen-lang-client-0105505780.firebaseapp.com",
  storageBucket: firebaseConfigData.storageBucket || "gen-lang-client-0105505780.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "195274843550",
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, firebaseConfigData.firestoreDatabaseId || undefined);

export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp
};
