# SOP: Add Or Update A Blog Post

Use this SOP when the user wants to publish a note, technical article, project review, learning log, or edit an existing blog post.

## Inputs To Collect

Use what the user provides. If missing, infer conservatively.

Recommended inputs:

- Title
- Slug
- Date
- Summary
- Tags
- Markdown body
- Source notes or draft

## Current Files To Inspect

```text
content/posts/*.md
posts/index.json
posts/*.md
blog.html
index.html
```

For ordinary blog publishing, edit `content/posts/<slug>.md` and regenerate outputs.

## Current-State Workflow

1. Read `content/posts/`.
2. Choose a stable slug if the user did not provide one.
3. Create or update `content/posts/<slug>.md`.
4. Put metadata in frontmatter and body in markdown.
5. Run `npm run content:sync`.
6. Confirm generated `posts/index.json` and `posts/<slug>.md` were updated.
7. Check `blog.html?post=<slug>`.

## Content Markdown Template

```md
---
slug: example-post
title: 文章标题
date: 2026-06-09
summary: 一行文章摘要。
tags:
  - Unity
  - Gameplay
  - Tools
---

# 文章标题

## 背景

写这篇文章为什么存在。

## 正文

写主要内容。

## 复盘

写结论、下一步或可复用经验。
```

## Agent Editing Guidance

- Keep the user's voice if they provide a draft.
- For rough notes, organize into readable sections.
- Do not invent factual claims about projects, companies, awards, or dates.
- If the user asks for polishing, improve structure and clarity without changing meaning.
- Use code blocks for code or commands.

## Legacy Manual Workflow

Only use this if the content pipeline is broken:

1. Read `posts/index.json`.
2. Create or update `posts/<slug>.md`.
3. Add or update the corresponding index entry.
4. Keep JSON valid.

## Verification

Run applicable checks from `qa-checklist.md`, especially:

```bash
npm run content:sync
```

Preview:

```text
http://localhost:4173/blog.html
http://localhost:4173/blog.html?post=<slug>
```

## Final Response Must Include

- Added or updated post title.
- Files changed.
- Preview URL.
- Checks run.
