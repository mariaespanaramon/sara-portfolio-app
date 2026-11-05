# Media storage plan (temporary)

Working document for the `netlify-blobs-media-storage` branch. Delete it before
merging, as was done with the restyle plan.

## Goal

Serve every image and video of the portfolio from Netlify Blobs, on the Free
plan, with:

- **As few production deploys as possible.** Content changes never need one.
- **Easy uploads.** Claude Code skills that take Sara's exported files and do
  the rest.
- **Every reasonable optimisation** for storage, delivery and display.

## Current state

- `NetlifyBlobsWorkItemRepository` runs in the browser and reads
  `import.meta.env.NETLIFY_BLOB_ACCESS`. Vite only exposes `VITE_` variables,
  so it is always `undefined` and the app always falls back to
  `MockWorkItemRepository`. Exposing the token with a `VITE_` prefix would
  publish it, so that is not a fix.
- The `/.netlify/blobs/serve/...` URL in `items.json` does not exist. Netlify
  only exposes blobs through the site's own functions.
- `items.json` at the repo root is missing `type`, so it would fail validation.
- Every media URL today is a placeholder: Pexels, Google sample videos and
  Giphy. That includes work items, section covers, the hero and the intro
  splash.

## Constraints that shape the design

| Constraint | Source | Consequence |
|---|---|---|
| Free plan: 300 credits a month, a hard limit; the site pauses when they run out | Netlify credits docs | Minimise bytes and deploys |
| Bandwidth costs 20 credits/GB (about 15 GB a month at most) | Netlify credits docs | Never ship originals; cache aggressively |
| Production deploy costs 15 credits; previews and branch deploys are free | Netlify credits docs | One merge to `main`; test on Deploy Previews |
| Blobs have no public URL | Netlify Blobs docs | Serve through an Edge Function |
| Edge Functions do not use compute credits | Netlify credits docs | Edge Function rather than a serverless Function |
| Blob reads have no documented `Range` support | Netlify Blobs docs | HLS for videos; buffered `Range` only for small MP4s |
| Max blob size 5 GB, 2 KB metadata | Netlify Blobs docs | Not a constraint in practice |
| Site-wide stores are shared by previews and production | Netlify Blobs docs | Real content can be checked on a preview before merge; deletes are global |

## Architecture

```
Sara's exported files
        │  /add-project, /add-media, ... (Claude Code skills)
        ▼
scripts/content/  (Node: sharp + ffmpeg, @netlify/blobs with the local CLI token)
        │  uploads derivatives + updates JSON
        ▼
Netlify Blobs
  store "media"    → content-hashed files (immutable)
  store "content"  → work-items.json, sections.json, site.json (mutable)
        │
        ▼
Edge Function  /media/*      (ETag/304, immutable caching, small-file Range)
        │
        ▼
Browser: HttpWorkItemRepository / HttpSectionRepository → ResponsiveImage, HlsVideo, LoopVideo
```

## Domain model

A project is an ordered list of media pieces that can be mixed. The
`image` / `video` / `gallery` project types go away.

```ts
interface ImageAsset {
  kind: 'image';
  /** Base key in the media store; variants are `${key}-${width}.${format}`. */
  key: string;
  width: number;
  height: number;
  /** Widths that exist for this asset, ascending. */
  widths: number[];
  /** Tiny blurred preview, inlined as a data URI. */
  placeholder: string;
  alt?: string;
}

interface VideoAsset {
  kind: 'video';
  /** Key of the HLS master playlist. */
  hls: string;
  poster: ImageAsset;
  /** Short, muted, low-res MP4 loop for cards and rows. */
  preview?: string;
  width: number;
  height: number;
  durationSeconds: number;
  hasAudio: boolean;
}

/** Replaces GIFs: a short looping clip, encoded as MP4. */
interface LoopAsset {
  kind: 'loop';
  mp4: string;
  poster: ImageAsset;
  width: number;
  height: number;
}

type MediaAsset = ImageAsset | VideoAsset | LoopAsset;

interface WorkItem {
  id: string;
  title: string;
  category: string;
  description: string;
  year: string;
  tags: string[];
  sectionId?: string;
  /** Shown on cards and rows. Defaults to media[0] when not chosen explicitly. */
  cover: MediaAsset;
  media: MediaAsset[];
}
```

