# Sara's Portfolio Web Application

A portfolio application built with React, TypeScript, and Tailwind CSS, implementing a clean hexagonal architecture pattern.

If you see something strange, no you did not. I am a Backend Engineer attempting to build a Frontend application 😛

Feel free to visit the application at [sararamon.netlify.app](https://sararamon.netlify.app/)

## 🎯 Features

- **Modern Tech Stack**: React 18 with functional components and Hooks, TypeScript for type safety, Tailwind CSS for styling
- **Hexagonal Architecture**: Clean separation of concerns with Domain, Infrastructure, Application, and Presentation layers, also followed by the Edge Function and the content scripts
- **Light Theme**: Minimalist design on white, with header and hero type inverting
  against whatever sits behind it
- **Fully Responsive**: Optimized for mobile, tablet, and desktop viewports
- **Smooth Scrolling**: Seamless navigation between sections with anchor links
- **Sections**: The home lists sections rather than individual projects; each section
  has its own page listing its work
- **Content without deploys**: Projects, sections, the hero and the intro live in
  Netlify Blobs and are published with Claude Code skills; the site picks changes up
  within a minute
- **Optimised media**: AVIF/WebP images at several widths with blurred placeholders,
  adaptive HLS video, GIFs turned into light MP4 loops, all cached for a year
- **Type-Safe**: TypeScript implementation for strict type checking

## 🏗️ Architecture

### Domain Layer (Core)
- Pure business logic and entity definitions
- Interface definitions: `WorkItem`, `Section`, `SiteMedia`, `Media` (`ImageAsset`,
  `VideoAsset`, `LoopAsset`), `AboutContent`, `ContactDetails`
- No external dependencies

### Infrastructure Layer (Adapters)
- Data fetching and external service integration
- HTTP adapters read the content documents served by the media Edge Function, validate
  them and map them to the domain; mock adapters serve placeholder content in development
- No secret ever reaches the browser: Blobs are only read server side

### Application Layer (Use Cases)
- Business logic orchestration
- Custom Hooks: `useWorkItems`, `useSections`, `useSection`, `useSiteMedia`,
  `useAboutContent`, `useContactDetails`
- State management and data flow control

### Presentation Layer (Components)
- React UI components
- Components: `Header`, `FullscreenMenu`, `IntroSplash`, `Hero`, `SectionGrid`,
  `SectionCard`, `SectionPage`, `ProjectRow`, `WorkItemDetail`, `MediaGallery`,
  `AboutSection`, `ContactSection`, `Footer`
- Media components: `MediaView` picks one per kind: `ResponsiveImage`, `VideoPlayer`,
  `LoopVideo`
- Presentation hooks: `useIsMobile`, `useScrollLock`, `useRevealOnScroll`, `useInView`
- Only interacts with Application layer hooks

### Folder Structure
```
src/
├── application/
│   ├── domain/                    # Domain Layer (Anemic approach)
│   │   ├── WorkItem.ts           # A project: texts, cover and ordered media
│   │   ├── Section.ts            # A home page section
│   │   ├── Media.ts              # ImageAsset, VideoAsset, LoopAsset
│   │   ├── SiteMedia.ts          # Hero image and intro animation
│   │   ├── AboutContent.ts
│   │   ├── ContactDetails.ts
│   │   └── urlId.ts             # Title to URL id helper
│   └── service/                   # Application Services (Use Cases)
│       ├── useWorkItems.ts
│       ├── useSections.ts
│       ├── useSection.ts
│       ├── useSiteMedia.ts
│       ├── useAboutContent.ts
│       └── useContactDetails.ts
├── infrastructure/                # Infrastructure Layer
│   ├── ports/
│   │   └── repositories.ts       # Repository interfaces
│   ├── content/                   # Stored content format, shared with the scripts
│   │   ├── contentSchema.ts      # Documents as stored in Blobs (keys, not URLs)
│   │   ├── contentValidation.ts  # Runtime validation, with the path of any error
│   │   ├── contentMapper.ts      # Stored content to domain, keys to URLs
│   │   └── blobStores.ts         # Store names and region
│   └── adapters/
│       ├── HttpContentClient.ts  # Fetches a document once per page load
│       ├── HttpWorkItemRepository.ts
│       ├── HttpSectionRepository.ts
│       ├── HttpSiteMediaRepository.ts
│       ├── Mock*Repository.ts    # Placeholder content for development
│       └── mockMedia.ts
├── presentation/
│   ├── hooks/
│   └── components/
│       ├── media/                 # ResponsiveImage, VideoPlayer, LoopVideo, MediaView
│       ├── MediaGallery.tsx      # Carousel over a project's mixed media
│       └── …                     # Pages and sections listed above
├── App.tsx                        # Application entry point (wiring, routes)
├── main.tsx
└── index.css

netlify/edge-functions/media/      # Serves /media/* and /content/* from Blobs
├── index.ts                       # Entry: routes and cache policies
├── serveBlob.ts                   # HTTP: ETag/304, byte ranges, content types
├── BlobSource.ts                  # Port
└── NetlifyBlobSource.ts           # Adapter over @netlify/blobs

scripts/content/                   # Content CLI used by the skills
├── domain/                        # Inputs, file rules, media rules, error codes
├── application/                   # Use cases, ports, MediaPublisher, cleanup
├── infrastructure/                # sharp, ffmpeg, Netlify Blobs, file system
└── cli.ts                         # Entry point, always prints JSON

.claude/skills/                    # /add-project, /add-media, /edit-project, …
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

`npm run dev` has no Edge Function, so it serves the mocks. Builds always read the
content store. To read it in development set `VITE_CONTENT_SOURCE=http` and run under
`netlify dev`, bearing in mind that `netlify dev` uses a local, empty Blobs sandbox
rather than production data.

### Other scripts

| Script | Does |
|---|---|
| `npm run content -- <command>` | The content CLI; see [Managing content](#-managing-content) |
| `npm run test:tools` | Tests for the content use cases, with in-memory adapters |
| `npm run typecheck:tools` | Type-checks the scripts and the Edge Function |
| `npm run lint` | Lints the app, the scripts and the Edge Function |

## 🔒 Security & Best Practices

- No API key or token is ever part of the browser bundle. The Edge Function reads Blobs
  with credentials Netlify injects per request, and the content scripts reuse the
  local `netlify login`
- Stored content is validated at runtime before the site uses it, with the same rules
  the scripts apply before writing it
- Content writes are conditional on the version read, so concurrent uploads cannot
  overwrite each other

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

The tokens are named `site.*`, not `dark.*`. They were renamed when the site moved to
a light theme, so that the names do not contradict their values.

### Intro Splash

`IntroSplash` shows an animated logo the first time the site loads **in a tab**, then
fades out. It is skipped when:

- `sessionStorage` already holds the `sara-intro-seen` key, which is set as soon as the
  intro starts. Reloading the same tab therefore does not replay it, while a new tab
  does, because `sessionStorage` is scoped per tab and not shared across the browser
- the visitor prefers reduced motion
- the site has no intro animation set

To see it again in the same tab, clear the flag from the console:

```js
sessionStorage.removeItem('sara-intro-seen')
```

The animation itself is content: replace it with `/set-site-media`.

### Loop background

MP4 has no transparency, so transparent areas of GIFs published as loops are filled
with `LOOP_BACKGROUND` in `scripts/content/domain/mediaRules.ts`. It must match
`site.bg` in `tailwind.config.js`; change both together.

### Mobile Navigation

Below the `md` breakpoint the inline header links are replaced by `FullscreenMenu`, a
full-screen overlay opened by a `menu` / `close` trigger. Its state lives in `App`,
because the overlay has to be a sibling of the header: nested inside it would inherit the
header's stacking context and its blend mode.

## 📦 Deployment

This application is deployed using **Netlify**, configured in `netlify.toml`:

- The build lints first (`npm run lint && npm run build`), so a style error fails the
  deploy rather than reaching the site
- Client-side routes fall back to `index.html`
- Commits that only touch `docs/`, `.claude/`, `scripts/` or Markdown skip the build:
  every production deploy costs credits on the Free plan, and content never needs one
- Deploy Previews, built for every pull request, cost no credits. The content stores
  are site-wide, so previews show production content

## 🔌 Adding a Media Kind

A project's media is a list of pieces, each an image, a video or a loop. To support a
new kind (audio, PDF, a 3D viewer):

1. **Domain**: add an asset type to `MediaAsset` in `src/application/domain/Media.ts`.
2. **Stored format**: add its stored shape to `contentSchema.ts`, its validation to
   `contentValidation.ts` and its key-to-URL mapping to `contentMapper.ts`.
3. **Presentation**: add a component under `presentation/components/media/` and a case
   in `MediaView`, the single place that maps kinds to components. TypeScript points out
   every `switch` that still misses the new kind.
4. **Publishing**: teach `scripts/content/domain/sourceFiles.ts` its file extensions,
   add an encoder port and adapter, and a role in `MediaPublisher`.

## 📚 Managing Content

Projects, sections, the hero image and the intro animation live in **Netlify Blobs**,
not in the repository, so publishing never needs a deploy.

### With Claude Code skills

Open the project in Claude Code and use a skill. They talk in plain Spanish and are
written for someone without a programming background: drop a folder into the chat,
answer a few questions, check the summary, confirm.

| Skill | Use it to |
|---|---|
| `/check-setup` | Check a computer is ready, once, before the first upload |
| `/add-project` | Publish a project from a folder of images, videos and GIFs |
| `/add-media` | Add pieces to an existing project |
| `/edit-project` | Change texts, section, cover, order or alt texts, or take pieces out |
| `/remove-project` | Take a project off the site |
| `/set-section` | Create a section, or change its title, order, cover or hover loop |
| `/set-site-media` | Replace the hero image or the intro animation |
| `/undo-last-change` | Undo the last change, whatever it was |

Pieces appear in **file name order**, numbers compared as numbers (`2-…` before
`10-…`). Every skill shows a dry run first and only publishes after an explicit yes.

### What happens to the files

- **Images** (JPG, PNG, WebP, AVIF, TIFF) become AVIF and WebP at 640, 1024, 1600, 2400
  and 3200 px, never above the original, in sRGB with metadata stripped, plus a 16 px
  blurred placeholder
- **Videos** (MP4, MOV, M4V, WebM) become an adaptive HLS stream in H.264 at
  1080/720/480p by short side, with a 4 s muted preview and a poster. Silent audio
  tracks are dropped
- **Loops**, GIFs and clips marked as such, become a single muted MP4 of up to 1920 px,
  at most 16 MB so that Safari plays them. Clips already in H.264 are only remuxed
- **Transparent GIFs** have their transparency filled, or stay transparent as an
  animated WebP when asked
- Originals are never uploaded. Keys derive from the file's content, so uploading the
  same file twice stores it once, and a failed run can simply be repeated

### How it is served

| Store (eu-central-1) | Holds | Served at | Cache |
|---|---|---|---|
| `media` | Images, streams, loops | `/media/<key>` | One year, immutable |
| `content` | `work-items.json`, `sections.json`, `site.json`, `last-change.json` | `/content/<key>` | CDN 60 s, browsers revalidate |

Both are served by the `media` Edge Function, which answers byte ranges for small files
(Safari needs them for MP4) and conditional requests. Media nothing references any more
is deleted one change later, so the last change can always be undone, and never within
24 hours of upload.

### From the command line

The skills drive `npm run --silent content -- <command>`, which can be used directly:

```bash
npm run --silent content -- check-setup
npm run --silent content -- list-projects
npm run --silent content -- add-project --folder ./my-project --metadata ./project.json --dry-run
```

Run it with no command for the full list. Output is always JSON, with a stable error
`code` on failure; `cli.ts` documents every command and option.

### Free plan limits

The Free plan has 300 credits a month, and the site pauses when they run out.
Bandwidth costs 20 credits per GB (about 15 GB a month), and each production deploy
costs 15. Enable credit usage notifications in the Netlify dashboard. Moving to a paid
plan needs no code change.

## 🛠️ Technologies

- **React 18**: Modern UI library with Hooks
- **TypeScript 5**: Static typing and improved DX
- **Tailwind CSS 3**: Utility-first CSS framework
- **Vite 5**: Next-generation frontend tooling
- **Netlify Edge Functions and Blobs**: Media and content delivery and storage
- **hls.js**: Adaptive video outside Safari, loaded only when a video is played
- **sharp** and **ffmpeg**: Image, video and loop encoding in the content scripts
- **ESLint**: Code quality and consistency, over the app, the scripts and the Edge Function

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
