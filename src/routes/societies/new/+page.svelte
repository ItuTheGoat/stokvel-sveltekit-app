<script lang="ts">
	import { goto } from '$app/navigation';
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
		createSocietyWithCreatorAdminMembership,
		getContributionDueDescription,
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
		type: SOCIETY_TYPES[0],
		description: '',
		amount: 0,
		contributionDuePreset: DEFAULT_DUE_PRESET,
		contributionDueOtherDetail: '',
		maxMembers: 2,
		startDate: '',
		endDate: ''
	});

	const isStepOneValid = $derived(Boolean(form.name.trim()));
	const placeholderName = $derived(form.name.trim() || 'placeholder');
	const stepTwoValidation = $derived(validateSocietyForm({ ...form, name: placeholderName }));
	const isStepTwoValid = $derived(
		!stepTwoValidation.amount &&
			!stepTwoValidation.contributionDuePreset &&
			!stepTwoValidation.contributionDueOtherDetail &&
			!stepTwoValidation.maxMembers &&
			!stepTwoValidation.startDate &&
			!stepTwoValidation.endDate
	);
	const canSubmit = $derived(isStepOneValid && isStepTwoValid && !submitting);
	const parsedStartDate = $derived(parseDateInput(form.startDate));
	const parsedEndDate = $derived(parseDateInput(form.endDate));
	const reviewDueDescription = $derived(
		getContributionDueDescription({
			contributionDuePreset: form.contributionDuePreset,
			contributionDueOtherDetail: form.contributionDueOtherDetail
		})
	);

	const setFieldError = (field: keyof SocietyFormInput, message?: string) => {
		formErrors = { ...formErrors, [field]: message };
	};

	const validateCurrentStep = () => {
		if (step === 1) {
			const hasName = Boolean(form.name.trim());
			const hasType = SOCIETY_TYPES.includes(form.type);
			setFieldError('name', hasName ? undefined : 'Society name is required.');
			setFieldError('type', hasType ? undefined : 'Society type is required.');
			return hasName && hasType;
		}

		if (step === 2) {
			const errors = validateSocietyForm({ ...form, name: placeholderName });
			formErrors = { ...formErrors, ...errors };
			return (
				!errors.amount &&
				!errors.contributionDuePreset &&
				!errors.contributionDueOtherDetail &&
				!errors.maxMembers &&
				!errors.startDate &&
				!errors.endDate
			);
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

		if (!parsedStartDate || !parsedEndDate) {
			submitError = 'Start date and end date are required.';
			return;
		}

		submitting = true;
		try {
			const result = await createSocietyWithCreatorAdminMembership({
				name: form.name,
				type: form.type,
				description: form.description,
				creatorId: user.uid,
				creatorDisplayName: user.displayName ?? user.email ?? 'New member',
				amount: form.amount,
				contributionDuePreset: form.contributionDuePreset,
				contributionDueOtherDetail: form.contributionDueOtherDetail,
				maxMembers: form.maxMembers,
				startDate: parsedStartDate,
				endDate: parsedEndDate
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
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2 sm:col-span-2">
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
				</div>
			{:else if step === 2}
				<div class="grid gap-4 sm:grid-cols-2">
					<p class="text-sm text-[rgb(27_27_31_/_75%)] sm:col-span-2">
						Contributions run on a monthly schedule. Set how much each member pays per month and when
						that amount is due.
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
						<label class="text-sm font-medium" for="max-members">Maximum members (including you)</label>
						<Input
							id="max-members"
							name="max-members"
							type="number"
							min="2"
							bind:value={form.maxMembers}
							aria-invalid={Boolean(formErrors.maxMembers)}
						/>
						<p class="text-sm text-[rgb(27_27_31_/_75%)]">
							This total includes you as the society admin.
						</p>
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
			{:else}
				<div class="space-y-3 text-sm">
					<p class="text-[rgb(27_27_31_/_75%)]">Review your society before creating it.</p>
					<div class="grid gap-2 rounded-[12px] bg-surface-low p-4 sm:grid-cols-2">
						<p><span class="font-semibold">Name:</span> {form.name}</p>
						<p><span class="font-semibold">Type:</span> {form.type}</p>
						<p class="sm:col-span-2"><span class="font-semibold">Description:</span> {form.description || '-'}</p>
						<p><span class="font-semibold">Amount (monthly):</span> {form.amount.toLocaleString()}</p>
						<p><span class="font-semibold">Schedule:</span> Monthly</p>
						<p class="sm:col-span-2"><span class="font-semibold">Due:</span> {reviewDueDescription}</p>
						<p><span class="font-semibold">Max members (including you):</span> {form.maxMembers}</p>
						<p class="sm:col-span-2">
							<span class="font-semibold">Start date:</span>
							{parsedStartDate ? parsedStartDate.toLocaleDateString() : form.startDate}
						</p>
						<p class="sm:col-span-2">
							<span class="font-semibold">End date:</span>
							{parsedEndDate ? parsedEndDate.toLocaleDateString() : form.endDate}
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
