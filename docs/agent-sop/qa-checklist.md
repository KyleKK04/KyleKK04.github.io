# SOP: QA Checklist

Use this checklist before an agent finishes any content or site update.

## Always Check

Inspect changed files:

```bash
git diff -- <changed-files>
```

Check worktree status:

```bash
git status --short
```

## JSON Checks

For content changes that affect generated project or blog output:

```bash
npm run content:sync
```

If you need spot checks after build:

```bash
node -e "JSON.parse(require('fs').readFileSync('projects/index.json','utf8')); console.log('projects json ok')"
node -e "JSON.parse(require('fs').readFileSync('posts/index.json','utf8')); console.log('posts json ok')"
```

For site/profile/contact source files:

```bash
node -e "JSON.parse(require('fs').readFileSync('content/site.json','utf8')); JSON.parse(require('fs').readFileSync('content/profile.json','utf8')); JSON.parse(require('fs').readFileSync('content/contact.json','utf8')); console.log('site/profile/contact json ok')"
```

## JavaScript Checks

If scripts changed:

```bash
node --check scripts/content-lib.js
node --check scripts/content-build.js
node --check scripts/content-validate.js
node --check scripts/site-content.js
node --check scripts/index-page.js
node --check scripts/profile-page.js
node --check scripts/contact-page.js
node --check scripts/markdown.js
node --check scripts/site-background.js
```

## Local Preview

Start a local server if one is not already running:

```bash
python3 -m http.server 4173
```

Preview relevant pages:

```text
http://localhost:4173/
http://localhost:4173/projects.html
http://localhost:4173/blog.html
http://localhost:4173/blog.html?post=<slug>
http://localhost:4173/profile.html
http://localhost:4173/contact.html
http://localhost:4173/admin/
```

Use only the URLs relevant to the task.

## Link Checks

Search for old or broken patterns when navigation changes:

```bash
rg -n 'href="#|href="index.html#|TODO|undefined|null' *.html content posts projects docs admin
```

Adjust the search paths to match files that exist.

## Manual Visual Checks

For touched pages, check:

- Text does not overflow buttons, cards, tags, or windows.
- Long links wrap.
- Navigation highlights the right page.
- Navigation text matches `content/site.json` when site copy changed.
- Project cards still show the correct play button state.
- Blog posts still render markdown.
- Homepage summaries match standalone pages where content is duplicated.

## Final Response Checklist

The final response should include:

- What changed.
- Files changed.
- What checks ran.
- Any checks that could not be run.
- Preview URLs when useful.
