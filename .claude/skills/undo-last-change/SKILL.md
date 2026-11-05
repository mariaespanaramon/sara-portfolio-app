---
name: undo-last-change
description: Undo the last change made to Sara's portfolio content (a project added, edited or removed, a section or the hero changed). Use when the user wants to undo, revert or go back.
---

# Undo the last change

Same rules as `/add-project`: **plain Spanish**, never mention JSON, stores,
commands or error codes. Errors: see "Explaining errors" in
`.claude/skills/add-project/SKILL.md`.

1. Run `npm run --silent content -- undo-last-change --dry-run`. It returns the
   `description` of the last change and when it was made (`changedAt`).
2. Tell them what will be undone in plain words, with the date and time, such
   as "Se quitará el proyecto «Soft Bodies» que añadiste hoy a las 15:20". The
   description reads `add project`, `remove project`, `edit project`,
   `add N pieces to`, `add section`, `edit section` or `replace the hero/intro`,
   and starts with `undo:` when the last change was itself an undo.
3. Ask for an explicit yes, then run it without `--dry-run`.
4. Only the very last change can be undone. Undoing again redoes what was
   undone, which is worth telling them if they ask to undo twice.
