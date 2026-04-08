import {
	Timestamp,
	collection,
	deleteField,
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

export const MONTHLY_INTERVAL = 'monthly' as const;
export const SOCIETY_INTERVALS = [MONTHLY_INTERVAL] as const;
export const SOCIETY_TYPES = [
	'Savings',
	'Investment',
	'Burial Society',
	'Education fund',
	'Business fund',
	'other'
] as const;
export const SOCIETY_DUE_PRESETS = ['first_of_month', 'last_of_month', 'day_25', 'other'] as const;

export type SocietyInterval = (typeof SOCIETY_INTERVALS)[number];
export type SocietyType = (typeof SOCIETY_TYPES)[number];
export type SocietyDuePreset = (typeof SOCIETY_DUE_PRESETS)[number];

export type SocietyRules = {
	amount: number;
	interval: SocietyInterval;
	contributionDuePreset: SocietyDuePreset;
	contributionDueOtherDetail: string;
	maxMembers: number;
	startDate: Timestamp;
	endDate: Timestamp;
};

export type Society = {
	id: string;
	name: string;
	type: SocietyType;
	description?: string;
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
	type: SocietyType;
	description?: string;
	creatorId: string;
	creatorDisplayName: string;
	amount: number;
	contributionDuePreset: SocietyDuePreset;
	contributionDueOtherDetail: string;
	maxMembers: number;
	startDate: Date;
	endDate: Date;
};

type UpdateSocietyInput = {
	name: string;
	type: SocietyType;
	description?: string;
	amount: number;
	contributionDuePreset: SocietyDuePreset;
	contributionDueOtherDetail: string;
	maxMembers: number;
	startDate: Date;
	endDate: Date;
};

export type SocietyFormInput = {
	name: string;
	type: SocietyType;
	description: string;
	amount: number;
	contributionDuePreset: SocietyDuePreset;
	contributionDueOtherDetail: string;
	maxMembers: number;
	startDate: string;
	endDate: string;
};

export type SocietyFormErrors = Partial<Record<keyof SocietyFormInput, string>>;

const SOCIETY_COLLECTION = 'societies';
const MEMBERSHIP_COLLECTION = 'memberships';
const DEFAULT_TOTAL_POT = 0;
const INVITE_CODE_REGEX = /^[A-Z0-9]{4}-[A-Z0-9]{3}$/;
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const MAX_DESCRIPTION_LENGTH = 160;
export const MAX_DUE_DETAIL_LENGTH = 120;
export const DEFAULT_DUE_PRESET: SocietyDuePreset = 'first_of_month';
const INVITE_CODE_MAX_ATTEMPTS = 5;
export const DUE_PRESET_LABELS: Record<SocietyDuePreset, string> = {
	first_of_month: '1st of the month',
	last_of_month: 'Last day of the month',
	day_25: '25th of the month',
	other: 'Other'
};

export const getContributionDueDescription = (input: {
	contributionDuePreset: SocietyDuePreset;
	contributionDueOtherDetail: string;
}) =>
	input.contributionDuePreset === 'other' && input.contributionDueOtherDetail.trim()
		? input.contributionDueOtherDetail.trim()
		: DUE_PRESET_LABELS[input.contributionDuePreset];

const sanitizeDisplayName = (name: string) => name.trim() || 'New member';

const normalizeSocietyData = (id: string, data: Record<string, unknown>): Society => {
	const rules = (data.rules ?? {}) as Partial<SocietyRules>;
	const startDate = rules.startDate instanceof Timestamp ? rules.startDate : Timestamp.now();
	const endDate = rules.endDate instanceof Timestamp ? rules.endDate : startDate;
	const contributionDuePreset = SOCIETY_DUE_PRESETS.includes(rules.contributionDuePreset as SocietyDuePreset)
		? (rules.contributionDuePreset as SocietyDuePreset)
		: DEFAULT_DUE_PRESET;
	const contributionDueOtherDetail =
		contributionDuePreset === 'other' && typeof rules.contributionDueOtherDetail === 'string'
			? rules.contributionDueOtherDetail.trim()
			: '';

	return {
		id,
		name: typeof data.name === 'string' ? data.name : '',
		type: SOCIETY_TYPES.includes(data.type as SocietyType) ? (data.type as SocietyType) : 'other',
		description: typeof data.description === 'string' ? data.description : undefined,
		inviteCode: typeof data.inviteCode === 'string' ? data.inviteCode : '',
		creatorId: typeof data.creatorId === 'string' ? data.creatorId : '',
		totalPot: typeof data.totalPot === 'number' ? data.totalPot : DEFAULT_TOTAL_POT,
		rules: {
			amount: typeof rules.amount === 'number' ? rules.amount : 0,
			interval: MONTHLY_INTERVAL,
			contributionDuePreset,
			contributionDueOtherDetail,
			maxMembers: typeof rules.maxMembers === 'number' ? rules.maxMembers : 2,
			startDate,
			endDate
		}
	};
};

const societyFromSnapshot = (snapshot: QueryDocumentSnapshot): Society => {
	const data = snapshot.data() as Record<string, unknown>;
	return normalizeSocietyData(snapshot.id, data);
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
		input.type,
		input.amount,
		MONTHLY_INTERVAL,
		input.maxMembers,
		input.startDate.toISOString(),
		input.endDate.toISOString()
	].join('|');

export const createInviteCodeCandidate = (input: CreateSocietyInput) => {
	for (let attempt = 0; attempt < INVITE_CODE_MAX_ATTEMPTS; attempt += 1) {
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
		if (INVITE_CODE_REGEX.test(inviteCode)) {
			return inviteCode;
		}
	}

	throw new Error('Invite code generation failed after maximum attempts.');
};

export const parseDateInput = (dateInput: string) => {
	if (!dateInput) return null;
	const parsed = new Date(`${dateInput}T00:00:00`);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed;
};

export const validateSocietyForm = (input: SocietyFormInput): SocietyFormErrors => {
	const errors: SocietyFormErrors = {};
	if (!input.name.trim()) {
		errors.name = 'Society name is required.';
	}
	if (!SOCIETY_TYPES.includes(input.type)) {
		errors.type = 'Society type is required.';
	}
	if (input.description.trim().length > MAX_DESCRIPTION_LENGTH) {
		errors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
	}
	if (Number.isNaN(input.amount) || input.amount <= 0) {
		errors.amount = 'Contribution amount must be greater than 0.';
	}
	if (!SOCIETY_DUE_PRESETS.includes(input.contributionDuePreset)) {
		errors.contributionDuePreset = 'Select a contribution due date option.';
	}
	const dueOtherDetail = input.contributionDueOtherDetail.trim();
	if (input.contributionDuePreset === 'other' && !dueOtherDetail) {
		errors.contributionDueOtherDetail = 'Please specify the custom contribution due date.';
	}
	if (dueOtherDetail.length > MAX_DUE_DETAIL_LENGTH) {
		errors.contributionDueOtherDetail =
			`Custom due date must be ${MAX_DUE_DETAIL_LENGTH} characters or fewer.`;
	}
	if (!Number.isInteger(input.maxMembers) || input.maxMembers < 2) {
		errors.maxMembers = 'Maximum members (including you) must be at least 2.';
	}
	const parsedStartDate = parseDateInput(input.startDate);
	const parsedEndDate = parseDateInput(input.endDate);
	if (!parsedStartDate) {
		errors.startDate = 'Start date is required.';
	}
	if (!parsedEndDate) {
		errors.endDate = 'End date is required.';
	}
	if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
		errors.endDate = 'End date must be on or after the start date.';
	}
	return errors;
};

