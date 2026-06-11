# Content Model

This document defines the long-term content architecture. Agents should use it when designing migrations, adding CMS fields, or normalizing current content.

## Naming Rules

- Use lowercase slugs.
- Use hyphen-separated words.
- Avoid spaces, Chinese characters, and special symbols in slugs.
- Keep slugs stable after publishing.
- Prefer date format `YYYY-MM-DD`.
- Store uploaded files under `assets/uploads/`.

## Project Model

Target file:

```text
content/projects/<slug>.md
```

Frontmatter:

```yaml
---
slug: example-project
title: 项目标题
summary: 一句话项目简介。
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

Generated public output:

```text
projects/index.json
```

Required project fields:

- `slug`
- `title`
- `summary`
- `playLabel`
- `coverLabel`
- `tone`

Optional project fields:

- `playLink`
- `cover`
- `coverFit`
- `coverPosition`
- `featured`

Recommended `tone` values already used by the site:

```text
teal, amber, violet, rose, blue, green
```

## Blog Post Model

Target file:

```text
content/posts/<slug>.md
```

Frontmatter:

```yaml
---
slug: gameplay-prototype-notes
title: 玩法原型的第一轮验证
date: 2026-06-05
summary: 一句话简介。
tags:
  - Gameplay
  - Prototype
  - Unity
---
```

Markdown body:

```md
## 小标题

正文内容。
```

Generated public output:

```text
posts/index.json
posts/<slug>.md
```

Required blog fields:

- `slug`
- `title`
- `date`
- `summary`
- `tags`
- `file`

## Profile Model

Target file:

```text
content/profile.json
```

Suggested shape:

```json
{
  "headline": "经历与技能",
  "summary": "偏玩法、系统和工具链方向...",
  "status": [
    { "label": "Now", "value": "快手游戏研发部实习" },
    { "label": "Focus", "value": "Unity 玩法开发 / 系统设计 / 工具链" },
    { "label": "Mode", "value": "从核心循环开始，快速验证，再迭代表现和架构。" }
  ],
  "timeline": [
    {
      "time": "现在",
      "title": "快手游戏研发部实习",
      "description": "参与游戏研发相关工作..."
    }
  ],
  "skills": [
    {
      "label": "Engine & Core",
      "items": ["Unity", "C#", "Gameplay Programming", "C++"]
    }
  ]
}
```

Runtime consumers:

```text
profile.html
index.html
```

## Site Copy Model

Target file:

```text
content/site.json
```

Suggested shape:

```json
{
  "siteName": "KyleKK",
  "ownerName": "朱绪达 KyleKK",
  "navigation": {
    "projects": "Projects",
    "profile": "Profile",
    "notes": "Notes",
    "contact": "Contact"
  },
  "home": {
    "title": "朱绪达 KyleKK | Gameplay Developer",
    "metaDescription": "首页搜索摘要",
    "hero": {
      "primaryLabel": "查看项目",
      "secondaryLabel": "查看经历与技能"
    },
    "sections": {
      "projects": {
        "kicker": "Projects",
        "title": "精选项目",
        "detailLabel": "查看全部项目",
        "lead": "首页项目区块说明。"
      }
    }
  },
  "projectsPage": {
    "kicker": "Projects",
    "headline": "项目列表",
    "lead": "项目页页头说明。"
  },
  "blogPage": {
    "listTitle": "技术博客",
    "listSummary": "技术复盘、项目笔记和学习记录。"
  },
  "profilePage": {
    "kicker": "Profile"
  },
  "contactPage": {
    "kicker": "Contact"
  }
}
```

Runtime consumers:

```text
index.html
projects.html
blog.html
profile.html
contact.html
scripts/site-content.js
```

## Contact Model

Target file:

```text
content/contact.json
```

Suggested shape:

```json
{
  "headline": "联系我",
  "summary": "如果你想聊游戏开发...",
  "email": "kyle20040930@gmail.com",
  "github": "https://github.com/KyleKK04",
  "direction": "游戏研发 / Unity / 玩法系统",
  "status": "快手游戏研发部实习中",
  "note": "我通常会优先回复..."
}
```

Runtime consumers:

```text
contact.html
index.html
```

## Asset Rules

- Put user-provided images and documents in `assets/uploads/`.
- Use descriptive names, for example `project-slug-cover.png`.
- Update references when renaming files.
- Do not delete old assets unless the user asks for cleanup.
