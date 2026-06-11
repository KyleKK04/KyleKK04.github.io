const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT_DIR, "content");
const PROJECTS_CONTENT_DIR = path.join(CONTENT_DIR, "projects");
const POSTS_CONTENT_DIR = path.join(CONTENT_DIR, "posts");
const PUBLIC_PROJECTS_DIR = path.join(ROOT_DIR, "projects");
const PUBLIC_POSTS_DIR = path.join(ROOT_DIR, "posts");
const SITE_PATH = path.join(CONTENT_DIR, "site.json");
const PROFILE_PATH = path.join(CONTENT_DIR, "profile.json");
const CONTACT_PATH = path.join(CONTENT_DIR, "contact.json");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeFile(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value);
}

function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];

  return fs.readdirSync(dirPath)
    .filter(fileName => fileName.endsWith(".md"))
    .sort()
    .map(fileName => path.join(dirPath, fileName));
}

function parseScalar(rawValue) {
  const value = rawValue.trim();

  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "[]") return [];
  if (/^\[(.*)\]$/.test(value)) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map(item => parseScalar(item));
  }
  if (/^['"].*['"]$/.test(value)) return value.slice(1, -1);

  return value;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    return { data: {}, body: markdown };
  }

  const frontmatter = match[1];
  const body = match[2];
  const lines = frontmatter.split(/\r?\n/);
  const data = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!keyMatch) {
      throw new Error(`Invalid frontmatter line: ${line}`);
    }

    const key = keyMatch[1];
    const rawValue = keyMatch[2] || "";

    if (rawValue === "") {
      const listValues = [];
      let cursor = index + 1;

      while (cursor < lines.length) {
        const listMatch = lines[cursor].match(/^\s*-\s+(.+)$/);
        if (!listMatch) break;
        listValues.push(parseScalar(listMatch[1]));
        cursor += 1;
      }

      if (listValues.length > 0) {
        data[key] = listValues;
        index = cursor - 1;
      } else {
        data[key] = "";
      }

      continue;
    }

    data[key] = parseScalar(rawValue);
  }

  return { data, body };
}

function serializeScalar(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function serializeFrontmatter(data) {
  const lines = ["---"];

  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      value.forEach(item => {
        lines.push(`  - ${serializeScalar(item)}`);
      });
      return;
    }

    lines.push(`${key}: ${serializeScalar(value)}`);
  });

  lines.push("---", "");
  return lines.join("\n");
}

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function readContentEntries(dirPath) {
  return listMarkdownFiles(dirPath).map(filePath => {
    const raw = readFile(filePath);
    const { data, body } = parseFrontmatter(raw);

    return {
      filePath,
      fileName: path.basename(filePath),
      raw,
      data,
      body
    };
  });
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function writeJson(filePath, value) {
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeMarkdownBody(body) {
  return body.replace(/^\s+|\s+$/g, "");
}

module.exports = {
  ROOT_DIR,
  CONTENT_DIR,
  PROJECTS_CONTENT_DIR,
  POSTS_CONTENT_DIR,
  PUBLIC_PROJECTS_DIR,
  PUBLIC_POSTS_DIR,
  SITE_PATH,
  PROFILE_PATH,
  CONTACT_PATH,
  ensureDir,
  readFile,
  writeFile,
  readJson,
  writeJson,
  parseFrontmatter,
  serializeFrontmatter,
  readContentEntries,
  normalizeMarkdownBody,
  toPosix
};
