# SOP: Update Contact Information

Use this SOP when the user wants to update email, GitHub, social links, contact text, collaboration direction, current status, or contact cards.

## Inputs To Collect

Recommended inputs:

- Email
- GitHub URL
- Other social URLs
- Preferred contact text
- Current direction
- Current availability or status

## Current Files To Inspect

```text
content/site.json
content/contact.json
index.html
contact.html
```

Contact data is sourced from `content/contact.json`, while contact-page chrome such as the page kicker and load-error copy is sourced from `content/site.json`.

## Current-State Workflow

1. Update `content/contact.json`.
2. Keep card labels, values, and optional `href` fields consistent.
3. Validate mail links use `mailto:`.
4. Validate external links use `target="_blank"` and `rel="noreferrer"` when they open a new tab.
5. If the user is changing contact-page shared chrome, navigation wording, or page-level copy, also update `content/site.json`.
6. Only touch `index.html`, `contact.html`, or the page scripts if the rendering behavior itself needs to change.
7. Do not change page design unless the user asks.

## Content Mapping

Standalone page:

```text
contact.html
scripts/contact-page.js
```

Homepage:

```text
index.html
scripts/index-page.js
```

## Canonical Source

See `content-model.md#contact-model`.

## Verification

Run applicable checks from `qa-checklist.md`.

Preview:

```text
http://localhost:4173/
http://localhost:4173/contact.html
```

Check manually for:

- Email visible text matches `mailto:`.
- GitHub visible text matches link destination.
- Homepage and contact page are consistent.
- Long links wrap without layout overflow.

## Final Response Must Include

- Which contact values changed.
- Files changed.
- Preview URL.
- Checks run.
