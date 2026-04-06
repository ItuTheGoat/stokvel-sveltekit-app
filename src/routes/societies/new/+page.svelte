<script lang="ts">
	import { goto } from '$app/navigation';
	import { authState } from '$lib/auth';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		SOCIETY_INTERVALS,
		createSocietyWithCreatorAdminMembership,
		parseDateInput,
		validateSocietyForm,
		type SocietyFormErrors,
		type SocietyFormInput
	} from '$lib/societies';

	let step = $state(1);
	let submitting = $state(false);
	let submitError = $state<string | null>(null);
	let formErrors = $state<SocietyFormErrors>({});
	let form = $state<SocietyFormInput>({
		name: '',
		amount: 0,
		interval: SOCIETY_INTERVALS[0],
		maxMembers: 2,
		startDate: ''
	});

	const intervalLabelMap = {
		weekly: 'Weekly',
		monthly: 'Monthly',
		quarterly: 'Quarterly'
	} satisfies Record<(typeof SOCIETY_INTERVALS)[number], string>;

	const isStepOneValid = $derived(Boolean(form.name.trim()));
	const isStepTwoValid = $derived(
		!validateSocietyForm({
			...form,
			name: form.name.trim() || 'placeholder'
		}).amount &&
			!validateSocietyForm({
				...form,
				name: form.name.trim() || 'placeholder'
			}).interval &&
			!validateSocietyForm({
				...form,
				name: form.name.trim() || 'placeholder'
			}).maxMembers &&
			!validateSocietyForm({
				...form,
				name: form.name.trim() || 'placeholder'
			}).startDate
	);
	const canSubmit = $derived(isStepOneValid && isStepTwoValid && !submitting);
	const parsedStartDate = $derived(parseDateInput(form.startDate));

	const setFieldError = (field: keyof SocietyFormInput, message?: string) => {
		formErrors = { ...formErrors, [field]: message };
	};

	const validateCurrentStep = () => {
		if (step === 1) {
			const hasName = Boolean(form.name.trim());
			setFieldError('name', hasName ? undefined : 'Society name is required.');
			return hasName;
		}

		if (step === 2) {
			const errors = validateSocietyForm({ ...form, name: form.name.trim() || 'placeholder' });
			formErrors = { ...formErrors, ...errors };
			return !errors.amount && !errors.interval && !errors.maxMembers && !errors.startDate;
		}

		return true;
	};

	const nextStep = () => {
		submitError = null;
		if (!validateCurrentStep()) return;
		if (step < 3) step += 1;
	};

	const previousStep = () => {
		submitError = null;
		if (step > 1) step -= 1;
	};

	const submit = async () => {
		submitError = null;
		const validationErrors = validateSocietyForm(form);
		formErrors = validationErrors;

		if (Object.keys(validationErrors).length > 0) {
			step = validationErrors.name ? 1 : 2;
			return;
		}

		const user = $authState.user;
		if (!user) {
			submitError = 'Please sign in to create a society.';
			return;
		}

		if (!parsedStartDate) {
			submitError = 'Start date is required.';
			return;
		}

		submitting = true;
		try {
			const result = await createSocietyWithCreatorAdminMembership({
				name: form.name,
				creatorId: user.uid,
				creatorDisplayName: user.displayName ?? user.email ?? 'New member',
				amount: form.amount,
				interval: form.interval,
				maxMembers: form.maxMembers,
				startDate: parsedStartDate
			});
			await goto(`/societies/${result.societyId}`);
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Unable to create society.';
		} finally {
			submitting = false;
		}
	};
</script>

<svelte:head>
	<title>Create Society | Stokvel</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6">
	<Card class="space-y-6 bg-surface-lowest">
		<header class="space-y-1">
			<p class="text-sm text-[rgb(27_27_31_/_72%)]">Step {step} of 3</p>
			<h1 class="text-2xl font-bold text-ink">Create a society</h1>
		</header>

		{#if !$authState.isAuthResolved}
			<p class="text-sm text-[rgb(27_27_31_/_75%)]">Checking your session...</p>
		{:else if !$authState.user}
			<p class="rounded-[12px] bg-[rgb(255_230_230)] px-3 py-2 text-sm text-[rgb(138_0_0)]">
				You need to be signed in to create a society.
			</p>
			<a class="text-sm font-semibold underline" href="/sign-in">Go to sign in</a>
		{:else}
			{#if step === 1}
				<div class="space-y-2">
					<label class="text-sm font-medium" for="society-name">Society name</label>
					<Input
						id="society-name"
						name="society-name"
						placeholder="e.g. December Grocery Pot"
						bind:value={form.name}
						aria-invalid={Boolean(formErrors.name)}
					/>
					{#if formErrors.name}
						<p class="text-sm text-[rgb(138_0_0)]">{formErrors.name}</p>
					{/if}
				</div>
			{:else if step === 2}
				<div class="grid gap-4 sm:grid-cols-2">
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
			{:else}
				<div class="space-y-3 text-sm">
					<p class="text-[rgb(27_27_31_/_75%)]">Review your society before creating it.</p>
					<div class="grid gap-2 rounded-[12px] bg-surface-low p-4 sm:grid-cols-2">
						<p><span class="font-semibold">Name:</span> {form.name}</p>
						<p><span class="font-semibold">Amount:</span> {form.amount.toLocaleString()}</p>
						<p><span class="font-semibold">Interval:</span> {intervalLabelMap[form.interval]}</p>
						<p><span class="font-semibold">Max members:</span> {form.maxMembers}</p>
						<p class="sm:col-span-2">
							<span class="font-semibold">Start date:</span>
							{parsedStartDate ? parsedStartDate.toLocaleDateString() : form.startDate}
						</p>
					</div>
				</div>
			{/if}

			{#if submitError}
				<p class="rounded-[12px] bg-[rgb(255_230_230)] px-3 py-2 text-sm text-[rgb(138_0_0)]">
					{submitError}
				</p>
			{/if}

			<div class="flex flex-wrap gap-3">
				{#if step > 1}
					<Button variant="tertiary" onclick={previousStep} disabled={submitting}>Back</Button>
				{/if}
				{#if step < 3}
					<Button onclick={nextStep} disabled={step === 1 ? !isStepOneValid : !isStepTwoValid}>Next</Button>
				{:else}
					<Button onclick={submit} disabled={!canSubmit}>
						{submitting ? 'Creating society...' : 'Create society'}
					</Button>
				{/if}
				<a class="inline-flex items-center text-sm font-semibold underline" href="/societies">Cancel</a>
			</div>
		{/if}
	</Card>
</main>
