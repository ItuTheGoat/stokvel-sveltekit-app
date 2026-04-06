type ClassPrimitive = string | number | boolean | null | undefined;
type ClassDictionary = Record<string, boolean | null | undefined>;
type ClassArray = ClassValue[];
export type ClassValue = ClassPrimitive | ClassDictionary | ClassArray;

function flattenClass(input: ClassValue): string[] {
	if (!input) return [];
	if (typeof input === 'string' || typeof input === 'number') return [String(input)];
	if (Array.isArray(input)) return input.flatMap(flattenClass);
	if (typeof input === 'object') {
		return Object.entries(input)
			.filter(([, enabled]) => Boolean(enabled))
			.map(([className]) => className);
	}
	return [];
}

export function cn(...inputs: ClassValue[]) {
	return inputs.flatMap(flattenClass).join(' ');
}
