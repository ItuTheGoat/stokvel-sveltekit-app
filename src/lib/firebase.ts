import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { browser } from '$app/environment';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const initFirebase = (): FirebaseApp => {
	if (!getApps().length) {
		initializeApp(firebaseConfig);
	}

	return getApp();
};

let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

export const initFirebaseServices = () => {
	const app = initFirebase();

	auth ??= getAuth(app);
	db ??= getFirestore(app);
	storage ??= getStorage(app);

	// Analytics is browser-only and can throw in unsupported environments.
	if (browser && analytics === null) {
		try {
			analytics = getAnalytics(app);
		} catch {
			analytics = null;
		}
	}

	return { app, auth, db, storage, analytics };
};

export const getFirebaseServices = () => initFirebaseServices();
