import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

const STORAGE_KEY_FIREBASE = 'kao_family_firebase_config';

// 1. Retrieve config from LocalStorage or Vite Env
export function getStoredFirebaseConfig(): FirebaseConfig | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_FIREBASE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse saved Firebase config:', e);
      }
    }
  }

  // Fallback to Vite Env
  const env = (import.meta as any).env || {};
  if (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (env.VITE_FIREBASE_PROJECT_ID + '.firebaseapp.com'),
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (env.VITE_FIREBASE_PROJECT_ID + '.firebasestorage.app'),
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || '',
    };
  }

  return null;
}

// 2. Save Firebase config to LocalStorage
export function setStoredFirebaseConfig(config: FirebaseConfig | null): void {
  if (typeof window !== 'undefined') {
    if (config) {
      localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(config));
    } else {
      localStorage.removeItem(STORAGE_KEY_FIREBASE);
    }
  }
}

// 3. Initialize Firebase App
let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(getStoredFirebaseConfig());
}

export function initFirebase(): { app: FirebaseApp; db: Firestore; storage: FirebaseStorage } | null {
  const config = getStoredFirebaseConfig();
  if (!config) return null;

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }

    firestoreDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);

    return {
      app: firebaseApp,
      db: firestoreDb,
      storage: firebaseStorage,
    };
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return null;
  }
}

export function getDb(): Firestore | null {
  if (!firestoreDb) {
    const res = initFirebase();
    return res ? res.db : null;
  }
  return firestoreDb;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (!firebaseStorage) {
    const res = initFirebase();
    return res ? res.storage : null;
  }
  return firebaseStorage;
}
