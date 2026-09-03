import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import bundledConfig from '../../firebase-applet-config.json';

// Support both bundled config and environment variables for Vercel/GitHub deployments
const safeBundledConfig: any = bundledConfig;
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || safeBundledConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || safeBundledConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || safeBundledConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || safeBundledConfig.authDomain,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    safeBundledConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || safeBundledConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || safeBundledConfig.messagingSenderId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || safeBundledConfig.measurementId,
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || safeBundledConfig.oAuthClientId,
};

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use specified database ID if present in config, otherwise standard default
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Test connection on boot according to skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    // Expected on initial unauthenticated boot under strict security rules
    console.debug('Firebase Firestore test connection initialized.');
  }
}
testConnection();

// Token cache for Google Workspace (Drive) with sessionStorage persistence
let cachedDriveAccessToken: string | null = (typeof window !== 'undefined' ? sessionStorage.getItem('meduca_drive_token') : null);

export function setCachedDriveToken(token: string | null) {
  cachedDriveAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('meduca_drive_token', token);
    } else {
      sessionStorage.removeItem('meduca_drive_token');
    }
  }
}

export function getCachedDriveToken(): string | null {
  if (!cachedDriveAccessToken && typeof window !== 'undefined') {
    cachedDriveAccessToken = sessionStorage.getItem('meduca_drive_token');
  }
  return cachedDriveAccessToken;
}

// Authentication helpers
export async function loginWithGoogle(): Promise<{ user: User; accessToken?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedDriveAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: credential?.accessToken };
  } catch (error: any) {
    if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'tu dominio';
      throw new Error(
        `Dominio no autorizado en Firebase (${hostname}). Debes registrar este dominio en Firebase Console -> Authentication -> Settings -> Authorized domains.`
      );
    }
    throw error;
  }
}

export async function loginWithGoogleForDrive(): Promise<string> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se obtuvo el token de acceso de Google Drive.');
    }
    cachedDriveAccessToken = credential.accessToken;
    return credential.accessToken;
  } catch (error: any) {
    if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'tu dominio';
      throw new Error(
        `Dominio no autorizado en Firebase (${hostname}). Agrega "${hostname}" en Firebase Console -> Authentication -> Settings -> Authorized domains.`
      );
    }
    throw error;
  }
}

export async function loginWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

export async function checkRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (e) {
    console.warn('Redirect auth check warning:', e);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  setCachedDriveToken(null);
  await signOut(auth);
}

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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { onAuthStateChanged, doc, getDoc, setDoc, onSnapshot };
export type { User };
