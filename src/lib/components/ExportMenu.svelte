<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { ordering } from '$lib/stores';
	import { toast } from 'svelte-sonner';
	import type { Track } from '$lib/engine';

	function generateM3U(tracks: Track[]): string {
		const lines = ['#EXTM3U'];
		for (const track of tracks) {
			const duration = track.duration ? Math.round(track.duration) : -1;
			const title = track.filename.replace(/\.[^/.]+$/, '');
			lines.push(`#EXTINF:${duration},${title}`);
			lines.push(track.filename);
		}
		return lines.join('\n');
	}

	function generateText(tracks: Track[]): string {
		return tracks
			.map((track, i) => {
				const bpm = track.bpm?.toFixed(0) ?? '?';
				const key = track.camelotKey ?? '?';
				return `${i + 1}. ${track.filename.replace(/\.[^/.]+$/, '')} [${bpm} BPM, ${key}]`;
			})
			.join('\n');
	}

	function generateCSV(tracks: Track[]): string {
		const headers = ['Order', 'Filename', 'BPM', 'Key'];
		const rows = tracks.map((track, i) => [
			i + 1,
			`"${track.filename}"`,
			track.bpm?.toFixed(0) ?? '',
			track.camelotKey ?? ''
		]);
		return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
	}

	function downloadFile(content: string, filename: string, mimeType: string) {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	async function copyToClipboard(content: string) {
		try {
			await navigator.clipboard.writeText(content);
			toast.success('Copied to clipboard');
		} catch {
			toast.error('Failed to copy');
		}
	}

	function handleExportM3U() {
		if (!$ordering) return;
		downloadFile(generateM3U($ordering.orderedTracks), 'playlist.m3u', 'audio/x-mpegurl');
		toast.success('Downloaded');
	}

	function handleExportText() {
		if (!$ordering) return;
		downloadFile(generateText($ordering.orderedTracks), 'playlist.txt', 'text/plain');
		toast.success('Downloaded');
	}

	function handleExportCSV() {
		if (!$ordering) return;
		downloadFile(generateCSV($ordering.orderedTracks), 'playlist.csv', 'text/csv');
		toast.success('Downloaded');
	}

	function handleCopy() {
		if (!$ordering) return;
		copyToClipboard(generateText($ordering.orderedTracks));
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<button class="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-700">
			Export
		</button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-40 border-neutral-800 bg-neutral-900">
		<DropdownMenu.Item onclick={handleExportM3U} class="text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300">
			M3U Playlist
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={handleExportText} class="text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300">
			Text File
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={handleExportCSV} class="text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300">
			CSV File
		</DropdownMenu.Item>
		<DropdownMenu.Separator class="bg-neutral-800" />
		<DropdownMenu.Item onclick={handleCopy} class="text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300">
			Copy to Clipboard
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
