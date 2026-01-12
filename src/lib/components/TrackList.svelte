<script lang="ts">
	import { tracks, trackStats, isAnalyzing } from '$lib/stores';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import { LoaderCircle, Download } from '@lucide/svelte';

	let isMixing = $state(false);

	async function handleMix() {
		isMixing = true;
		try {
			await tracks.mix();
		} finally {
			isMixing = false;
		}
	}

	function handleClear() {
		tracks.clear();
	}

	function getDisplayName(filename: string): string {
		// Remove extension from filename
		const lastDot = filename.lastIndexOf('.');
		return lastDot > 0 ? filename.substring(0, lastDot) : filename;
	}

	function handleExport() {
		// Generate CSV content
		const headers = ['Order', 'Name', 'BPM', 'Key', 'Camelot', 'Status'];
		const rows = sortedTracks.map((track) => [
			track.mixOrder?.toString() ?? '',
			getDisplayName(track.filename),
			track.bpm?.toString() ?? '',
			track.key ?? '',
			track.camelotKey ?? '',
			track.mixStatus === 'mixed' ? 'Mixed' : track.mixStatus === 'orphan' ? 'Orphan' : track.status
		]);

		const csvContent = [
			headers.join(','),
			...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
		].join('\n');

		// Create and download file
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `mixflow-playlist-${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	// Check if there are any analyzed tracks to export
	const canExport = $derived($trackStats.complete > 0);

	// Sort tracks by mixOrder if they have one, otherwise keep original order
	const sortedTracks = $derived(
		[...$tracks].sort((a, b) => {
			// If both have mixOrder, sort by that
			if (a.mixOrder !== null && b.mixOrder !== null) {
				return a.mixOrder - b.mixOrder;
			}
			// Mixed tracks come first
			if (a.mixOrder !== null) return -1;
			if (b.mixOrder !== null) return 1;
			// Keep original order for non-mixed tracks
			return 0;
		})
	);
</script>

<div class="flex min-h-screen flex-col bg-black p-6">
	<!-- Table container with visible edges -->
	<div class="mx-auto w-full max-w-5xl flex-1">
		<div class="overflow-hidden rounded-lg border border-neutral-800">
			<Table.Root>
				<Table.Header>
					<Table.Row class="border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900/50">
						<Table.Head class="w-16 text-neutral-500">Order</Table.Head>
						<Table.Head class="text-neutral-500">Name</Table.Head>
						<Table.Head class="w-20 text-right text-neutral-500">BPM</Table.Head>
						<Table.Head class="w-24 text-right text-neutral-500">Key</Table.Head>
						<Table.Head class="w-16 text-right text-neutral-500">Camelot</Table.Head>
						<Table.Head class="w-28 text-right text-neutral-500">Status</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each sortedTracks as track (track.id)}
						<Table.Row class="border-neutral-800/50 hover:bg-neutral-800/30">
							<!-- Order -->
							<Table.Cell class="font-mono text-neutral-600">
								{#if track.mixOrder !== null}
									{track.mixOrder}
								{:else}
									—
								{/if}
							</Table.Cell>

							<!-- Name -->
							<Table.Cell class="font-medium text-neutral-300">
								{getDisplayName(track.filename)}
							</Table.Cell>

							<!-- BPM -->
							<Table.Cell class="text-right font-mono text-neutral-400">
								{#if track.bpm !== null}
									{track.bpm.toFixed(0)}
								{:else}
									—
								{/if}
							</Table.Cell>

							<!-- Key (musical notation) -->
							<Table.Cell class="text-right text-neutral-400">
								{#if track.key !== null}
									{track.key}
								{:else}
									—
								{/if}
							</Table.Cell>

							<!-- Camelot Key -->
							<Table.Cell class="text-right font-mono text-neutral-400">
								{#if track.camelotKey !== null}
									{track.camelotKey}
								{:else}
									—
								{/if}
							</Table.Cell>

							<!-- Status -->
							<Table.Cell class="text-right">
								{#if track.status === 'analyzing'}
									<Badge variant="secondary" class="bg-neutral-800/80 text-neutral-300">
										<LoaderCircle class="mr-1 size-3 animate-spin" />
										Analyzing
									</Badge>
								{:else if track.status === 'error'}
									<Badge class="bg-rose-500/20 text-rose-400 hover:bg-rose-500/20">
										Error
									</Badge>
								{:else if track.mixStatus === 'mixed'}
									<Badge class="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20">
										Mixed
									</Badge>
								{:else if track.mixStatus === 'orphan'}
									<Badge class="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20">
										Orphan
									</Badge>
								{:else if track.status === 'complete'}
									<Badge class="bg-sky-500/20 text-sky-400 hover:bg-sky-500/20">
										Metadata
									</Badge>
								{:else}
									<Badge variant="outline" class="border-neutral-700 text-neutral-500">
										Pending
									</Badge>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		<!-- Footer outside the table -->
		<div class="mt-4 flex items-center justify-between">
			<span class="text-sm text-neutral-500">
				{$trackStats.total} song{$trackStats.total !== 1 ? 's' : ''}
				{#if $isAnalyzing}
					<span class="ml-2 text-neutral-600">
						— Analyzing {$trackStats.complete + 1}/{$trackStats.total}
					</span>
				{/if}
			</span>

			<div class="flex items-center gap-2">
				<Button
					variant="ghost"
					onclick={handleClear}
					disabled={isMixing}
					class="text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-400"
				>
					Clear
				</Button>

				<Button
					variant="ghost"
					onclick={handleExport}
					disabled={!canExport}
					class="text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-400"
				>
					<Download class="mr-2 size-4" />
					Export
				</Button>

				<Button
					onclick={handleMix}
					disabled={isMixing || $trackStats.total < 2}
					class="border border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800/50 hover:text-neutral-300"
				>
					{#if isMixing}
						<LoaderCircle class="mr-2 size-4 animate-spin" />
						Mixing...
					{:else}
						Mix
					{/if}
				</Button>
			</div>
		</div>
	</div>
</div>
