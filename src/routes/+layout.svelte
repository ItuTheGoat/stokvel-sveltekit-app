<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { authState, startAuthListener } from '$lib/auth';

	let { children } = $props();

	const handleAuthRouting = () => {
		const state = get(authState);
		if (!state.isAuthResolved || state.isLoading) {
			return;
		}

		const isAuthPage = page.url.pathname === '/sign-in' || page.url.pathname === '/sign-up';

		if (!state.user && !isAuthPage) {
			goto('/sign-in', { replaceState: true });
			return;
		}

		if (state.user && isAuthPage) {
			goto('/', { replaceState: true });
		}
	};

	onMount(() => {
		startAuthListener();
		const unsubscribe = authState.subscribe(() => {
			handleAuthRouting();
		});

		return unsubscribe;
	});

	afterNavigate(() => {
		handleAuthRouting();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#if !$authState.isAuthResolved || $authState.isLoading}
	<div class="flex min-h-screen items-center justify-center bg-surface">
		<div class="rounded-[16px] bg-surface-low px-6 py-4 text-sm font-medium text-ink shadow-ambient">
			Loading your workspace...
		</div>
	</div>
{:else}
	{@render children()}
{/if}
