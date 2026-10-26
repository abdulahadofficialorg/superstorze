import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Merge JSON config with any Vite environment variables for Netlify/production deployments
const effectiveConfig = {
  projectId: (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfig?.projectId || 'ai-studio-applet-webapp-37dde',
  appId: (import.meta.env?.VITE_FIREBASE_APP_ID as string) || firebaseConfig?.appId || '1:812329265954:web:85d0ad2fe09df2e0df537b',
  apiKey: (import.meta.env?.VITE_FIREBASE_API_KEY as string) || firebaseConfig?.apiKey || 'AIzaSyBGm-0SfBE_IWAAhWCz1_oDVuJt6uV9bgg',
  authDomain: (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfig?.authDomain || 'ai-studio-applet-webapp-37dde.firebaseapp.com',
  firestoreDatabaseId: (import.meta.env?.VITE_FIREBASE_DATABASE_ID as string) || firebaseConfig?.firestoreDatabaseId || 'ai-studio-7c9f6906-5663-4f67-bb97-dcb4a8c02477',
  storageBucket: (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfig?.storageBucket || 'ai-studio-applet-webapp-37dde.firebasestorage.app',
  messagingSenderId: (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfig?.messagingSenderId || '812329265954',
  measurementId: firebaseConfig?.measurementId || '',
};

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(effectiveConfig) : getApps()[0];

// CRITICAL: Must use firestoreDatabaseId if configured
export const db =
  effectiveConfig.firestoreDatabaseId && effectiveConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, effectiveConfig.firestoreDatabaseId)
    : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Firestore Operation Types per specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on startup per Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
  }
}

testConnection();
