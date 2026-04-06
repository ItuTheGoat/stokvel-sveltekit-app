<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue, SvelteHTMLElements } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends Omit<SvelteHTMLElements['div'], 'children' | 'class'> {
		class?: ClassValue;
		ghostOutline?: boolean;
		children?: Snippet;
	}

	let { class: className, ghostOutline = false, children, ...rest }: Props = $props();
</script>

<div
	{...rest}
	class={cn(
		'rounded-[16px] bg-surface-low p-6 text-ink shadow-ambient',
		ghostOutline && 'ghost-outline',
		className
	)}
>
	{@render children?.()}
</div>
