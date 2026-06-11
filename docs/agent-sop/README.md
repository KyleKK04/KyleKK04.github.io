# Website Agent SOP Overview

This folder is the operating manual for agents working on KyleKK's personal website. The goal is to make future content changes predictable: the user can provide a normal prompt, and the agent should know which SOP to use, which files to edit, how to keep data consistent, and how to verify the result.

For day-to-day prompts, start with `usage.md`. It is the natural-language routing guide, so the user does not need to mention a specific SOP every time.

## Product Goal

Move the website toward:

```text
static frontend + Git-managed content + optional CMS admin + agent-assisted maintenance
```

The site should stay fast and simple, while projects, blog posts, profile content, and contact information become easy to add or update.

## Implementation Philosophy

- Static pages remain the public frontend.
- Content should gradually become the source of truth.
- Markdown is preferred for long-form content.
- JSON is preferred for small structured data.
- Decap CMS is a future editing layer, not a requirement for every content update.
- Agents should automate repetitive edits, validation, link checks, and local preview.

## Current Source Of Truth

Current canonical source files:

| Content type | Current files to update |
| --- | --- |
| Projects | `content/projects/*.md` |
| Blog | `content/posts/*.md` |
| Site copy | `content/site.json` |
| Profile | `content/profile.json` |
| Contact | `content/contact.json` |
| Shared presentation | `styles/main.css` only when required |

Generated public output:

```text
projects/index.json
posts/index.json
posts/*.md
```

Runtime consumers:

```text
index.html
projects.html
blog.html
profile.html
contact.html
```

## Target Architecture

The target architecture is described in `content-model.md`. The intended future shape is:

```text
content/
  projects/
    example-project.md
  posts/
    example-post.md
  site.json
  profile.json
  contact.json
assets/
  uploads/
```

## Roadmap

### Phase 0 - SOP Layer

Create agent-readable SOP files. This phase only documents workflows and does not change runtime behavior.

### Phase 1 - Content Model

Introduce `content/` as the canonical content source. Define schemas for project, blog, site copy, profile, and contact content. Keep existing public pages working.

### Phase 2 - Build And Validation

Add a small content build script that converts markdown/frontmatter into the JSON files currently consumed by the site. Add validation for required fields, duplicate slugs, missing images, broken links, and invalid dates.

### Phase 3 - CMS Admin

Add Decap CMS under `admin/` so content can be edited visually. Configure collections for projects, blog posts, site copy, profile, contact, and uploads.

### Phase 4 - Agent Automation

Use agents for richer tasks: content drafting, image naming, link checks, summaries, stack extraction, local previews, screenshots, and PR-ready cleanup.

## SOP Routing

Use `usage.md` first when the user gives a normal prompt. Use this table when you already know the task type:

| User intent | SOP |
| --- | --- |
| Route a normal prompt | `usage.md` |
| Add a project | `add-project.md` |
| Update an existing project | `add-project.md` |
| Add a blog post | `add-blog-post.md` |
| Edit an existing blog post | `add-blog-post.md` |
| Update resume/profile/skills/experience | `update-profile.md` |
| Update email/GitHub/social/contact text | `update-contact.md` |
| Implement Decap CMS or dynamic content pipeline | `cms-migration-plan.md` |
| Verify before final answer | `qa-checklist.md` |

## Example User Prompts

```text
帮我新增一个项目，素材在 assets/uploads/demo.png
```

```text
把这份笔记整理成博客
```

```text
更新我的实习经历和技能栈
```

```text
开始接 Decap CMS
```

## Definition Of Done

A content update is done only when:

1. The relevant SOP was followed.
2. Required files are updated.
3. Generated files and runtime references are valid.
4. Local preview or equivalent checks pass.
5. The final response tells the user what changed and how it was verified.
