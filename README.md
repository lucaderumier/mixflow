# MixFlow

An intelligent mixtape order generator that analyzes audio files and creates optimal track sequences based on BPM and harmonic key compatibility.

**Live at:** [mixflow.app](https://mixflow-three.vercel.app/)

![MixFlow Screenshot](docs/images/screenshot_mixflow.png)

## Features

- **BPM Detection** - Automatically detects tempo using Essentia.js audio analysis
- **Key Detection** - Identifies musical key and converts to Camelot notation
- **Smart Ordering** - Generates optimal track sequences based on harmonic compatibility
- **100% Client-Side** - Your audio files never leave your device
- **Export** - Download your playlist as CSV

## How It Works

MixFlow helps DJs, music producers, and playlist curators create smooth, professional-sounding mixtapes by:

1. **Analyzing** your audio files for BPM and musical key
2. **Converting** keys to Camelot notation for easy mixing
3. **Ordering** tracks so consecutive songs have:
   - Compatible BPM (within ±20 BPM)
   - Harmonically compatible keys (based on the Camelot wheel)

### The Camelot Wheel

The Camelot wheel arranges musical keys in a circle where adjacent keys mix well together:

- **Same key** (8B → 8B) - Perfect match
- **+1/-1 hour** (8B → 9B or 7B) - Energy shift
- **Inner/outer** (8B → 8A) - Relative minor/major

## Tech Stack

- **Framework:** SvelteKit
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Audio Analysis:** Essentia.js (WASM)
- **State:** Svelte stores with localStorage persistence

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/lucaderumier/mixflow.git
cd mixflow

# Install dependencies
npm install

# Start development server
npm run dev
```

### Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run test       # Run tests
npm run lint       # Run ESLint
npm run check      # Run TypeScript checks
npm run format     # Format code with Prettier
```

### Project Structure

```
src/
├── lib/
│   ├── engine/          # Core algorithms (Camelot, ordering)
│   ├── audio/           # Audio analysis (Essentia.js worker)
│   ├── components/      # Svelte UI components
│   └── stores/          # State management
└── routes/              # SvelteKit pages
```

## Supported Audio Formats

- MP3 (.mp3)
- WAV (.wav)
- AIFF (.aiff, .aif)
- FLAC (.flac)
- OGG (.ogg)
- M4A (.m4a)

**File size limit:** 100MB per file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript with explicit return types for public functions
- Follow existing patterns in the codebase
- Run `npm run lint` and `npm run check` before submitting

## Privacy

MixFlow runs entirely in your browser. Your audio files are:
- Never uploaded to any server
- Analyzed locally using WebAssembly
- Only stored in your browser's localStorage (metadata only)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Essentia.js](https://essentia.upf.edu/essentiajs/) for audio analysis
- [Mixed In Key](https://mixedinkey.com/) for Camelot wheel inspiration
- [shadcn-svelte](https://shadcn-svelte.com/) for UI components
