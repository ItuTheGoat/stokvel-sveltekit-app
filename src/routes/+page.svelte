<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';

	const highlights = [
		{
			title: 'Adaptive Savings Pots',
			description: 'Create focused goals with clear contribution nudges and fast progress scans.'
		},
		{
			title: 'Cycle Visibility',
			description: 'Track contribution windows, reminders and payout timing without noisy separators.'
		},
		{
			title: 'Member-first Clarity',
			description: 'Keep status, intent and next action grouped in breathable cards and tonal depth.'
		}
	];
</script>

<svelte:head>
	<title>Design Token Showcase</title>
</svelte:head>

<div class="relative min-h-screen overflow-hidden bg-surface">
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_5%,rgb(26_35_126_/_10%),transparent_42%),radial-gradient(circle_at_90%_10%,rgb(252_212_0_/_18%),transparent_36%),linear-gradient(180deg,var(--color-surface-container-lowest),var(--color-surface))]"
	></div>

	<div class="glass-surface ghost-outline sticky top-0 z-10">
		<div class="mx-auto flex h-12 max-w-5xl items-center px-4 sm:px-6">
			<p class="text-xs font-medium tracking-[0.08em] text-[rgb(27_27_31_/_72%)] uppercase">
				Compact Showcase Surface
			</p>
		</div>
	</div>

	<main class="relative z-0 mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 text-ink sm:px-6 sm:py-8">
		<section class="rounded-[16px] bg-surface-low p-5 shadow-ambient sm:p-7">
			<header class="space-y-2">
				<p class="text-xs font-semibold tracking-[0.08em] text-[rgb(27_27_31_/_64%)] uppercase">
					Display headline
				</p>
				<h1 class="text-3xl leading-tight font-extrabold sm:text-4xl">
					Tonal UI foundation for stokvel workflows
				</h1>
				<h2 class="text-xl leading-tight font-semibold sm:text-2xl">Title style: compact and directional</h2>
				<p class="max-w-3xl text-sm leading-6 text-[rgb(27_27_31_/_78%)] sm:text-base">
					Body copy keeps clarity first by pairing concise messaging with layered surfaces, accessible
					contrast and spacing-led grouping.
				</p>
			</header>
		</section>

		<section aria-labelledby="button-variants-heading" class="rounded-[16px] bg-surface-lowest p-5 shadow-ambient sm:p-7">
			<h2 id="button-variants-heading" class="text-lg font-bold">Button variants</h2>
			<div class="mt-4 flex flex-wrap items-center gap-3">
				<Button>Primary</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="tertiary">Tertiary</Button>
				<Button variant="ghost">Ghost</Button>
			</div>
		</section>

		<section aria-labelledby="input-field-heading" class="rounded-[16px] bg-surface-high p-5 shadow-ambient sm:p-7">
			<h2 id="input-field-heading" class="text-lg font-bold">Input field</h2>
			<div class="mt-4 max-w-xl space-y-2">
				<label for="contribution-name" class="text-sm font-medium">Contribution label</label>
				<Input
					id="contribution-name"
					name="contribution-name"
					placeholder="e.g. Winter groceries pot"
					aria-describedby="contribution-name-help"
				/>
				<p id="contribution-name-help" class="text-sm text-[rgb(27_27_31_/_70%)]">
					Use a short, specific label so members can identify this contribution quickly.
				</p>
			</div>
		</section>

		<section aria-labelledby="card-list-heading" class="space-y-3">
			<h2 id="card-list-heading" class="text-lg font-bold">Card list (spacing only)</h2>
			<div class="space-y-[var(--spacing-list-gap)]">
				{#each highlights as item (item.title)}
					<Card ghostOutline class="bg-surface-lowest p-5">
						<h3 class="text-base font-semibold">{item.title}</h3>
						<p class="mt-1 text-sm leading-6 text-[rgb(27_27_31_/_75%)]">{item.description}</p>
					</Card>
				{/each}
			</div>
		</section>
	</main>
</div>
