# Contributing to MixFlow

Thank you for your interest in contributing to MixFlow! This document provides guidelines and information for contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mixflow.git
   cd mixflow
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Development Workflow

### Before Making Changes

- Check existing [issues](https://github.com/lucaderumier/mixflow/issues) to see if your idea is already being discussed
- For new features, consider opening an issue first to discuss the approach

### Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the code style guidelines below

3. Run tests and checks:
   ```bash
   npm run test        # Run tests
   npm run lint        # Check for linting issues
   npm run check       # TypeScript type checking
   npm run build       # Ensure it builds
   ```

4. Commit your changes with a clear message:
   ```bash
   git commit -m "Add feature: description of what you added"
   ```

### Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request against the `main` branch

3. In your PR description:
   - Describe what the change does
   - Reference any related issues
   - Include screenshots for UI changes

## Code Style Guidelines

### TypeScript

- Use explicit return types for public functions
- Prefer `const` over `let` when variables won't be reassigned
- Use descriptive variable names

```typescript
// Good
export function calculateBpmDifference(trackA: Track, trackB: Track): number {
  const difference = Math.abs(trackA.bpm - trackB.bpm);
  return difference;
}

// Avoid
export function calcBpm(a: Track, b: Track) {
  return Math.abs(a.bpm - b.bpm);
}
```

### Svelte Components

- Use TypeScript in components (`<script lang="ts">`)
- Keep logic in `<script>`, not in templates
- Use semantic HTML elements

### Tailwind CSS

- Group related utilities logically
- Prefer component extraction over `@apply` for repeated patterns

## Project Structure

```
src/
├── lib/
│   ├── engine/          # Pure logic (Camelot wheel, ordering algorithm)
│   ├── audio/           # Audio analysis (Essentia.js worker)
│   ├── components/      # Svelte UI components
│   │   └── ui/          # shadcn-svelte base components
│   └── stores/          # Svelte stores for state management
└── routes/              # SvelteKit pages
```

### Key Files

- `src/lib/engine/camelot.ts` - Camelot wheel logic and key conversion
- `src/lib/engine/ordering.ts` - Track ordering algorithm
- `src/lib/audio/analyzer.ts` - Main audio analysis interface
- `src/lib/audio/key-worker.ts` - Web Worker for Essentia.js analysis
- `src/lib/stores/tracks.ts` - Track state management

## Testing

We use Vitest for testing. Tests are located alongside the source files.

```bash
npm run test          # Run tests in watch mode
npm run test:unit     # Run tests once
```

When adding new features:
- Add tests for new utility functions in `engine/`
- Test edge cases (empty inputs, invalid data, etc.)

## Types of Contributions

### Bug Fixes

- Check if the bug is already reported in issues
- Include steps to reproduce in your PR

### New Features

Ideas we'd love help with:
- Manual BPM/key override UI
- Additional export formats (M3U, JSON)
- Drag-and-drop track reordering
- Audio preview/playback
- Improved mobile experience

### Documentation

- Fix typos or unclear explanations
- Add examples or tutorials
- Translate documentation

### Performance

- Optimize audio analysis
- Reduce bundle size
- Improve load times

## Questions?

Feel free to open an issue for any questions about contributing. We're happy to help!

## License

By contributing to MixFlow, you agree that your contributions will be licensed under the MIT License.
