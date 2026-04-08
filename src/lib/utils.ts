import { clsx, type ClassValue } from 'clsx';

export type { ClassValue };

export function cn(...inputs: ClassValue[]) {
	return clsx(inputs);
}
