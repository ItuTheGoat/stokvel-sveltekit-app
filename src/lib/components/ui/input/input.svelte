<script lang="ts">
	import type { ClassValue, HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends Omit<HTMLInputAttributes, 'class' | 'value'> {
		class?: ClassValue;
		value?: HTMLInputAttributes['value'];
	}

	let { class: className, type = 'text', value = $bindable(), ...rest }: Props = $props();
</script>

<input
	bind:value
	{type}
	{...rest}
	class={cn(
		'h-12 w-full rounded-[16px] bg-surface-low px-4 text-[0.95rem] text-ink shadow-[inset_0_1px_0_rgb(255_255_255_/_45%),inset_0_-1px_0_rgb(27_27_31_/_3%)] outline-none placeholder:text-[rgb(27_27_31_/_50%)] transition-all duration-200 ghost-outline focus-visible:bg-surface-lowest focus-visible:ring-2 focus-visible:ring-[rgb(198_197_212_/_35%)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60',
		className
	)}
/>
