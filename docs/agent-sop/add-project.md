# SOP: Add Or Update A Project

Use this SOP when the user wants to add a new project, replace a placeholder project, edit an existing project, or update project card copy and play links.

## Inputs To Collect

Use what the user provides. If a field is missing and the site can still work, choose a reasonable placeholder instead of blocking.

Recommended inputs:

- Project title
- Slug
- Summary
- Play link
- Play button label
- Cover image path
- Cover display mode (`cover` to crop and fill, or `contain` to show the full image)
- Cover focal position
- Cover label
- Tone
- Whether it should appear on the homepage

## Current Files To Inspect

```text
content/projects/*.md
projects/index.json
projects.html
index.html
```

Only edit page HTML if the requested change requires presentation or homepage behavior changes. For ordinary content updates, edit `content/projects/<slug>.md` and regenerate outputs.

## Current-State Workflow

1. Read `content/projects/` and check whether the requested `slug` already exists.
2. Create or update `content/projects/<slug>.md`.
3. Put project card fields in frontmatter only. Project detail body is no longer part of the public model.
4. Run `npm run content:sync`.
5. Confirm generated `projects/index.json` was updated.
6. Check that the project card renders correctly on `projects.html`.

## Generated Output Workflow

After `npm run content:sync`, the site should regenerate:

```text
projects/index.json
```

## Content Markdown Template

```md
---
slug: example-project
title: 项目标题
summary: 一行项目简介。
playLink: https://example.itch.io/example-project
playLabel: 去游玩
cover: assets/uploads/example-project-cover.png
coverFit: cover
coverPosition: center
coverLabel: EX
tone: teal
featured: true
---
```

## Legacy Manual Workflow

Only use this if the content pipeline is broken:

1. Read `projects/index.json`.
2. Check whether the requested `slug` already exists.
3. If adding a project, append a new object or replace a placeholder entry if the user asks to replace one.
4. If updating a project, edit only that project's object.
5. Keep JSON valid and consistently formatted.

## Verification

Run applicable checks from `qa-checklist.md`, especially:

```bash
npm run content:sync
```

Preview:

```text
http://localhost:4173/projects.html
```

## Final Response Must Include

- Added or updated project title.
- Files changed.
- Preview URL.
- Checks run.
