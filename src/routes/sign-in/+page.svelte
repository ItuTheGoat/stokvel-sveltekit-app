<script lang="ts">
	import { authState, signInWithGoogle } from '$lib/auth';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';

	let localError = $state<string | null>(null);

	const handleGoogleSignIn = async () => {
		localError = null;
		try {
			await signInWithGoogle();
		} catch (error) {
			localError = error instanceof Error ? error.message : 'Unable to sign in with Google.';
		}
	};
</script>

<svelte:head>
	<title>Sign in | Stokvel</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-surface px-4 py-8">
	<Card class="w-full max-w-md space-y-5 bg-surface-lowest">
		<div class="space-y-2">
			<h1 class="text-2xl font-bold text-ink">Welcome back</h1>
			<p class="text-sm text-[rgb(27_27_31/75%)]">
				Sign in with Google to continue to your stokvel dashboard.
			</p>
		</div>

		{#if localError || $authState.error}
			<p class="rounded-[12px] bg-[rgb(255_230_230)] px-3 py-2 text-sm text-[rgb(138_0_0)]">
				{localError ?? $authState.error}
			</p>
		{/if}

		<Button class="w-full" onclick={handleGoogleSignIn} disabled={$authState.isLoading}>
			{$authState.isLoading ? 'Signing in...' : 'Continue with Google'}
		</Button>

		<p class="text-sm text-[rgb(27_27_31/75%)]">
			Need an account?
			<a class="font-semibold text-ink underline" href="/sign-up">Create one</a>
		</p>
	</Card>
</main>
