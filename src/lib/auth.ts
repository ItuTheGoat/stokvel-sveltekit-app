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

export const ensureUserDocument = async (user: User) => {
	const { db } = getFirebaseServices();
	const userRef = doc(db, 'users', user.uid);
	const snapshot = await getDoc(userRef);

	if (!snapshot.exists()) {
		await setDoc(userRef, {
			uid: user.uid,
			email: user.email ?? null,
			displayName: user.displayName ?? null,
			photoURL: user.photoURL ?? null,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
		return;
	}

	await setDoc(
		userRef,
		{
			email: user.email ?? null,
			displayName: user.displayName ?? null,
			photoURL: user.photoURL ?? null,
			updatedAt: serverTimestamp()
		},
		{ merge: true }
	);
};

export const startAuthListener = () => {
	if (!browser || hasStartedAuthListener) return;

	hasStartedAuthListener = true;
	const { auth } = getFirebaseServices();

	onAuthStateChanged(
		auth,
		async (user) => {
			try {
				if (user) {
					await ensureUserDocument(user);
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

export const signInWithGoogle = async () => {
	const { auth } = getFirebaseServices();
	authState.update((state) => ({ ...state, isLoading: true, error: null }));

	try {
		const credential = await signInWithPopup(auth, googleProvider);
		await ensureUserDocument(credential.user);
		authState.update((state) => ({ ...state, isLoading: false, error: null }));
		return credential.user;
	} catch (error) {
		authState.update((state) => ({
			...state,
			isLoading: false,
			error: error instanceof Error ? error.message : 'Google sign-in failed.'
		}));
		throw error;
	}
};

export const signOutUser = async () => {
	const { auth } = getFirebaseServices();
	authState.update((state) => ({ ...state, isLoading: true, error: null }));

	try {
		await signOut(auth);
	} finally {
		authState.update((state) => ({ ...state, isLoading: false }));
	}
};
