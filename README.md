# Sara's Portfolio Web Application

A portfolio application built with React, TypeScript, and Tailwind CSS, implementing a clean hexagonal architecture pattern.

If you see something strange, no you did not. I am a Backend Engineer attempting to build a Frontend application 😛

Feel free to visit the application at [sararamon.netlify.app](https://sararamon.netlify.app/)

## 🎯 Features

- React 18, TypeScript and Tailwind CSS
- Hexagonal architecture
- Light, responsive design
- Home organised by sections
- Content managed without deploys (Netlify Blobs + Claude Code skills)
- Optimised images, adaptive video and GIFs as light loops

## 🏗️ Architecture

### Domain Layer
- Entities (`WorkItem`, `Section`, `MediaAsset`, `SiteIdentity`, …), no dependencies

### Application Layer
- Use-case hooks (`useWorkItems`, `useSections`, `useSiteIdentity`, …)

### Infrastructure Layer
- Ports and adapters: HTTP repositories over the content store, mocks for development

### Presentation Layer
- React components; media rendered per kind by `MediaView`

The media Edge Function and the content scripts follow the same layering.

### Folder Structure
```
src/
├── application/
│   ├── domain/
│   └── service/
├── infrastructure/
│   ├── ports/
│   ├── content/            # Stored format, validation, key-to-URL mapping
│   └── adapters/           # Http*, Mock*
├── presentation/
│   ├── hooks/
│   └── components/
│       └── media/          # ResponsiveImage, VideoPlayer, LoopVideo, MediaView
└── App.tsx                 # Wiring and routes

netlify/edge-functions/media/   # Serves /media/* and /content/* from Blobs
scripts/content/                # Content CLI: domain, application, infrastructure
.claude/skills/                 # Content skills
```

### Routes

| Path | Screen |
|---|---|
| `/` | Home: hero, section grid, about, contact |
| `/section/:id` | One section, with its projects one per row |
| `/work/:id` | One project, media full screen then text on scroll |

## 🚀 Getting Started

### Prerequisites
- Node.js 22.18+ (the content scripts run TypeScript directly)
- ffmpeg, only to publish videos and GIFs (`brew install ffmpeg`)

### Installation

```bash
# Install dependencies
npm install

# Start development server (placeholder content from the mock adapters)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

`npm run dev` serves mock content. Set `VITE_CONTENT_SOURCE=http` under `netlify dev`
to read the content store instead (a local, empty Blobs sandbox).

### Other scripts

| Script | Does |
|---|---|
| `npm run content -- <command>` | The content CLI; see [Managing content](#-managing-content) |
| `npm run test:tools` | Tests for the content use cases, with in-memory adapters |
| `npm run typecheck:tools` | Type-checks the scripts and the Edge Function |
| `npm run lint` | Lints the app, the scripts and the Edge Function |

## 🔒 Security & Best Practices

- No token in the browser bundle: Blobs are read server side
- Stored content is validated before use
- Content writes are conditional, so concurrent uploads cannot overwrite each other

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.js` to customize the color palette:

```javascript
colors: {
  site: {
    bg: '#ffffff',
    surface: '#f5f5f5',
    border: '#e5e5e5',
    text: { primary: '#0a0a0a', secondary: '#4a4a4a', muted: '#8a8a8a' },
  }
}
```

### Intro Splash

Shown once per tab, unless the visitor prefers reduced motion or there is no intro
animation. Replay it with `sessionStorage.removeItem('sara-intro-seen')`; change it
with `/set-site-identity`.

### Loop background

`LOOP_BACKGROUND` in `scripts/content/domain/mediaRules.ts` fills transparency in loops
and must match `site.bg` in `tailwind.config.js`.

### Mobile Navigation

Below `md`, `FullscreenMenu` replaces the header links. Its state lives in `App`, since
the overlay must be a sibling of the header to escape its stacking context.

## 📦 Deployment

Netlify, configured in `netlify.toml`:

- Lint gates the build
- Client-side routes fall back to `index.html`
- Commits touching only `docs/`, `.claude/`, `scripts/` or Markdown skip the build
- Deploy Previews cost no credits and show production content

## 🔌 Adding a Media Kind

1. Add the asset type to `MediaAsset` (`src/application/domain/MediaAsset.ts`).
2. Add its stored shape, validation and mapping in `src/infrastructure/content/`.
3. Add a component in `presentation/components/media/` and a case in `MediaView`.
4. Teach the scripts its file extensions, an encoder and a role in `MediaPublisher`.

## 📚 Managing Content

Projects, sections, the hero and the intro live in **Netlify Blobs**; publishing needs
no deploy.

### With Claude Code skills

The skills talk in plain Spanish: drop a folder into the chat, answer, confirm.

| Skill | Use it to |
|---|---|
| `/check-setup` | Check a computer is ready, once, before the first upload |
| `/add-project` | Publish a project from a folder of images, videos and GIFs |
| `/add-media` | Add pieces to an existing project |
| `/edit-project` | Change texts, section, cover, order or alt texts, or take pieces out |
| `/remove-project` | Take a project off the site |
| `/set-section` | Create a section, or change its title, order, cover or hover loop |
| `/set-site-identity` | Replace the hero image or the intro animation |
| `/undo-last-change` | Undo the last change, whatever it was |

Pieces appear in file name order (`2-…` before `10-…`). Every skill does a dry run
first and publishes only after an explicit yes.

### What happens to the files

| Input | Output |
|---|---|
| Images (JPG, PNG, WebP, AVIF, TIFF) | AVIF + WebP at 640–3200 px, sRGB, no metadata, blurred placeholder |
| Videos (MP4, MOV, M4V, WebM) | HLS in H.264 at 1080/720/480p, 4 s preview, poster; silent audio dropped |
| Loops (GIFs, clips marked as loops) | One muted MP4, up to 1920 px and 16 MB |
| Transparent GIFs | Filled, or an animated WebP when asked |

Originals are never uploaded. Keys are content hashes, so re-uploads are skipped and a
failed run can be repeated.

### How it is served

| Store (eu-central-1) | Holds | Served at | Cache |
|---|---|---|---|
| `media` | Images, streams, loops | `/media/<key>` | One year, immutable |
| `content` | `work-items.json`, `sections.json`, `site.json`, `last-change.json` | `/content/<key>` | CDN 60 s, browsers revalidate |

Unreferenced media is deleted one change later (so undo works) and never within 24
hours of upload.

### From the command line

```bash
npm run --silent content -- check-setup
npm run --silent content -- list-projects
npm run --silent content -- add-project --folder ./my-project --metadata ./project.json --dry-run
```

Run it without a command for the list; `cli.ts` documents every option. Output is
JSON, with a stable error `code`.

### Free plan limits

300 credits a month; the site pauses when they run out. Bandwidth costs 20 credits
per GB (about 15 GB a month) and each production deploy 15. Enable credit usage
notifications in Netlify.

## 🛠️ Technologies

- React 18, TypeScript 5, Tailwind CSS 3, Vite 5
- Netlify Edge Functions and Blobs
- hls.js, sharp, ffmpeg
- ESLint

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
