---
name: edit-project
description: Change a project on Sara's portfolio site — its texts, section, cover, the order of its pieces, their descriptions, or take pieces out. Use when the user wants to edit, fix, reorder or update a project.
---

# Edit a project

Same rules as `/add-project`: **plain Spanish**, never mention JSON, stores,
commands or error codes. Errors: see "Explaining errors" in
`.claude/skills/add-project/SKILL.md`.

1. Run `npm run --silent content -- list-projects` and ask which project, by
   title.
2. Ask what to change. Everything is optional; only include what changes:

   | Field | Notes |
   |---|---|
   | `title`, `category`, `year`, `description`, `tags` | As in `/add-project` |
   | `section` | A section id from `list-sections` |
   | `cover` | Position of the piece to use as cover, counting from 1 |
   | `order` | Every current position, in the new order: `[3, 1, 2]` |
   | `removePieces` | Positions to take out. At least one piece must stay; to remove everything, use `/remove-project` |
   | `alts` | New descriptions by position: `{ "2": "…" }` |

   All positions refer to the pieces **as they are now**, before reordering or
   removing anything. When in doubt, ask them to describe the pieces and map
   them yourself.
3. Write `/tmp/edit-project-<id>.json` with only the changed fields, then run:

   ```bash
   npm run --silent content -- edit-project --id <id> --metadata "<file>" --dry-run
   ```

4. Summarise the change. If `pathChanged` is true, warn them that a new title
   moves the page to a new address (`path`), so links shared before will stop
   working.
5. Ask for an explicit yes, then run it without `--dry-run`. `/undo-last-change`
   reverts it.
