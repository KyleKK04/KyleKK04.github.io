# SOP: Update Profile, Resume, Experience, Or Skills

Use this SOP when the user wants to change personal summary, current status, education, internship experience, timeline items, skill groups, resume wording, or profile page content.

## Inputs To Collect

Recommended inputs:

- Current role or status
- Profile summary
- Timeline entries
- Skill groups
- Resume PDF path, if any
- Which content should appear on homepage versus profile page

## Current Files To Inspect

```text
content/site.json
content/profile.json
index.html
profile.html
```

Profile data is sourced from `content/profile.json`, while profile-page chrome such as the page kicker and load-error copy is sourced from `content/site.json`.

## Current-State Workflow

1. Update `content/profile.json`.
2. Keep `hero`, `status`, `timeline`, and `skills` internally consistent.
3. If the user is changing profile-page shared chrome, navigation wording, or page-level copy, also update `content/site.json`.
4. If updating a resume or attachment file, put it in `assets/uploads/` or the user-specified location.
5. Only touch `index.html`, `profile.html`, or the page scripts if the rendering behavior itself needs to change.
6. Do not change page design unless the user asks.

## Content Mapping

Standalone page:

```text
profile.html
scripts/profile-page.js
```

Homepage:

```text
index.html
scripts/index-page.js
```

## Canonical Source

See `content-model.md#profile-model`.

## Verification

Run applicable checks from `qa-checklist.md`.

Preview:

```text
http://localhost:4173/
http://localhost:4173/profile.html
```

Check manually for:

- No stale duplicated profile text.
- No text overflow in status rows, timeline, or skill tags.
- Homepage and profile page describe the same current status.

## Final Response Must Include

- Which profile sections changed.
- Files changed.
- Preview URL.
- Checks run.
