---
name: set-site-identity
description: Replace the big image at the top of the home page of Sara's site, or the animated logo shown when the site opens. Use when the user wants to change the hero image, the intro, the splash or the logo animation.
---

# Replace the hero image or the intro animation

Same rules as `/add-project`: **plain Spanish**, never mention JSON, stores,
commands or error codes. Errors: see "Explaining errors" in
`.claude/skills/add-project/SKILL.md`.

1. Ask which: the **hero** (the big image at the top of the home page, an
   image) or the **intro** (the animation shown when someone opens the site:
   an image, a GIF or a short video).
2. Ask for the file; they can drag it into the chat.
3. For the hero, offer to write a short description of the image.
4. Run the dry run:

   ```bash
   npm run --silent content -- set-site-identity --slot <hero|intro> --file "<path>" [--alt "<text>"] --dry-run
   ```

5. For an intro GIF with `isTransparent: true` in the result, explain as
   `/add-project` step 4 does: by default the transparent areas become white,
   the colour of the site, or it can stay transparent at the cost of weight.
   For a logo over a white page, white is usually fine. If they want it
   transparent, add `--keep-transparency`.
6. Summarise, ask for an explicit yes, then run it without `--dry-run`. The
   change shows within about a minute; the intro only appears once per browser
   session, so they may need a private window to see it.
