---
name: check-setup
description: Check that this computer is ready to publish content on Sara's site, and explain how to fix whatever is missing. Use before the first upload on a new computer, or when publishing fails for reasons that look like setup.
---

# Check the setup

Same rules as the other content skills: **plain Spanish**, no commands, codes or
technical names unless they have to type something.

Run `npm run --silent content -- check-setup`. It reports every check, so
explain all the fixes at once rather than one at a time:

| Check | When it fails |
|---|---|
| `node` | Node.js is missing or older than 22.18. Ask them to install the current LTS from nodejs.org, then reopen the project. |
| `ffmpeg`, `ffprobe` | The video tool is missing. On a Mac: `! brew install ffmpeg` (if `brew` itself is missing, point them to brew.sh first). |
| `sharp` | The project's tools are not installed. Ask them to type `! npm install`. |
| `netlify-link` | Ask them to type `! npx netlify link` and choose `sararamon`. |
| `netlify-login` | Ask them to type `! npx netlify login` and approve it in the browser. |
| `blobs` | The site's storage could not be reached. Usually a connection problem: try again in a minute; if it persists, suggest asking Maria. |

When `allPassed` is true, say everything is ready and mention `/add-project`.
After they fix something, run the check again to confirm.
