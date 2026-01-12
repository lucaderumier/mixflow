<script lang="ts">
	import { tracks } from '$lib/stores';
	import type { Track } from '$lib/engine';

	interface Props {
		track: Track;
		showRemove?: boolean;
		index?: number;
	}

	let { track, showRemove = true, index }: Props = $props();

	function formatBpm(bpm: number | null): string {
		if (bpm === null) return '—';
		return bpm.toFixed(0);
	}

	function handleRemove() {
		tracks.removeTrack(track.id);
	}

	function handleRetry() {
		tracks.analyzeSingle(track.id);
	}

	// Remove file extension from filename for cleaner display
	const displayName = $derived(track.filename.replace(/\.[^/.]+$/, ''));
</script>

<div class="group flex items-center gap-4 border-b border-neutral-800/50 px-4 py-3 transition-colors hover:bg-neutral-900/50">
	<!-- Index number (if provided) -->
	{#if index !== undefined}
		<span class="w-6 text-sm text-neutral-600">{index + 1}</span>
	{/if}

	<!-- Track name -->
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm text-neutral-300" title={track.filename}>
			{displayName}
		</p>
		{#if track.status === 'analyzing'}
			<p class="text-xs text-neutral-500">Analyzing...</p>
		{:else if track.status === 'error'}
			<button onclick={handleRetry} class="text-xs text-neutral-500 hover:text-neutral-400">
				Failed — click to retry
			</button>
		{/if}
	</div>

	<!-- BPM -->
	<span class="w-12 text-right text-sm text-neutral-500">
		{formatBpm(track.bpm)}
	</span>

	<!-- Key -->
	<span class="w-10 text-right text-sm text-neutral-500">
		{track.camelotKey ?? '—'}
	</span>

	<!-- Remove button -->
	{#if showRemove}
		<button
			onclick={handleRemove}
			class="opacity-0 transition-opacity group-hover:opacity-100"
			aria-label="Remove track"
		>
			<svg class="h-4 w-4 text-neutral-600 hover:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	{/if}
</div>
