---
name: set-section
description: Create a section on the home page of Sara's portfolio site, or change its title, position, cover image or hover animation. Use when the user wants to add a section or change a section's cover.
---

# Create or change a section

Same rules as `/add-project`: **plain Spanish**, never mention JSON, stores,
commands or error codes. Errors: see "Explaining errors" in
`.claude/skills/add-project/SKILL.md`.

Sections are the cards on the home page; each groups projects.

1. Run `npm run --silent content -- list-sections` and ask whether to change one
   of them or create a new one.
2. For a **new** section, ask for its title, its position among the cards, and
   its cover image. Its id is the title in lower case with dashes
   (`Black & White` → `black-and-white`); confirm it, since it is also its
   address and should not change later.
3. Optionally, a hover animation: a GIF or a short video that plays when the
   pointer is over the card. It always plays as a muted loop, and any
   transparency becomes white.
4. Offer to write a short description of the cover image, as `/add-project`
   step 5 does.
5. Write `/tmp/set-section-<id>.json` with only what changes (files are full
   paths):

   ```json
   { "title": "Videoclips", "order": 2, "cover": "/path/cover.jpg", "coverAlt": "…", "hover": "/path/clip.mp4" }
   ```

   Use `"removeHover": true` to take a hover animation away.
6. Run with `--dry-run`, summarise, ask for an explicit yes, then run it without
   `--dry-run`:

   ```bash
   npm run --silent content -- set-section --id <id> --metadata "<file>" --dry-run
   ```
