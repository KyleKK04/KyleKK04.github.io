# Local CMS Skill

Use this skill when the user wants an agent to start or check the local Decap CMS for this repository, then report a directly usable local URL.

## Goal

Bring up the local website and local Decap backend, verify both are reachable, and return the exact local CMS URL.

## Repository Root

```text
/Users/zhuxuda/SelfWebSite
```

Always run commands from the repository root or use explicit absolute paths.

## Required Services

Two services are needed:

1. Static file server for the site on port `4173`
2. Decap local backend proxy on port `8081`
3. Content watcher so CMS edits regenerate public files automatically

## Startup Workflow

### 1. Check whether the site server is already running

```bash
lsof -i :4173 -sTCP:LISTEN
```

If nothing is listening, start it:

```bash
python3 -m http.server 4173
```

Run it from:

```text
/Users/zhuxuda/SelfWebSite
```

### 2. Check whether the Decap local backend is already running

```bash
lsof -i :8081 -sTCP:LISTEN
```

If nothing is listening, start it:

```bash
npm run cms:local
```

Run it from:

```text
/Users/zhuxuda/SelfWebSite
```

### 3. Check whether the content watcher is already running

This keeps `content/` edits in sync with `projects/` and `posts/`.

```bash
pgrep -fl "node scripts/content-watch.js"
```

If it is not running, start it:

```bash
npm run content:watch
```

Run it from:

```text
/Users/zhuxuda/SelfWebSite
```

### 4. Verify the endpoints

Site:

```text
http://localhost:4173/
```

CMS:

```text
http://localhost:4173/admin/
```

### 5. Report the CMS URL

Return:

```text
http://localhost:4173/admin/
```

If both services were already running, say so briefly.

## Agent Execution Rules

- Do not ask the user to manually `cd` unless the user specifically wants terminal steps.
- Prefer checking whether services already exist before starting duplicates.
- If a required port is occupied by the correct service, reuse it.
- If port `4173` is occupied by another process that is not the site server, start the site on a new port and report the new CMS URL accordingly.
- If port `8081` is occupied by another process that is not the Decap backend, stop and report the conflict instead of guessing.

## Standard Success Output

The agent should end with:

1. Whether the site server was reused or started
2. Whether the CMS backend was reused or started
3. Whether the content watcher was reused or started
4. The direct local CMS URL

Example:

```text
本地站点服务已运行，Decap 本地代理已运行，内容 watcher 已运行。
直接进入：http://localhost:4173/admin/
```
