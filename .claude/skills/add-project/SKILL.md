---
name: add-project
description: Publish a new portfolio project on Sara's site from a folder of images, videos and GIFs. Use when the user wants to add, upload or publish a project, work, images or videos to the website.
---

# Add a project to the portfolio

The person running this may be Sara, a graphic designer with no programming
background. **Talk to them in plain Spanish.** Never mention JSON, stores, keys,
commands, npm, Netlify Blobs or error codes. Never paste raw command output or
stack traces; explain what happened and what to do next.

Everything goes through the content CLI, which always prints one JSON document:

```bash
npm run --silent content -- <command> [options]
```

`"ok": true` means success; `"ok": false` comes with `error.code`, mapped to
plain language in [Explaining errors](#explaining-errors).

Publishing does not need a deploy: the project appears on the site about a
minute after the upload finishes.

## 1. Check the setup and load the sections

Run `npm run --silent content -- list-sections`.

- `NOT_LOGGED_IN` or `SITE_NOT_LINKED`: stop and explain how to fix it (see the
  table), then start again once it is done.
- An empty list: tell them there are no sections on the site yet, so the
  project would not show up anywhere until one exists. Ask whether to carry on.

Keep the list; the section question in step 3 offers these titles.

## 2. Get the folder

Ask for the folder with the project's images, videos and GIFs. Tell them they
can drag it into the chat. Then list it (`ls -1` on the path) and check it:

- Files are shown in **name order**, numbers compared as numbers (`2-…` before
  `10-…`). That is the order on the site. If the names do not give the order they
  want, suggest renaming them `01-…`, `02-…` and list again.
- Supported: images (JPG, PNG, WebP, AVIF, TIFF), videos (MP4, MOV, M4V, WebM)
  and GIFs. Hidden files such as `.DS_Store` are ignored.
- HEIC (iPhone photos): ask them to export as JPEG first.

Show the pieces in order and confirm it.

## 3. Ask for the texts

Ask for these, a few at a time, in a friendly way:

| Field | Notes |
|---|---|
| Title | Also decides the page address; must not match an existing project |
| Category | Short label, such as "Photography" or "Branding" |
| Year | Four digits |
| Description | Can span several paragraphs |
| Tags | Optional, a few words |
| Section | Offer the titles from step 1; store the section **id** |
| Cover | The piece shown on the section page. Default: the first. Ask only "¿La portada es la primera imagen o prefieres otra?" |

## 4. Videos and GIFs

Skip this step if the folder has none. Otherwise write the metadata file
(step 6) without `loops` or `keepTransparency`, run the dry run (step 7) once
just to read each piece's details, and ask:

- **Each video** (`role` is `video` in that first dry run): is it a video with
  controls, or a loop that plays on its own without sound, like a GIF? Propose
  `suggestedRole`, and say why in plain words: "dura 8 segundos y no tiene
  sonido, así que parece un bucle" or "tiene sonido" (`hasSound`; a silent audio
  track counts as no sound). Loops are added to
  `loops`.
- **Each GIF with `isTransparent: true`**: explain that GIFs are turned into
  light video loops, which cannot be transparent, so the transparent areas
  become white, the colour of the site. Ask whether that is fine or whether it
  must stay transparent; in that case add it to `keepTransparency`, mentioning
  it will weigh more and always play. Recommend white unless it is something
  like a logo shown over other content.

GIFs without transparency are always loops; no question needed.

## 5. Alternative texts