`Section` follows the same pattern: `cover: ImageAsset` plus an optional
`hover: VideoAsset | LoopAsset`. These replace `coverImageUrl`,
`coverVideoUrl` and `coverGifUrl`.

Every image on the site lives in Blobs, including the ones that are not
project content. They are described in `site.json`:

```ts
interface SiteIdentity {
  hero: ImageAsset;
  intro: LoopAsset;
}
```

Favicons stay in `public/`, since browsers request them by fixed path.

## Optimisations

### Storage

- Originals are never uploaded. Sara keeps them; Blobs hold web derivatives only.
- Images: AVIF and WebP at widths 640 / 1024 / 1600 / 2400, never upscaled.
  Converted to sRGB with the colour profile honoured, EXIF stripped, and
  quality tuned per format.
- Videos: HLS with H.264 (plays natively on Safari and iOS) at
  1080p / 720p / 480p, never above the source resolution. Segments of about 4 s
  in fMP4. Capped bitrates. The audio track is dropped when silent.
- GIFs become MP4 loops, typically 5–20× smaller.
- Keys are content-hashed, so uploading the same file twice stores it once.

### Delivery

- An Edge Function at `/media/*` streams from Blobs and sets `Content-Type`
  from metadata, plus an `ETag` with `304` responses.
- Media keys get `Cache-Control: public, max-age=31536000, immutable`.
- `work-items.json`, `sections.json` and `site.json` get `max-age=60, stale-while-revalidate`,
  so content changes show within a minute without a deploy.
- Netlify CDN caching of Edge Function responses keeps the function from
  running on every hit. Needs verifying, see step 0.
- `Range` support, buffered, only for small MP4s (previews and loops), which
  Safari needs.
- `@netlify/blobs` leaves the browser bundle.

### Display

- `<picture>` with AVIF and WebP sources, `srcset`/`sizes`, `width`/`height`,
  and a blurred placeholder. No layout shift, and every screen gets the size it
  needs.
- `loading="lazy"` and `decoding="async"` by default; `fetchpriority="high"` on
  the first visible image (hero and the first row).
- Cards and rows show the poster, then the muted preview: on hover on desktop,
  or when in view on touch devices. Disabled under `prefers-reduced-motion` and
  `Save-Data`.
- Project detail stays a **gallery/carousel** for now, now mixing images and
  videos. The restyle comes in a later PR.
  - Videos use native HLS on Safari and `hls.js` elsewhere, dynamic-imported
    once and only on detail pages. They have `preload="none"` and only start
    loading when they are the current slide.
  - Adjacent slides are preloaded at the right variant, as the current gallery
    does with originals.

## Minimising deploys

1. All work happens on this branch. Each step is checked on its free Deploy
   Preview.
2. Real content is uploaded to the site-wide stores before merging and checked
   on the preview.
3. One merge to `main`, which is one production deploy (15 credits).
4. `netlify.toml` gets an `ignore` command that skips builds when a commit only
   touches `docs/`, `.claude/`, `scripts/` or `*.md`.
5. After the merge, adding, editing or removing content takes zero deploys.

## Skills

They live in `.claude/skills/`. All of them drive `scripts/content/`, so
results are deterministic. Each skill asks for missing fields, shows a local
preview of what will be uploaded and asks for confirmation before writing to
Blobs.

Maria uploads content for now, but the skills are written so that Sara can
use them later without a programming background:

