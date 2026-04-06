<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost';
	type ButtonSize = 'default' | 'sm' | 'lg';

	interface Props extends Omit<HTMLButtonAttributes, 'children' | 'class'> {
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: ClassValue;
		children?: Snippet;
	}

	let {
		variant = 'primary',
		size = 'default',
		class: className,
		children,
		type = 'button',
		...rest
	}: Props = $props();

	const baseClass =
		'inline-flex items-center justify-center whitespace-nowrap rounded-[16px] px-5 font-semibold tracking-[-0.01em] transition-all duration-200 outline-none disabled:pointer-events-none disabled:opacity-50 shadow-ambient focus-visible:ring-2 focus-visible:ring-[rgb(198_197_212_/_35%)] focus-visible:ring-offset-0';

	const variantClass: Record<ButtonVariant, string> = {
		primary:
			'bg-primary-gradient text-[var(--color-primary-foreground)] hover:brightness-[1.06] active:brightness-[0.98]',
		secondary:
			'bg-[var(--color-secondary-container)] text-[var(--color-secondary-container-foreground)] hover:brightness-[1.03] active:brightness-[0.98]',
		tertiary:
			'bg-transparent text-ink hover:bg-surface-low active:bg-surface-high',
		ghost:
			'bg-transparent text-ink shadow-none hover:bg-surface-low/70 active:bg-surface-high/70'
	};

	const sizeClass: Record<ButtonSize, string> = {
		default: 'h-12 text-[0.95rem]',
		sm: 'h-10 px-4 text-[0.875rem]',
		lg: 'h-14 px-6 text-base'
	};
</script>

<button
	{type}
	{...rest}
	class={cn(baseClass, variantClass[variant], sizeClass[size], className)}
>
	{@render children?.()}
</button>
