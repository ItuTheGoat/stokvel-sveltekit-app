<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { initFirebaseServices } from '$lib/firebase';

	let { children } = $props();

	onMount(() => {
		initFirebaseServices();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
