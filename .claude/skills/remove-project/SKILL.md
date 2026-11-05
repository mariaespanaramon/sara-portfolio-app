---
name: remove-project
description: Take a project off Sara's portfolio site. Use when the user wants to delete, remove or unpublish a project.
---

# Remove a project

Same rules as `/add-project`: **plain Spanish**, never mention JSON, stores,
commands or error codes. Errors: see "Explaining errors" in
`.claude/skills/add-project/SKILL.md`.

1. Run `npm run --silent content -- list-projects` and ask which project, by
   title. Never guess between similar titles.
2. Run `npm run --silent content -- remove-project --id <id> --dry-run` and tell
   them what will go: the project's title and how many pieces it has.
3. Ask for an explicit yes. Anything else means do not remove it.
4. Run the same command without `--dry-run`. Tell them it is gone from the site
   within about a minute, and that `/undo-last-change` brings it back if it was
   a mistake, as long as nothing else is changed first.
