<script lang="ts">
	import { tracks } from '$lib/stores';
	import { validateFiles, SUPPORTED_EXTENSIONS, MAX_FILES } from '$lib/audio';
	import { toast } from 'svelte-sonner';

	let isDragging = $state(false);
	let fileInput: HTMLInputElement;

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		const files = Array.from(e.dataTransfer?.files || []);
		processFiles(files);
	}

	function handleClick() {
		fileInput?.click();
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = Array.from(input.files || []);
		processFiles(files);
		input.value = '';
	}

	function processFiles(files: File[]) {
		if (files.length === 0) return;

		const { validFiles, errors, tooManyFiles } = validateFiles(files);

		for (const { file, error } of errors) {
			toast.error(`${file.name}: ${error}`);
		}

		if (tooManyFiles) {
			toast.warning(`Maximum ${MAX_FILES} files allowed. Some files were skipped.`);
		}

		if (validFiles.length > 0) {
			tracks.addFiles(validFiles);
			toast.success(`Added ${validFiles.length} file${validFiles.length > 1 ? 's' : ''}`);
		}
	}

	const formatsText = SUPPORTED_EXTENSIONS.map((ext) => ext.slice(1).toUpperCase()).join(', ');
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex min-h-screen flex-col items-center justify-center bg-black px-4"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<input
		bind:this={fileInput}
		type="file"
		accept={SUPPORTED_EXTENSIONS.join(',')}
		multiple
		class="hidden"
		onchange={handleFileSelect}
	/>

	<!-- Context menu styled dropzone -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={handleClick}
		class="w-full max-w-xs cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 shadow-lg transition-all {isDragging
			? 'border-neutral-500 bg-neutral-800'
			: 'hover:border-neutral-700 hover:bg-neutral-800/50'}"
	>
		<p class="text-center text-sm text-neutral-400">Drop files here or click to browse</p>
	</div>

	<!-- Supported formats text -->
	<div class="mt-6 text-center">
		<p class="text-xs text-neutral-500">Supported formats: {formatsText}</p>
		<p class="mt-1 text-xs text-neutral-600">Maximum {MAX_FILES} files, 100MB each</p>
	</div>
</div>
