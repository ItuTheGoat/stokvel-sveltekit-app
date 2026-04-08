import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import {
	GoogleAuthProvider,
	onAuthStateChanged,
	signInWithPopup,
	signOut,
	type User
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseServices } from '$lib/firebase';

type AuthState = {
	user: User | null;
	isAuthResolved: boolean;
	isLoading: boolean;
	error: string | null;
};

const initialState: AuthState = {
	user: null,
	isAuthResolved: false,
	isLoading: true,
	error: null
};

export const authState = writable<AuthState>(initialState);

let hasStartedAuthListener = false;

const googleProvider = new GoogleAuthProvider();

const normalizeUserProfile = (user: User) => ({
	uid: user.uid,
	email: user.email ?? null,
	displayName: user.displayName?.trim() || 'New member',
	phoneNumber: user.phoneNumber ?? '',
	photoURL: user.photoURL ?? null
});

const createUserDocument = async (user: User) => {
	const { db } = getFirebaseServices();
	const userRef = doc(db, 'users', user.uid);
	const normalized = normalizeUserProfile(user);

	await setDoc(userRef, {
		...normalized,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	});
};

const syncUserDocumentAfterSignIn = async (user: User) => {
	const { db } = getFirebaseServices();
	const userRef = doc(db, 'users', user.uid);
	const snapshot = await getDoc(userRef);
	const normalized = normalizeUserProfile(user);

	if (!snapshot.exists()) {
		await createUserDocument(user);
		return;
	}

	await setDoc(
		userRef,
		{
			...normalized,
			updatedAt: serverTimestamp()
		},
		{ merge: true }
	);
};

export const ensureUserDocument = syncUserDocumentAfterSignIn;

export const startAuthListener = () => {
	if (!browser || hasStartedAuthListener) return;

	hasStartedAuthListener = true;
	const { auth } = getFirebaseServices();

	onAuthStateChanged(
		auth,
		async (user) => {
			try {
				if (user) {
					await syncUserDocumentAfterSignIn(user);
				}

				authState.set({
					user,
					isAuthResolved: true,
					isLoading: false,
					error: null
				});
			} catch (error) {
				authState.set({
					user,
					isAuthResolved: true,
					isLoading: false,
					error: error instanceof Error ? error.message : 'Unable to sync user profile.'
				});
			}
		},
		(error) => {
			authState.set({
				user: null,
				isAuthResolved: true,
				isLoading: false,
				error: error.message
			});
		}
	);
};

const authenticateWithGoogle = async () => {
	const { auth } = getFirebaseServices();
	authState.update((state) => ({ ...state, isLoading: true, error: null }));

	try {
		const credential = await signInWithPopup(auth, googleProvider);
		return credential;
	} catch (error) {
		authState.update((state) => ({
			...state,
			isLoading: false,
			error: error instanceof Error ? error.message : 'Google sign-in failed.'
		}));
		throw error;
	}
};

const completeGoogleAuth = async () => {
	const credential = await authenticateWithGoogle();
	try {
		await syncUserDocumentAfterSignIn(credential.user);
	} catch (error) {
		authState.update((state) => ({
			...state,
			isLoading: false,
			error: error instanceof Error ? error.message : 'Failed to sync user profile.'
		}));
		throw error;
	}
	authState.update((state) => ({ ...state, isLoading: false, error: null }));
	return credential.user;
};

export const signUpWithGoogle = completeGoogleAuth;
export const signInWithGoogle = completeGoogleAuth;

export const signOutUser = async () => {
	const { auth } = getFirebaseServices();
	authState.update((state) => ({ ...state, isLoading: true, error: null }));

	try {
		await signOut(auth);
	} catch (error) {
		authState.update((state) => ({
			...state,
			error: error instanceof Error ? error.message : String(error)
		}));
		throw error;
	} finally {
		authState.update((state) => ({ ...state, isLoading: false }));
	}
};
