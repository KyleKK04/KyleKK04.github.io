# Agent Entry

This repository is KyleKK's personal website. When a user asks an agent to add or update site content, read this file first, then read `docs/agent-sop/usage.md` to route natural-language prompts to the relevant SOP.

## Current Site Shape

- Frontend is static HTML/CSS/JS.
- Canonical content source lives under `content/`.
- Generated public project data lives in `projects/index.json`.
- Generated public blog data lives in `posts/index.json` and `posts/*.md`.
- Site-level copy is sourced from `content/site.json` and rendered into shared navigation plus page headers/meta at runtime.
- Profile content is sourced from `content/profile.json` and rendered into `index.html` and `profile.html` at runtime.
- Contact content is sourced from `content/contact.json` and rendered into `index.html` and `contact.html` at runtime.
- Shared styles are in `styles/main.css`.
- Shared markdown parsing is in `scripts/markdown.js`.
- Content build scripts are in `scripts/content-build.js` and `scripts/content-validate.js`.

## SOP Router

For everyday use, start with `docs/agent-sop/usage.md`. It explains how to route normal prompts without asking the user to mention a specific SOP.

Use the most specific SOP:

- Start or verify the local CMS: `docs/skill/local-cms.md`
- Natural-language usage guide: `docs/agent-sop/usage.md`
- Add or update a project: `docs/agent-sop/add-project.md`
- Add or update a blog post: `docs/agent-sop/add-blog-post.md`
- Update resume, experience, skills, or profile copy: `docs/agent-sop/update-profile.md`
- Update email, GitHub, social links, or contact copy: `docs/agent-sop/update-contact.md`
- Plan the static-to-CMS migration: `docs/agent-sop/cms-migration-plan.md`
- Check the work before finishing: `docs/agent-sop/qa-checklist.md`
- Understand target content architecture: `docs/agent-sop/content-model.md`
- Read the overall plan: `docs/agent-sop/README.md`

## Agent Rules

1. Canonical content source is `content/`. Prefer editing `content/projects/*.md`, `content/posts/*.md`, `content/site.json`, `content/profile.json`, and `content/contact.json`.
2. Do not manually edit generated public files under `projects/` or `posts/` unless the user explicitly asks for generated output changes or the build pipeline is unavailable.
3. Run `npm run content:sync` after content changes that affect generated project or blog outputs.
4. For content-only requests, keep edits limited to the relevant content files and only touch HTML when presentation or runtime rendering changes are required.
5. Do not implement a database backend unless the user explicitly asks for it.
6. Preserve existing visual style and page structure unless the user explicitly asks for design changes.
7. After edits, run the verification steps from `docs/agent-sop/qa-checklist.md` that match the touched files.
8. Never delete unrelated user changes.

## Common Local Preview

Use an HTTP server because JSON and markdown are loaded with `fetch`.

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/
```
