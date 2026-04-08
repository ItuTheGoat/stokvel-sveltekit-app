<script lang="ts">
	import { authState } from '$lib/auth';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import {
		calculateSocietyContributionGoal,
		getAdminSocietiesForUser,
		getContributionDueDescription,
		type Society
	} from '$lib/societies';

	let loading = $state(false);
	let error = $state<string | null>(null);
	let societies = $state<Society[]>([]);
	let loadedUserId = $state<string | null>(null);

	const loadSocieties = async (userId: string) => {
		loading = true;
		error = null;
		try {
			societies = await getAdminSocietiesForUser(userId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unable to load your societies.';
		} finally {
			loading = false;
		}
	};

	$effect(() => {
		if (!$authState.isAuthResolved) return;
		const userId = $authState.user?.uid;
		if (!userId) {
			societies = [];
			loadedUserId = null;
			return;
		}
		if (loadedUserId === userId) return;
		loadedUserId = userId;
		void loadSocieties(userId);
	});
</script>

<svelte:head>
	<title>Societies | Stokvel</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:px-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-2xl font-bold text-ink">My Admin Societies</h1>
		<a href="/societies/new">
			<Button>Create society</Button>
		</a>
	</div>

	{#if !$authState.isAuthResolved}
		<Card>
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Checking your session...</p>
		</Card>
	{:else if !$authState.user}
		<Card class="space-y-2">
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Sign in to view your societies.</p>
			<a class="text-sm font-semibold underline" href="/sign-in">Go to sign in</a>
		</Card>
	{:else if loading}
		<Card>
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Loading societies...</p>
		</Card>
	{:else if error}
		<Card class="space-y-2">
			<p class="text-sm text-[rgb(138_0_0)]">{error}</p>
			<Button variant="secondary" size="sm" onclick={() => void loadSocieties($authState.user!.uid)}>
				Try again
			</Button>
		</Card>
	{:else if societies.length === 0}
		<Card class="space-y-2">
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">
				You are not currently admin of any societies.
			</p>
			<a class="text-sm font-semibold underline" href="/societies/new">Create your first society</a>
		</Card>
	{:else}
		<div class="space-y-3">
			{#each societies as society (society.id)}
				<Card class="space-y-3 bg-surface-lowest">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="space-y-1">
							<h2 class="text-lg font-semibold">{society.name}</h2>
							<p class="text-sm text-[rgb(27_27_31_/_75%)]">Invite code: {society.inviteCode}</p>
							<p class="text-sm text-[rgb(27_27_31_/_75%)]">
								Total pot: {society.totalPot.toLocaleString()}
							</p>
							<p class="text-sm text-[rgb(27_27_31_/_75%)]">Type: {society.type}</p>
							{#if society.description}
								<p class="text-sm text-[rgb(27_27_31_/_75%)]">Description: {society.description}</p>
							{/if}
							<p class="text-sm text-[rgb(27_27_31_/_75%)]">
								Contribution goal: {calculateSocietyContributionGoal(society).toLocaleString()}
							</p>
							<p class="text-sm text-[rgb(27_27_31_/_75%)]">
								Monthly contribution {society.rules.amount.toLocaleString()} each; due
								{getContributionDueDescription({
									contributionDuePreset: society.rules.contributionDuePreset,
									contributionDueOtherDetail: society.rules.contributionDueOtherDetail
								})}. Up to {society.rules.maxMembers} members; starts
								{society.rules.startDate.toDate().toLocaleDateString()}, ends
								{society.rules.endDate.toDate().toLocaleDateString()}.
							</p>
						</div>
						<div class="flex items-center gap-3 text-sm">
							<a class="font-semibold underline" href={`/societies/${society.id}`}>View</a>
							<a class="font-semibold underline" href={`/societies/${society.id}/edit`}>Edit</a>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</main>
