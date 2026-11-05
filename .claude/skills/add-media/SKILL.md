---
name: add-media
description: Add images, videos or GIFs to a project already on Sara's portfolio site. Use when the user wants to add more pieces, images or videos to an existing project.
---

# Add pieces to an existing project

Same rules as `/add-project`: **plain Spanish**, never mention JSON, stores,
commands or error codes. Errors: see "Explaining errors" in
`.claude/skills/add-project/SKILL.md`. The folder checks, the video and GIF
questions, the alternative texts and the warnings all work exactly as in
`/add-project` steps 2, 4, 5 and 7.

1. Run `npm run --silent content -- list-projects` and ask which project, by
   title. Tell them how many pieces it has now.
2. Ask for a folder with only the new pieces (they can drag it into the chat),
   and check it as `/add-project` step 2 does.
3. Ask where they go: at the end (default), or before which current piece,
   counting from 1. If they are unsure, offer to list the current pieces.
4. Write `/tmp/add-media-<project-id>.json`:

   ```json
   { "position": 2, "alts": { "new.jpg": "…" }, "loops": [], "keepTransparency": [] }
   ```

   Leave out `position` for the end, and any empty field.
5. Run with `--dry-run`, answer the video and GIF questions if any, and
   summarise:

   ```bash
   npm run --silent content -- add-media --id <id> --folder "<folder>" --metadata "<file>" --dry-run
   ```

6. Ask for an explicit yes, then run it without `--dry-run`. The cover stays the
   same piece it was.