- Prompts, summaries and errors are in plain Spanish and never mention keys,
  stores, JSON or commands. Errors say what to do next ("this video is in a
  format I can't read; export it as MP4 from Premiere") and never show a stack
  trace.
- Input is a folder dropped into the chat. Nothing has to be typed beyond the
  project's texts.
- Every change shows a summary before writing to Blobs and asks for
  confirmation, and nothing is deleted without an explicit yes.
- `/remove-project` keeps the previous JSON (`work-items.previous.json`) so the
  last change can be undone with `/undo-last-change`.
- A `/check-setup` skill verifies that ffmpeg, the Netlify CLI and the login are
  in place, and explains how to fix whatever is missing.

| Skill | Input | Effect |
|---|---|---|
| `/add-project` | A folder of mixed images, videos and GIFs plus metadata (title, category, year, description, tags, section). Order comes from file names (`01-…`, `02-…`); the cover is `cover.*` or the first file | Processes each file by kind, uploads it and appends the item |
| `/add-media` | A project id, files and a position | Inserts pieces into an existing project |
| `/edit-project` | A project id | Changes metadata, reorders pieces or picks a different cover |
| `/remove-project` | A project id, optionally specific pieces | Removes the item or pieces and deletes blobs nothing else references |
| `/set-section` | A section id plus title, order, cover image and optional hover video or GIF | Creates the section or changes any of those |
| `/set-site-identity` | `hero` or `intro` plus a file | Replaces the hero image or the intro splash loop |

## Step by step

Each step ends with a review in the running app before any commit.

Everything follows the hexagonal architecture already in `src/`: domain types
with no dependencies, use cases that depend only on ports, and adapters at the
edges. That applies to the content scripts too. Sharp, ffmpeg, the
`@netlify/blobs` client and the file system are adapters behind ports, so the
use cases (`AddProject`, `RemoveProject`, ...) can be tested without them, and
the Edge Function is a thin adapter.

### Step 0: Prerequisites and checks ✅

- [x] Tooling: ffmpeg/ffprobe 9.0.2 via Homebrew; `netlify-cli` 27.16.2 as a
      dev dependency (`npx netlify`), so Sara does not need a global install.
      Already logged in and linked to `sararamon`.
- [x] Edge Function caching works: `cache: "manual"` in the config **and**
      caching headers set in the function code. Headers in `netlify.toml` do
      not apply to Edge Function responses. Cached hits do not invoke the
      function. A new deploy in the same context clears the cache, which is fine
      with few deploys.
- [x] Edge Function limits: 50 ms of CPU per request (waiting on I/O does not
      count), headers within 40 s, 512 MB of memory shared by all edge
      functions, and no documented response size limit. Large files must be
      streamed through untouched; only small files may be buffered, for `Range`.
- [x] Existing stores: `videos` holds `moonshoe_3.mp4`; `work-items` holds
      `items.json`, identical to the repo copy. `media` and `content` are empty.
- [x] Site settings: build `npm run build`, publish `dist`, functions region
      `us-east-2` (the same as the site-wide Blobs default, so no `region`
      option is needed). Deploy Previews are built for PRs, so testing needs a
      draft PR.

### Step 1: Delivery path and new model

The new model forces every view that shows media to change at once, so a basic
`ResponsiveImage`, the per-kind renderers and the mixed gallery moved here from
steps 2 and 3.

- [x] `netlify.toml`: build command, publish dir, SPA redirect (deep links
      previously had none) and the `ignore` rule.
- [x] `netlify/edge-functions/media/`: the `BlobSource` port, the
      `NetlifyBlobSource` adapter, `serveBlob` (ETag/304, small-file `Range`,
      content types, cache headers) and the route entry for `/media/*` and
      `/content/*` with `cache: "manual"`.
- [x] Domain: `MediaAsset.ts` (`ImageAsset`, `VideoAsset`, `LoopAsset`), plus the
      `WorkItem` (`cover` and `media[]`) and `Section` (`cover` and `hover`)
      changes. Assets carry resolved URLs; keys stay in infrastructure.
- [x] Infrastructure: `content/contentSchema.ts` (stored format, shared with
      the scripts), `contentValidation.ts`, `contentMapper.ts` (keys to URLs),
      `HttpContentClient`, `HttpWorkItemRepository` and `HttpSectionRepository`.
- [x] `App.tsx`: HTTP repositories in builds; mocks under `npm run dev` unless
      `VITE_CONTENT_SOURCE=http`.
- [x] Mocks rewritten to the new shape (`mockMedia.ts`).
- [x] Presentation: `media/ResponsiveImage`, `LoopVideo`, `VideoPlayer`,
      `MediaView` and `MediaGallery`, plus `ProjectRow`, `SectionCard`,
      `SectionPage` and `WorkItemDetail` adapted.
- [x] Removed `NetlifyBlobsWorkItemRepository`, `netlify.config.ts`, the token
      env typings, the unused `WorkItemCard`, `workItemCards/`,
      `workItemDetails/` and the root `items.json`.
- [ ] Review locally with the mocks.
- [x] Hand-make one sample project (images and a loop) plus a sample
      `sections.json`, and upload them to the `media` and `content` stores.
      Uploading needs the CLI token; the permission classifier blocks Claude
      from reading it, so Maria ran the upload herself.
- [x] Push and open draft PR #11. The first preview failed: the edge bundler
      evaluates modules at build time, so `getStore` must not run at import.
      Creating it lazily and keeping it then failed later with 500s ("Token
      expired"): the Blobs token is per request, so the store is now created
      per request.
- [x] Preview checks with curl:
  - SPA fallback works for deep links; `/media/../x` is rejected.
  - Headers are as designed. `Netlify-CDN-Cache-Control` does not reach the
    browser. Netlify weakens the ETag of compressed JSON (`W/`).
  - 304 on `If-None-Match`.
  - CDN caching works (`Cache-Status: hit`, growing `age`), but each edge node
    caches on its own, so repeated requests often miss at first. Static assets
    behave the same way.
  - `Range` returns 206 with the right bytes, both before and after a full
    fetch; partial responses are never cached.
- [x] Visual check on the preview, on Chrome and Safari.
- [x] Section header image was slow (over 1 s): it ended a serial chain of
      HTML, JS, both documents and then the image. Fixed by rendering the
      header before the work items arrive, preloading the documents from the
      HTML, `fetchpriority="high"`, and preloading the header rendition when a
      home card is hovered, touched or focused.
- [x] Stores moved from the default `us-east-2` to `eu-central-1` (Frankfurt),
      closer to the expected visitors. The region and store names live in
      `src/infrastructure/content/blobStores.ts` and every read and write must
      pass them.

### Step 2: Images

- [x] Missing content documents read as empty content; real failures show a
      neutral message (`LoadErrorMessage`) and the hooks log the details to the
      console.
- [x] `fetchpriority="high"` on the section header and the project hero.
- [x] `scripts/content/`, hexagonal:
  - `domain/`: `ContentError` (stable codes the skills map to plain language),
    `ProjectDraft` (metadata validation) and `sourceFiles` (file kinds, ignored
    files, numeric-aware ordering).
  - `application/`: the ports, `AddProject` (dry run, idempotent uploads keyed
    by content hash and encoder version, media before document),
    `contentDocuments` (read, then a conditional write with retries, a backup
    in `work-items.previous.json`, and the site's own validation) and
    `listContent`.
  - `infrastructure/`: `SharpImageEncoder` (AVIF q62 at 4:4:4 and WebP q84, at
    640/1024/1600/2400/3200 capped at the source width, in sRGB with EXIF
    stripped, plus a 16 px placeholder; about 7–8 s per image),
    `NetlifyBlobsStores` (eu-central-1, contentType and size metadata, strong
    consistency reads), `netlifyCredentials` (reuses `netlify link` and
    `netlify login`, or the env vars) and `localAdapters`.
  - `cli.ts`: `add-project`, `list-sections` and `list-projects`, always
    printing JSON.
- [x] `npm run content`, `npm run test:tools` (node:test, in-memory adapters, 7
      tests) and `npm run typecheck:tools` (scripts and Edge Function).
- [x] The `cover.*` convention was dropped: the cover is the first piece, or
      one picked by file name, since it must be one of the project's pieces.
- [x] `/add-project` skill, images only.
- [ ] End-to-end run of the skill against Blobs. The CLI reads the Netlify
      login, which the auto mode classifier blocks for Claude, so it needs a
      permission rule or a run by Maria.

### Step 3: Mixed gallery polish

- [ ] Whatever the step 1 review of `MediaGallery` turns up. The full restyle
      of the project page is a separate PR.

### Step 4: Videos and loops

- [x] Ports: `VideoEncoder` (inspect, encodeVideo, encodeLoop), animation
      support on `ImageEncoder`, encoder outputs read lazily and disposed after
      upload, `SourceFile.path` and `Hasher.digestFile`, so large videos are
      never held in memory.
- [x] `FfmpegVideoEncoder`:
  - HLS in H.264 and fMP4, 4 s segments with aligned keyframes. The ladder is
    1080/720/480 by short side, so portrait works, plus a rung at the source's
    own resolution when it sits clearly between rungs. CRF 20 with bitrate
    caps.
  - AAC only when there is real sound; a silent track (below −60 dB) is
    dropped.
  - A 4 s 480p muted preview, and a poster frame at about 1 s.
  - Loops: up to 1920 px on the long side, transparency filled with the site
    background (`#ffffff`). Clips that are already H.264 and yuv420p at a
    suitable size are only remuxed, with no re-encode.
- [x] Transparent GIFs: transparency is detected by counting pixels, since the
      metadata claims alpha for almost every GIF. By default it is filled;
      `keepTransparency` keeps it as an animated WebP (640/1280 px).
- [x] `AddProject`: four roles (image, video, loop, animation). `loops` and
      `keepTransparency` in the draft, `suggestedRole` and `hasSound` in the dry
      run, the `TRANSPARENCY_FILLED` and `LONG_LOOP` warnings, and the
      `UNREADABLE_VIDEO` and `LOOP_TOO_LARGE` errors (16 MB, the Edge
      Function's range limit, so loops always play on Safari). Segments are
      uploaded before playlists. 11 tests.
- [x] Web: `VideoPlayer` shows the poster and a play button of its own, then
      plays HLS natively on Safari or with `hls.js/light` elsewhere (a lazy
      chunk of 119 KB gzipped, capped to the player's size). Section rows play
      a video cover's muted preview while in view.
- [x] Skill: asks per video whether it is a video or a loop (proposing one from
      length and sound), and per transparent GIF whether to keep the
      transparency.
- [ ] End to end: publish a real video, loop and GIF, then check playback on the
      preview in Chrome, Safari and iOS.

### Step 5: Remaining skills and site media

- [x] `MediaPublisher`: an application service with the file checks,
      planning, encoding and upload, shared by every use case that publishes.
- [x] One `last-change.json` record of the document a change replaced (which
      document, a description, when, and how it was before) instead of
      per-document backups, so undo always knows what to restore.
- [x] `cleanMedia` runs after every change. It deletes media that neither the
      current documents nor the last change's previous version reference, only
      under `images/`, `videos/` and `loops/`, and never anything uploaded in
      the last 24 hours, which an upload in progress may own.
- [x] Use cases: `RemoveProject`, `UndoLastChange` (undoing twice redoes),
      `AddMedia` (at a position, the cover stays the same piece), `EditProject`
      (texts, section, cover, order, removing pieces and alt texts by position;
      a new title moves the page) and `SetSection` (create with title, order and
      cover, or change any of them; the hover is always a loop), plus
      `SetSiteIdentity` (the hero is an image; the intro is an image, a loop, or an
      animation kept transparent).
- [x] `check-setup` checks Node, ffmpeg, ffprobe, sharp, the Netlify link and
      login, and Blobs access, reporting every item.
- [x] `site.json` in the schema; the `SiteIdentity` domain type,
      `SiteIdentityRepository`, the HTTP and mock adapters and `useSiteIdentity`. The
      hero and the intro splash read it, the intro waits for a loop or image to
      be ready, and a site without an intro has no splash. `site.json` is
      preloaded too.
- [x] Skills: `/add-media`, `/edit-project`, `/remove-project`,
      `/undo-last-change`, `/set-section` (renamed from `/set-section-cover`,
      since it also creates sections), `/set-site-identity` and `/check-setup`.
      They share the error table in `/add-project`.
- [x] 21 tests with in-memory adapters.
- [x] Removed the "Mixed Media Test" sample with `remove-project`.
- [x] Delete the stale `work-items.previous.json` left in the content store by
      the earlier backup scheme (done by Maria).

### Step 6: Real content and cleanup

- [ ] Upload Sara's real projects and section covers; check them on the preview.
- [ ] Delete the old `videos` and `work-items` stores, and the sample copies of
      `media` and `content` left in `us-east-2`.
- [x] Update the README: the new content workflow, the skills and the
      prerequisites. Remove the obsolete Blobs instructions.
- [ ] Enable credit usage notifications in Netlify.
- [ ] Delete this document.
- [ ] One PR and one merge to `main`.

## Budget sketch (Free plan, 300 credits a month)

- Merge: 15 credits, once.
- A typical visit (home, one section, one project with a video) should come to
  roughly 15–30 MB after optimisation, which allows about 500–900 visits a
  month. Returning visitors cost much less thanks to immutable caching.
- Moving to Personal ($9/month, 1,000 credits) needs no code changes.

### Step 7: Handing over to Sara (later, separate PR if needed)

- [ ] Walk through every skill with someone who has not seen it before and fix
      whatever is unclear.
- [ ] A one-page guide in Spanish for Sara: install the Claude desktop app,
      open the project, run `/check-setup` once, then `/add-project`.
- [ ] Decide whether that is enough or whether she needs something with no
      local setup at all, such as a password-protected upload page. That would
      move processing to the server and is a separate project.
