<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authState } from '$lib/auth';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		DEFAULT_DUE_PRESET,
		DUE_PRESET_LABELS,
		MAX_DUE_DETAIL_LENGTH,
		SOCIETY_DUE_PRESETS,
		SOCIETY_TYPES,
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
		type: SOCIETY_TYPES[0],
		description: '',
		amount: 0,
		contributionDuePreset: DEFAULT_DUE_PRESET,
		contributionDueOtherDetail: '',
		maxMembers: 2,
		startDate: '',
		endDate: ''
	});

	const societyId = $derived(page.params.societyId ?? '');

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
				type: society.type,
				description: society.description ?? '',
				amount: society.rules.amount,
				contributionDuePreset: society.rules.contributionDuePreset,
				contributionDueOtherDetail: society.rules.contributionDueOtherDetail,
				maxMembers: society.rules.maxMembers,
				startDate: society.rules.startDate.toDate().toISOString().split('T')[0],
				endDate: society.rules.endDate.toDate().toISOString().split('T')[0]
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

		const parsedStartDate = parseDateInput(form.startDate);
		const parsedEndDate = parseDateInput(form.endDate);
		if (!parsedStartDate || !parsedEndDate) {
			formErrors = {
				...formErrors,
				startDate: parsedStartDate ? undefined : 'Start date is required.',
				endDate: parsedEndDate ? undefined : 'End date is required.'
			};
			return;
		}

		saving = true;
		try {
			await updateSocietyById(societyId, {
				name: form.name,
				type: form.type,
				description: form.description,
				amount: form.amount,
				contributionDuePreset: form.contributionDuePreset,
				contributionDueOtherDetail: form.contributionDueOtherDetail,
				maxMembers: form.maxMembers,
				startDate: parsedStartDate,
				endDate: parsedEndDate
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
					<label class="text-sm font-medium" for="type">Society type</label>
					<select
						id="type"
						name="type"
						bind:value={form.type}
						class="h-12 w-full rounded-[16px] bg-surface-low px-4 text-[0.95rem] text-ink outline-none ghost-outline"
						aria-invalid={Boolean(formErrors.type)}
					>
						{#each SOCIETY_TYPES as societyType (societyType)}
							<option value={societyType}>{societyType}</option>
						{/each}
					</select>
					{#if formErrors.type}
						<p class="text-sm text-[rgb(138_0_0)]">{formErrors.type}</p>
					{/if}
				</div>
				<div class="space-y-2 sm:col-span-2">
					<label class="text-sm font-medium" for="description">Description (optional)</label>
					<textarea
						id="description"
						name="description"
						rows="3"
						maxlength="160"
						bind:value={form.description}
						class="w-full rounded-[16px] bg-surface-low px-4 py-3 text-[0.95rem] text-ink outline-none ghost-outline"
						placeholder="A short note about this society"
						aria-invalid={Boolean(formErrors.description)}
					></textarea>
					{#if formErrors.description}
						<p class="text-sm text-[rgb(138_0_0)]">{formErrors.description}</p>
					{/if}
				</div>

				<p class="text-sm text-[rgb(27_27_31_/_75%)] sm:col-span-2">
					Contributions run on a monthly schedule. Set the per-member monthly amount and when it is due.
				</p>

				<div class="space-y-2">
					<label class="text-sm font-medium" for="amount">Contribution amount (per month)</label>
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

				<div class="space-y-2 sm:col-span-2">
					<fieldset class="space-y-2">
						<legend class="text-sm font-medium">Contribution due date</legend>
						<div class="grid gap-2 sm:grid-cols-2">
							{#each SOCIETY_DUE_PRESETS as preset (preset)}
								<label class="flex items-center gap-2 text-sm text-ink">
									<input
										type="radio"
										name="contribution-due-preset"
										value={preset}
										bind:group={form.contributionDuePreset}
									/>
									<span>{DUE_PRESET_LABELS[preset]}</span>
								</label>
							{/each}
						</div>
					</fieldset>
					{#if formErrors.contributionDuePreset}
						<p class="text-sm text-[rgb(138_0_0)]">{formErrors.contributionDuePreset}</p>
					{/if}
				</div>

				{#if form.contributionDuePreset === 'other'}
					<div class="space-y-2 sm:col-span-2">
						<label class="text-sm font-medium" for="contribution-due-other">Custom due date detail</label>
						<Input
							id="contribution-due-other"
							name="contribution-due-other"
							maxlength={MAX_DUE_DETAIL_LENGTH}
							placeholder="e.g. 15th of each month"
							bind:value={form.contributionDueOtherDetail}
							aria-invalid={Boolean(formErrors.contributionDueOtherDetail)}
						/>
						{#if formErrors.contributionDueOtherDetail}
							<p class="text-sm text-[rgb(138_0_0)]">{formErrors.contributionDueOtherDetail}</p>
						{/if}
					</div>
				{/if}

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
				<div class="space-y-2">
					<label class="text-sm font-medium" for="end-date">End date</label>
					<Input
						id="end-date"
						name="end-date"
						type="date"
						bind:value={form.endDate}
						aria-invalid={Boolean(formErrors.endDate)}
					/>
					{#if formErrors.endDate}
						<p class="text-sm text-[rgb(138_0_0)]">{formErrors.endDate}</p>
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