Explain in one sentence that a short description of each image helps people who
use screen readers, and offer to write them. If they accept, look at each image
with the Read tool and draft one line per image (what it shows, not "image
of…"), then let them edit. Skipping is allowed; the dry run will then warn
about it, which is fine.

## 6. Write the metadata file

Write it outside the repository, to `/tmp/add-project-<title-slug>.json`:

```json
{
  "title": "Soft Bodies",
  "category": "Blender",
  "year": "2025",
  "description": "First paragraph.\nSecond paragraph.",
  "tags": ["3D", "Simulation"],
  "section": "3d-modeling",
  "cover": "03-detail.png",
  "alts": { "01-wide.jpg": "Cloth draped over a sphere, lit from the left" },
  "loops": ["04-turntable.mp4"],
  "keepTransparency": ["05-logo.gif"]
}
```

Leave out `cover` when it is the first piece, and `alts`, `loops` or
`keepTransparency` when they would be empty. Alternative texts for videos and
loops describe the clip; they are attached to its still frame.

## 7. Dry run and confirmation

Run:

```bash
npm run --silent content -- add-project --folder "<folder>" --metadata "<file>" --dry-run
```

It checks everything without uploading. Summarise the result for them: title,
section, the pieces in order with the cover marked, and every warning:

- `LOW_RESOLUTION`: that image is under 1600 px wide and may look soft on large
  screens. Suggest a larger export if they have one; it is not blocking.
- `MISSING_ALT`: some images have no description. Not blocking.
- `NO_SECTIONS_YET`: the site has no sections yet, so the project will not be
  listed anywhere until there are.
- `LOW_RESOLUTION` on a video or loop: under 1280 px wide, it may look soft.
- `TRANSPARENCY_FILLED`: the transparent areas of that GIF will be white, as
  agreed in step 4.
- `LONG_LOOP`: a loop of more than 30 seconds is heavy, since it always
  downloads in full. Suggest trimming it, or publishing it as a video instead.

Then ask for an explicit yes before publishing. Anything other than a clear yes
means do not publish.

## 8. Publish

Run the same command without `--dry-run`. It takes several seconds per image
and can take minutes per video, roughly as long as the video itself or more, so
tell them it is working and roughly how long to expect. When done, tell them:

- The project is published and will show on the site in about a minute, at
  `https://sararamon.netlify.app<path>` (use `path` from the output).
- How much was uploaded, in MB, from `upload.bytesUploaded`.

If it fails half way, running the same command again is safe: files already
uploaded are skipped.

## Explaining errors

| Code | What to say and do |
|---|---|
| `NOT_LOGGED_IN` | The computer is not connected to the site's account. Ask them to type `! npx netlify login` in the chat and approve it in the browser. |
| `SITE_NOT_LINKED` | This copy of the project is not connected to the site. Ask them to type `! npx netlify link` and choose `sararamon`. |
| `FOLDER_NOT_FOUND` | The folder could not be found. Ask them to drag it into the chat again. |
| `FOLDER_EMPTY` | The folder has no images. |
| `UNSUPPORTED_FILE` | List the files from `details.files`. `heic`: export as JPEG. `unknown-format`: export images as JPG or PNG, videos as MP4. |
| `UNREADABLE_IMAGE` | `details.file` looks damaged or is not really an image. Suggest exporting it again. |
| `UNREADABLE_VIDEO` | `details.file` could not be read as a video. Suggest exporting it again as MP4 (H.264). |
| `LOOP_TOO_LARGE` | `details.file` is too heavy to play as a loop on iPhones and Safari (`details.sizeMB` MB, the limit is `details.maxMB`). Suggest trimming it, or for a video, publishing it with controls instead. Nothing was published. |
| `COVER_NOT_FOUND` | The chosen cover is not in the folder. Ask again, offering the file names. |
| `PROJECT_EXISTS` | There is already a project called `details.existingTitle`. Ask for a different title. |
| `SECTION_NOT_FOUND` | Offer the sections in `details.sections` again. |
| `INVALID_METADATA` | A mistake on your side writing the metadata file. Fix it from `details.problems` and retry; do not bother them with it. |
| `CONTENT_CHANGED` | Someone else was changing the site at the same moment. Wait a minute and retry. |
| `INVALID_STORED_CONTENT` or `UNEXPECTED` | Something is wrong that they cannot fix. Apologise, say nothing was changed on the site, and suggest asking Maria. Show the error message only if they ask for it. |
