<script lang="ts">
	import type { Transition } from '$lib/engine';

	interface Props {
		transition: Transition;
	}

	let { transition }: Props = $props();

	// Simple color based on quality - very subtle
	const qualityColor = $derived(
		transition.quality === 'excellent' || transition.quality === 'good'
			? 'text-neutral-500'
			: transition.quality === 'fair'
				? 'text-neutral-500'
				: 'text-neutral-600'
	);
</script>

<span class="text-xs {qualityColor}">
	{transition.bpmDifference > 0 ? '+' : ''}{transition.bpmDifference.toFixed(0)} BPM
</span>
