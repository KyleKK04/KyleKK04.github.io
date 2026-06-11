# SOP: CMS Migration Plan

Use this SOP only when the user explicitly asks to implement or plan the dynamic content/CMS migration. Do not add Decap CMS, build scripts, or backend services during ordinary content updates.

## Target Outcome

The website should become:

```text
static frontend + content source files + generated indexes + optional Decap CMS admin
```

The public site remains static. Content becomes easier to edit through Markdown, JSON, CMS, or agent-assisted updates.

## Preferred CMS

Use Decap CMS first because it matches this site's static/Git-based architecture.

Decap CMS should manage:

- Projects
- Blog posts
- Site copy
- Profile data
- Contact data
- Uploaded media

## Migration Phases

### Phase 1 - Content Directory

Add:

```text
content/
  projects/
  posts/
  site.json
  profile.json
  contact.json
assets/
  uploads/
```

Move canonical content into this directory while keeping current pages working.

### Phase 2 - Content Build Script

Add a script that:

1. Reads `content/projects/*.md`.
2. Reads `content/posts/*.md`.
3. Parses frontmatter.
4. Generates `projects/index.json`.
5. Generates `posts/index.json`.
6. Copies or references detail markdown as needed.
7. Validates required fields.

Suggested commands:

```bash
npm run content:build
npm run content:validate
```

Only add these commands when implementing the migration.

### Phase 3 - Profile And Contact Data Loading

Choose one approach:

1. Build-time generation into existing HTML.
2. Runtime `fetch` from JSON files.
3. A small templating step.

Prefer the smallest approach that fits the current static site.

### Phase 4 - Decap Admin

Add:

```text
admin/
  index.html
  config.yml
```

Configure collections:

```text
projects -> content/projects/*.md
posts -> content/posts/*.md
site -> content/site.json
profile -> content/profile.json
contact -> content/contact.json
media -> assets/uploads
```

### Phase 5 - Deployment

Make deployment run:

```bash
npm run content:build
npm run content:validate
```

Then deploy the static files.

## Agent Responsibilities During Migration

Agents should:

- Preserve current page appearance.
- Avoid breaking existing URLs.
- Keep old `project.html?project=<slug>` links redirecting to `projects.html#project-<slug>`.
- Keep old `blog.html?post=<slug>` links working by redirecting to generated `posts/<slug>.html`.
- Add validation before adding CMS complexity.
- Document any new commands in README after implementation.

## Migration Definition Of Done

The migration is complete when:

1. Project and blog content can be edited from canonical content files.
2. Generated indexes are reproducible.
3. Site copy, profile, and contact each have a single canonical source.
4. Decap CMS can edit all target content types.
5. Local build and validation commands pass.
6. Existing public pages still load.

## Non-Goals Unless Explicitly Requested

- Database backend.
- User accounts beyond CMS auth.
- Comments.
- Real-time editing.
- Public user submissions.
- Rewriting the frontend framework.
