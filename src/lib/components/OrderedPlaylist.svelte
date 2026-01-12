<script lang="ts">
	import TrackCard from './TrackCard.svelte';
	import CompatibilityBadge from './CompatibilityBadge.svelte';
	import ExportMenu from './ExportMenu.svelte';
	import { ordering } from '$lib/stores';

	function handleBack() {
		ordering.clear();
	}
</script>

{#if $ordering}
	<div class="flex min-h-screen flex-col bg-black">
		<!-- Header -->
		<header class="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
			<div class="flex items-center gap-4">
				<span class="text-sm text-neutral-400">{$ordering.orderedTracks.length} tracks</span>
				{#if $ordering.orphanTracks.length > 0}
					<span class="text-xs text-neutral-600">
						{$ordering.orphanTracks.length} unplaced
					</span>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				<ExportMenu />
				<button
					onclick={handleBack}
					class="rounded-md px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-400"
				>
					Back
				</button>
			</div>
		</header>

		<!-- Column headers -->
		<div class="flex items-center gap-4 border-b border-neutral-800/50 px-4 py-2 text-xs text-neutral-600">
			<span class="w-6">#</span>
			<span class="flex-1">Name</span>
			<span class="w-12 text-right">BPM</span>
			<span class="w-10 text-right">Key</span>
		</div>

		<!-- Ordered track list -->
		<div class="flex-1 overflow-auto">
			{#each $ordering.orderedTracks as track, i (track.id)}
				<TrackCard {track} showRemove={false} index={i} />

				{#if i < $ordering.transitions.length}
					<div class="flex items-center justify-center py-1">
						<CompatibilityBadge transition={$ordering.transitions[i]} />
					</div>
				{/if}
			{/each}
		</div>

		<!-- Orphan tracks -->
		{#if $ordering.orphanTracks.length > 0}
			<div class="border-t border-neutral-800">
				<div class="px-4 py-2">
					<span class="text-xs text-neutral-600">Couldn't be placed</span>
				</div>
				{#each $ordering.orphanTracks as track (track.id)}
					<TrackCard {track} showRemove={false} />
				{/each}
			</div>
		{/if}
	</div>
{/if}
