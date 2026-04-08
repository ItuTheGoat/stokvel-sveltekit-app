<script lang="ts">
	import { page } from '$app/state';
	import { authState } from '$lib/auth';
	import { Card } from '$lib/components/ui/card';
	import {
		calculateSocietyContributionGoal,
		getContributionDueDescription,
		getSocietyById,
		type Society
	} from '$lib/societies';

	let loading = $state(false);
	let error = $state<string | null>(null);
	let society = $state<Society | null>(null);
	let loadedId = $state<string | null>(null);

	const societyId = $derived(page.params.societyId ?? '');

	const loadSociety = async (id: string) => {
		loading = true;
		error = null;
		try {
			society = await getSocietyById(id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unable to load society.';
		} finally {
			loading = false;
		}
	};

	$effect(() => {
		if (!$authState.isAuthResolved) return;
		if (!$authState.user) {
			society = null;
			return;
		}
		if (!societyId || loadedId === societyId) return;
		loadedId = societyId;
		void loadSociety(societyId);
	});
</script>

<svelte:head>
	<title>Society Details | Stokvel</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6">
	<div class="flex flex-wrap gap-3 text-sm">
		<a class="font-semibold underline" href="/societies">Back to societies</a>
		{#if society}
			<a class="font-semibold underline" href={`/societies/${society.id}/edit`}>Edit society</a>
		{/if}
	</div>

	{#if !$authState.isAuthResolved}
		<Card>
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Checking your session...</p>
		</Card>
	{:else if !$authState.user}
		<Card class="space-y-2">
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Sign in to view society details.</p>
			<a class="text-sm font-semibold underline" href="/sign-in">Go to sign in</a>
		</Card>
	{:else if loading}
		<Card>
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Loading society...</p>
		</Card>
	{:else if error}
		<Card class="space-y-2">
			<p class="text-sm text-[rgb(138_0_0)]">{error}</p>
			<button
				class="text-sm font-semibold underline"
				type="button"
				onclick={() => {
					if (!societyId) return;
					void loadSociety(societyId);
				}}
			>
				Try again
			</button>
		</Card>
	{:else if !society}
		<Card>
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Society not found.</p>
		</Card>
	{:else}
		<Card class="space-y-3 bg-surface-lowest">
			<h1 class="text-2xl font-bold text-ink">{society.name}</h1>
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Type: {society.type}</p>
			{#if society.description}
				<p class="text-sm text-[rgb(27_27_31_/_75%)]">Description: {society.description}</p>
			{/if}
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Invite code: {society.inviteCode}</p>
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Total pot: {society.totalPot.toLocaleString()}</p>
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">
				Contribution goal: {calculateSocietyContributionGoal(society).toLocaleString()}
			</p>
			<div class="grid gap-2 rounded-[12px] bg-surface-low p-4 text-sm sm:grid-cols-2">
				<p><span class="font-semibold">Amount (monthly):</span> {society.rules.amount.toLocaleString()}</p>
				<p><span class="font-semibold">Schedule:</span> Monthly</p>
				<p class="sm:col-span-2">
					<span class="font-semibold">Due:</span>
					{getContributionDueDescription({
						contributionDuePreset: society.rules.contributionDuePreset,
						contributionDueOtherDetail: society.rules.contributionDueOtherDetail
					})}
				</p>
				<p><span class="font-semibold">Max members:</span> {society.rules.maxMembers}</p>
				<p>
					<span class="font-semibold">Start date:</span>
					{society.rules.startDate.toDate().toLocaleDateString()}
				</p>
				<p>
					<span class="font-semibold">End date:</span>
					{society.rules.endDate.toDate().toLocaleDateString()}
				</p>
			</div>
		</Card>
	{/if}
</main>
