# Agent Usage Guide

以后用户不需要每次手动 `@` 具体 SOP。只要 agent 读过这个文档，就应该能根据用户的自然语言提示自动判断要使用哪个 SOP、需要改哪些文件、最后怎么验收。

## Agent First Step

When a user asks to change site content, the agent should:

1. Read this file.
2. Classify the user's intent.
3. Open the matching SOP file.
4. Inspect the current repository state.
5. Make the requested edits.
6. Run the relevant checks from `qa-checklist.md`.
7. Summarize changed files and verification.

Do not ask the user to manually choose an SOP if the intent is clear.

## Intent Router

Use this table to route ordinary prompts:

| User says something like | Use SOP |
| --- | --- |
| 打开本地 CMS / 启动本地 CMS / 进入后台 / 本地后台地址 | `../skill/local-cms.md` |
| 加一个项目 / 更新项目 / 替换项目占位 / 项目封面 / 试玩按钮 / 项目卡片 | `add-project.md` |
| 发一篇博客 / 上传 blog / 整理笔记 / 修改文章 / 技术复盘 | `add-blog-post.md` |
| 修改简历 / 更新经历 / 更新技能 / Profile / 实习经历 / 当前状态 | `update-profile.md` |
| 修改联系方式 / 邮箱 / GitHub / 社交链接 / Contact | `update-contact.md` |
| 做动态网页 / 接 CMS / Decap / 后台编辑 / 内容管理系统 / 自动生成索引 | `cms-migration-plan.md` |
| 检查网站 / 验收 / 修链接 / 看有没有坏掉 | `qa-checklist.md` |
| 设计内容字段 / 规范内容结构 / schema / frontmatter | `content-model.md` |

If a prompt touches multiple areas, use all relevant SOPs in this order:

```text
content-model.md -> specific content SOP -> qa-checklist.md
```

For CMS or architecture work:

```text
cms-migration-plan.md -> content-model.md -> qa-checklist.md
```

## Natural Prompt Examples

The user can now write prompts like these:

```text
帮我新增一个项目，名字叫 Project Dawn，简介是一款双摇杆射击原型，按钮文案写“立即游玩”。
```

Agent route:

```text
usage.md -> add-project.md -> qa-checklist.md
```

```text
把这份 Game Jam 复盘整理成博客，标题你帮我起。
```

Agent route:

```text
usage.md -> add-blog-post.md -> qa-checklist.md
```

```text
我现在又加了一个实习经历，帮我更新到网站里。
```

Agent route:

```text
usage.md -> update-profile.md -> qa-checklist.md
```

```text
把我的邮箱换成新邮箱，GitHub 链接不变。
```

Agent route:

```text
usage.md -> update-contact.md -> qa-checklist.md
```

```text
现在开始把网站接成 Decap CMS，可以后台发博客和加项目。
```

Agent route:

```text
usage.md -> cms-migration-plan.md -> content-model.md -> qa-checklist.md
```

## What The Agent Should Infer

The agent may infer:

- Slug from title.
- Cover label from title initials or project number.
- Reasonable project tone from existing tone values.
- Today's date for a new blog post if the user asks to publish now.
- Tags from article topic.
- Whether homepage summary should be updated when profile or contact changes.

The agent should not invent:

- Company names.
- Awards.
- Project results.
- Dates for real experiences.
- Links that the user did not provide.
- Technical details that are not in the user's material.

## When To Ask A Question

Ask a concise question only if the missing information blocks the task or could create a wrong public claim.

Examples that need a question:

- The user says "update my email" but gives no new email.
- The user asks to publish a project with a real external link but no URL is provided.
- The user asks to update a real timeline date but the date is ambiguous.

Examples that do not need a question:

- Missing project slug: generate one.
- Missing blog tags: infer 2-4 tags.
- Missing project cover: keep existing gradient placeholder.
- Missing play button label: default to `去游玩`.

## Current Repository Mode

Current canonical content source:

```text
content/projects/*.md
content/posts/*.md
content/site.json
content/profile.json
content/contact.json
```

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

After content changes that affect projects or blog posts, run:

```bash
npm run content:sync
```

Do not manually edit generated files unless the build pipeline is broken or the user explicitly asks for that layer.

## Default Workflow

For every content task:

1. Identify intent with the router table.
2. Read the matching SOP.
3. Read the current files listed by that SOP.
4. Make the smallest complete edit.
5. Run relevant QA.
6. In the final response, say:
   - what changed
   - files changed
   - checks run
   - preview URL if useful

## User-Facing Shortcuts

The user can simply say:

```text
新增项目：...
```

```text
发布博客：...
```

```text
更新简历：...
```

```text
更新联系方式：...
```

```text
开始接 CMS：...
```

The agent should route automatically. No explicit SOP mention is required.
