<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authState } from '$lib/auth';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		SOCIETY_INTERVALS,
		getSocietyById,
		parseDateInput,
		updateSocietyById,
		validateSocietyForm,
		type SocietyFormErrors,
		type SocietyFormInput
	} from '$lib/societies';

	let loading = $state(true);
	let saving = $state(false);
	let loadError = $state<string | null>(null);
	let saveError = $state<string | null>(null);
	let formErrors = $state<SocietyFormErrors>({});
	let initialized = $state(false);
	let form = $state<SocietyFormInput>({
		name: '',
		amount: 0,
		interval: SOCIETY_INTERVALS[0],
		maxMembers: 2,
		startDate: ''
	});

	const societyId = $derived(page.params.societyId ?? '');

	const intervalLabelMap = {
		weekly: 'Weekly',
		monthly: 'Monthly',
		quarterly: 'Quarterly'
	} satisfies Record<(typeof SOCIETY_INTERVALS)[number], string>;

	const load = async (id: string) => {
		loading = true;
		loadError = null;
		try {
			const society = await getSocietyById(id);
			if (!society) {
				loadError = 'Society not found.';
				return;
			}
			form = {
				name: society.name,
				amount: society.rules.amount,
				interval: society.rules.interval,
				maxMembers: society.rules.maxMembers,
				startDate: society.rules.startDate.toDate().toISOString().split('T')[0]
			};
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Unable to load society.';
		} finally {
			loading = false;
			initialized = true;
		}
	};

	$effect(() => {
		if (initialized || !$authState.isAuthResolved || !$authState.user) return;
		if (!societyId) {
			loadError = 'Society not found.';
			loading = false;
			initialized = true;
			return;
		}
		void load(societyId);
	});

	const submit = async () => {
		if (!societyId) {
			saveError = 'Society not found.';
			return;
		}
		saveError = null;
		const errors = validateSocietyForm(form);
		formErrors = errors;
		if (Object.keys(errors).length > 0) return;

		const parsedDate = parseDateInput(form.startDate);
		if (!parsedDate) {
			formErrors = { ...formErrors, startDate: 'Start date is required.' };
			return;
		}

		saving = true;
		try {
			await updateSocietyById(societyId, {
				name: form.name,
				amount: form.amount,
				interval: form.interval,
				maxMembers: form.maxMembers,
				startDate: parsedDate
			});
			await goto(`/societies/${societyId}`);
		} catch (error) {
			saveError = error instanceof Error ? error.message : 'Unable to save society changes.';
		} finally {
			saving = false;
		}
	};
</script>

<svelte:head>
	<title>Edit Society | Stokvel</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6">
	<a class="w-fit text-sm font-semibold underline" href={`/societies/${societyId}`}>Back to details</a>

	<Card class="space-y-4 bg-surface-lowest">
		<h1 class="text-2xl font-bold text-ink">Edit society</h1>

		{#if !$authState.isAuthResolved}
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Checking your session...</p>
		{:else if !$authState.user}
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Sign in to edit this society.</p>
			<a class="text-sm font-semibold underline" href="/sign-in">Go to sign in</a>
		{:else if loading}
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Loading society...</p>
		{:else if loadError}
			<p class="text-sm text-[rgb(138_0_0)]">{loadError}</p>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2 sm:col-span-2">
					<label class="text-sm font-medium" for="name">Society name</label>
					<Input id="name" name="name" bind:value={form.name} aria-invalid={Boolean(formErrors.name)} />
					{#if formErrors.name}
						<p class="text-sm text-[rgb(138_0_0)]">{formErrors.name}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium" for="amount">Contribution amount</label>
					<Input
						id="amount"
						name="amount"
						type="number"
						min="1"
						bind:value={form.amount}
						aria-invalid={Boolean(formErrors.amount)}
					/>
					{#if formErrors.amount}
						<p class="text-sm text-[rgb(138_0_0)]">{formErrors.amount}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium" for="interval">Contribution interval</label>
					<select
						id="interval"
						name="interval"
						bind:value={form.interval}
						class="h-12 w-full rounded-[16px] bg-surface-low px-4 text-[0.95rem] text-ink outline-none ghost-outline"
						aria-invalid={Boolean(formErrors.interval)}
					>
						{#each SOCIETY_INTERVALS as interval (interval)}
							<option value={interval}>{intervalLabelMap[interval]}</option>
						{/each}
					</select>
					{#if formErrors.interval}
						<p class="text-sm text-[rgb(138_0_0)]">{formErrors.interval}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium" for="max-members">Maximum members</label>
					<Input
						id="max-members"
						name="max-members"
						type="number"
						min="2"
						bind:value={form.maxMembers}
						aria-invalid={Boolean(formErrors.maxMembers)}
					/>
					{#if formErrors.maxMembers}
						<p class="text-sm text-[rgb(138_0_0)]">{formErrors.maxMembers}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium" for="start-date">Start date</label>
					<Input
						id="start-date"
						name="start-date"
						type="date"
						bind:value={form.startDate}
						aria-invalid={Boolean(formErrors.startDate)}
					/>
					{#if formErrors.startDate}
						<p class="text-sm text-[rgb(138_0_0)]">{formErrors.startDate}</p>
					{/if}
				</div>
			</div>

			{#if saveError}
				<p class="rounded-[12px] bg-[rgb(255_230_230)] px-3 py-2 text-sm text-[rgb(138_0_0)]">
					{saveError}
				</p>
			{/if}

			<div class="flex flex-wrap gap-3">
				<Button onclick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
				<a class="inline-flex items-center text-sm font-semibold underline" href={`/societies/${societyId}`}>
					Cancel
				</a>
			</div>
		{/if}
	</Card>
</main>
