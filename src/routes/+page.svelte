<script lang="ts">
	import { FileDropzone, TrackList } from '$lib/components';
	import { tracks } from '$lib/stores';
</script>

<svelte:head>
	<title>Mixflow</title>
	<meta
		name="description"
		content="Analyze audio tracks and generate optimal set order based on BPM and key compatibility"
	/>
</svelte:head>

{#if $tracks.length > 0}
	<TrackList />
{:else}
	<FileDropzone />
{/if}