const getDaysInMonth = (year: number, monthZeroIndexed: number) =>
	new Date(Date.UTC(year, monthZeroIndexed + 1, 0)).getUTCDate();

const addMonthsClamped = (date: Date, monthsToAdd: number) => {
	const year = date.getUTCFullYear();
	const month = date.getUTCMonth();
	const day = date.getUTCDate();

	const targetMonth = month + monthsToAdd;
	const targetYear = year + Math.floor(targetMonth / 12);
	const normalizedMonth = ((targetMonth % 12) + 12) % 12;
	const clampedDay = Math.min(day, getDaysInMonth(targetYear, normalizedMonth));

	return new Date(
		Date.UTC(
			targetYear,
			normalizedMonth,
			clampedDay,
			date.getUTCHours(),
			date.getUTCMinutes(),
			date.getUTCSeconds(),
			date.getUTCMilliseconds()
		)
	);
};

const addIntervalToDate = (date: Date) => addMonthsClamped(date, 1);

const countContributionPeriods = (startDate: Date, endDate: Date) => {
	let periods = 0;
	let cursor = new Date(startDate.getTime());

	while (cursor <= endDate) {
		periods += 1;
		cursor = addIntervalToDate(cursor);
	}

	return periods;
};

export const calculateTotalContributionGoal = (input: {
	amount: number;
	maxMembers: number;
	startDate: Date;
	endDate: Date;
}) => {
	const { amount, maxMembers, startDate, endDate } = input;
	if (!Number.isFinite(amount) || amount <= 0) return 0;
	if (!Number.isInteger(maxMembers) || maxMembers <= 0) return 0;
	if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
	if (endDate < startDate) return 0;

	const periodCount = countContributionPeriods(startDate, endDate);
	return amount * maxMembers * periodCount;
};

export const calculateSocietyContributionGoal = (society: Society) =>
	calculateTotalContributionGoal({
		amount: society.rules.amount,
		maxMembers: society.rules.maxMembers,
		startDate: society.rules.startDate.toDate(),
		endDate: society.rules.endDate.toDate()
	});

export const createSocietyWithCreatorAdminMembership = async (input: CreateSocietyInput) => {
	const { db } = getFirebaseServices();
	const inviteCode = createInviteCodeCandidate(input);
	const societyRef = doc(collection(db, SOCIETY_COLLECTION));
	const membershipRef = doc(db, MEMBERSHIP_COLLECTION, `${societyRef.id}_${input.creatorId}`);
	const parsedStartDate = Timestamp.fromDate(input.startDate);

	const batch = writeBatch(db);
	batch.set(societyRef, {
		name: input.name.trim(),
		type: input.type,
		description: input.description?.trim() || '',
		inviteCode,
		creatorId: input.creatorId,
		totalPot: DEFAULT_TOTAL_POT,
		rules: {
			amount: input.amount,
			interval: MONTHLY_INTERVAL,
			contributionDuePreset: input.contributionDuePreset,
			contributionDueOtherDetail:
				input.contributionDuePreset === 'other' ? input.contributionDueOtherDetail.trim() : '',
			maxMembers: input.maxMembers,
			startDate: parsedStartDate,
			endDate: Timestamp.fromDate(input.endDate)
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
	return normalizeSocietyData(snapshot.id, snapshot.data() as Record<string, unknown>);
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
		type: input.type,
		description: input.description?.trim() ? input.description.trim() : deleteField(),
		'rules.amount': input.amount,
		'rules.interval': MONTHLY_INTERVAL,
		'rules.contributionDuePreset': input.contributionDuePreset,
		'rules.contributionDueOtherDetail':
			input.contributionDuePreset === 'other' ? input.contributionDueOtherDetail.trim() : '',
		'rules.maxMembers': input.maxMembers,
		'rules.startDate': Timestamp.fromDate(input.startDate),
		'rules.endDate': Timestamp.fromDate(input.endDate)
	});
};
