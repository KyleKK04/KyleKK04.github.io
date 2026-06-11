const fs = require("fs");
const path = require("path");
const {
  PROJECTS_CONTENT_DIR,
  POSTS_CONTENT_DIR,
  PUBLIC_PROJECTS_DIR,
  PUBLIC_POSTS_DIR,
  readContentEntries,
  serializeFrontmatter,
  normalizeMarkdownBody,
  writeFile,
  writeJson
} = require("./content-lib");

function buildProjects() {
  const entries = readContentEntries(PROJECTS_CONTENT_DIR);

  const projects = entries.map(entry => {
    const { data } = entry;

    return {
      sourceFile: `content/projects/${entry.fileName}`,
      slug: data.slug,
      title: data.title,
      playLink: data.playLink || "",
      playLabel: data.playLabel || "去游玩",
      summary: data.summary,
      cover: data.cover || "",
      coverFit: data.coverFit || "cover",
      coverPosition: data.coverPosition || "center",
      coverLabel: data.coverLabel,
      tone: data.tone,
      featured: data.featured !== false
    };
  });

  if (fs.existsSync(PUBLIC_PROJECTS_DIR)) {
    fs.readdirSync(PUBLIC_PROJECTS_DIR)
      .filter(fileName => fileName.endsWith(".md"))
      .forEach(fileName => {
        fs.unlinkSync(path.join(PUBLIC_PROJECTS_DIR, fileName));
      });
  }

  writeJson(path.join(PUBLIC_PROJECTS_DIR, "index.json"), projects);
  return projects;
}

function buildPosts() {
  const entries = readContentEntries(POSTS_CONTENT_DIR)
    .sort((left, right) => {
      const leftDate = left.data.date || "";
      const rightDate = right.data.date || "";
      return rightDate.localeCompare(leftDate) || left.data.slug.localeCompare(right.data.slug);
    });

  const posts = entries.map(entry => {
    const { data, body } = entry;
    const slug = data.slug;
    const publicFileName = entry.fileName.replace(/\.md$/, "");
    const publicFile = `posts/${publicFileName}.md`;
    const generatedMarkdown = `${serializeFrontmatter({
      slug: data.slug,
      title: data.title,
      date: data.date,
      summary: data.summary,
      tags: data.tags || []
    })}${normalizeMarkdownBody(body)}\n`;

    writeFile(path.join(PUBLIC_POSTS_DIR, `${publicFileName}.md`), generatedMarkdown);

    return {
      sourceFile: `content/posts/${entry.fileName}`,
      slug: data.slug,
      title: data.title,
      date: data.date,
      summary: data.summary,
      tags: data.tags || [],
      file: publicFile
    };
  });

  writeJson(path.join(PUBLIC_POSTS_DIR, "index.json"), posts);
  return posts;
}

function main() {
  const projects = buildProjects();
  const posts = buildPosts();

  console.log(`Built ${projects.length} projects and ${posts.length} posts.`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildProjects,
  buildPosts,
  main
};
