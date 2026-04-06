import {
	Timestamp,
	collection,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	serverTimestamp,
	updateDoc,
	where,
	writeBatch,
	type QueryDocumentSnapshot
} from 'firebase/firestore';
import { getFirebaseServices } from '$lib/firebase';

export const SOCIETY_INTERVALS = ['weekly', 'monthly', 'quarterly'] as const;

export type SocietyInterval = (typeof SOCIETY_INTERVALS)[number];

export type SocietyRules = {
	amount: number;
	interval: SocietyInterval;
	maxMembers: number;
	startDate: Timestamp;
};

export type Society = {
	id: string;
	name: string;
	inviteCode: string;
	creatorId: string;
	totalPot: number;
	rules: SocietyRules;
};

type Membership = {
	societyId: string;
	userId: string;
	role: 'admin' | 'member';
	displayName: string;
	joinedAt: Timestamp;
};

type CreateSocietyInput = {
	name: string;
	creatorId: string;
	creatorDisplayName: string;
	amount: number;
	interval: SocietyInterval;
	maxMembers: number;
	startDate: Date;
};

type UpdateSocietyInput = {
	name: string;
	amount: number;
	interval: SocietyInterval;
	maxMembers: number;
	startDate: Date;
};

export type SocietyFormInput = {
	name: string;
	amount: number;
	interval: SocietyInterval;
	maxMembers: number;
	startDate: string;
};

export type SocietyFormErrors = Partial<Record<keyof SocietyFormInput, string>>;

const SOCIETY_COLLECTION = 'societies';
const MEMBERSHIP_COLLECTION = 'memberships';
const DEFAULT_TOTAL_POT = 0;
const INVITE_CODE_REGEX = /^[A-Z0-9]{4}-[A-Z0-9]{3}$/;
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const sanitizeDisplayName = (name: string) => name.trim() || 'New member';

const societyFromSnapshot = (snapshot: QueryDocumentSnapshot): Society => {
	const data = snapshot.data() as Omit<Society, 'id'>;
	return { id: snapshot.id, ...data };
};

const fnv1a32 = (input: string) => {
	let hash = 0x811c9dc5;
	for (let index = 0; index < input.length; index += 1) {
		hash ^= input.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
};

const getRandomUint32 = () => {
	if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
		const values = new Uint32Array(1);
		globalThis.crypto.getRandomValues(values);
		return values[0];
	}

	return Math.floor(Math.random() * 0xffffffff) >>> 0;
};

const lcgNext = (state: number) => (Math.imul(state, 1664525) + 1013904223) >>> 0;

const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ').toUpperCase();

const buildInviteSeed = (input: CreateSocietyInput) =>
	[
		new Date().toISOString(),
		normalizeName(input.name),
		input.amount,
		input.interval,
		input.maxMembers,
		input.startDate.toISOString()
	].join('|');

export const createInviteCodeCandidate = (input: CreateSocietyInput) => {
	const randomA = getRandomUint32();
	const randomB = getRandomUint32();
	const seed = `${buildInviteSeed(input)}|${randomA}|${randomB}`;

	let state = fnv1a32(seed) ^ randomA ^ randomB;
	let compactCode = '';

	for (let index = 0; index < 7; index += 1) {
		state = lcgNext(state);
		compactCode += CROCKFORD_ALPHABET[state % CROCKFORD_ALPHABET.length];
	}

	const inviteCode = `${compactCode.slice(0, 4)}-${compactCode.slice(4)}`;
	if (!INVITE_CODE_REGEX.test(inviteCode)) {
		throw new Error('Invite code generation failed.');
	}

	return inviteCode;
};

export const parseDateInput = (startDate: string) => {
	if (!startDate) return null;
	const parsed = new Date(`${startDate}T00:00:00`);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed;
};

export const validateSocietyForm = (input: SocietyFormInput): SocietyFormErrors => {
	const errors: SocietyFormErrors = {};
	if (!input.name.trim()) {
		errors.name = 'Society name is required.';
	}
	if (Number.isNaN(input.amount) || input.amount <= 0) {
		errors.amount = 'Contribution amount must be greater than 0.';
	}
	if (!SOCIETY_INTERVALS.includes(input.interval)) {
		errors.interval = 'Contribution interval must be weekly, monthly, or quarterly.';
	}
	if (!Number.isInteger(input.maxMembers) || input.maxMembers < 2) {
		errors.maxMembers = 'Maximum members must be at least 2.';
	}
	if (!parseDateInput(input.startDate)) {
		errors.startDate = 'Start date is required.';
	}
	return errors;
};

export const createSocietyWithCreatorAdminMembership = async (input: CreateSocietyInput) => {
	const { db } = getFirebaseServices();
	const inviteCode = createInviteCodeCandidate(input);
	const societyRef = doc(collection(db, SOCIETY_COLLECTION));
	const membershipRef = doc(db, MEMBERSHIP_COLLECTION, `${societyRef.id}_${input.creatorId}`);
	const parsedStartDate = Timestamp.fromDate(input.startDate);

	const batch = writeBatch(db);
	batch.set(societyRef, {
		name: input.name.trim(),
		inviteCode,
		creatorId: input.creatorId,
		totalPot: DEFAULT_TOTAL_POT,
		rules: {
			amount: input.amount,
			interval: input.interval,
			maxMembers: input.maxMembers,
			startDate: parsedStartDate
		}
	});
	batch.set(membershipRef, {
		societyId: societyRef.id,
		userId: input.creatorId,
		role: 'admin',
		displayName: sanitizeDisplayName(input.creatorDisplayName),
		joinedAt: serverTimestamp()
	});
	await batch.commit();

	return {
		societyId: societyRef.id,
		inviteCode
	};
};

export const getSocietyById = async (societyId: string) => {
	const { db } = getFirebaseServices();
	const snapshot = await getDoc(doc(db, SOCIETY_COLLECTION, societyId));
	if (!snapshot.exists()) return null;
	return {
		id: snapshot.id,
		...(snapshot.data() as Omit<Society, 'id'>)
	};
};

export const getAdminSocietiesForUser = async (userId: string) => {
	const { db } = getFirebaseServices();
	const membershipQuery = query(
		collection(db, MEMBERSHIP_COLLECTION),
		where('userId', '==', userId),
		orderBy('joinedAt', 'desc')
	);
	const membershipSnapshot = await getDocs(membershipQuery);
	const adminMemberships = membershipSnapshot.docs
		.map((docSnapshot) => docSnapshot.data() as Membership)
		.filter((membership) => membership.role === 'admin');

	const societySnapshots = await Promise.all(
		adminMemberships.map((membership) => getDoc(doc(db, SOCIETY_COLLECTION, membership.societyId)))
	);

	return societySnapshots
		.filter((snapshot) => snapshot.exists())
		.map((snapshot) => societyFromSnapshot(snapshot as QueryDocumentSnapshot));
};

export const updateSocietyById = async (societyId: string, input: UpdateSocietyInput) => {
	const { db } = getFirebaseServices();
	await updateDoc(doc(db, SOCIETY_COLLECTION, societyId), {
		name: input.name.trim(),
		'rules.amount': input.amount,
		'rules.interval': input.interval,
		'rules.maxMembers': input.maxMembers,
		'rules.startDate': Timestamp.fromDate(input.startDate)
	});
};
