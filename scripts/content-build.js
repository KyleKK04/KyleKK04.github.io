const fs = require("fs");
const path = require("path");
const {
  ROOT_DIR,
  PROJECTS_CONTENT_DIR,
  POSTS_CONTENT_DIR,
  PUBLIC_PROJECTS_DIR,
  PUBLIC_POSTS_DIR,
  SITE_PATH,
  PROFILE_PATH,
  CONTACT_PATH,
  readContentEntries,
  readJson,
  readFile,
  serializeFrontmatter,
  normalizeMarkdownBody,
  writeFile,
  writeJson
} = require("./content-lib");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeUrl(value, fallback = "#") {
  if (!value) return fallback;
  const safeValue = String(value).trim();

  if (
    safeValue === "#" ||
    safeValue.startsWith("/") ||
    safeValue.startsWith("./") ||
    safeValue.startsWith("../") ||
    safeValue.startsWith("http://") ||
    safeValue.startsWith("https://") ||
    safeValue.startsWith("mailto:")
  ) {
    return safeValue;
  }

  if (/^[A-Za-z0-9][A-Za-z0-9/_\-.]*$/.test(safeValue)) {
    return safeValue;
  }

  return fallback;
}

function renderProjectCover(project, options = {}) {
  const filename = escapeHtml(options.filename || `${project.slug}.log`);
  const coverLabel = escapeHtml(project.coverLabel || "00");
  const tone = escapeHtml(project.tone || "");
  const coverSrc = sanitizeUrl(project.cover, "");
  const imageAlt = escapeHtml(project.title || project.slug || "project cover");
  const coverFit = project.coverFit === "contain" ? "contain" : "cover";
  const allowedPositions = new Set(["center", "top", "bottom", "left", "right"]);
  const coverPosition = allowedPositions.has(project.coverPosition) ? project.coverPosition : "center";
  const displayClasses = ` cover-fit-${coverFit} cover-position-${coverPosition}`;
  const classes = `${displayClasses}${options.className ? ` ${options.className}` : ""}`;

  if (coverSrc) {
    return `
        <div class="project-cover${classes}">
          <img src="${coverSrc}" alt="${imageAlt}" loading="lazy">
          <span class="cover-filename">${filename}</span>
          <span class="cover-number">${coverLabel}</span>
        </div>
      `;
  }

  return `
      <div class="project-cover cover-gradient ${tone}${classes}">
        <span class="cover-filename">${filename}</span>
        <span class="cover-number">${coverLabel}</span>
      </div>
    `;
}

function renderProjectAction(project, className = "project-action") {
  const safePlayLink = sanitizeUrl(project.playLink, "");
  if (safePlayLink && safePlayLink !== "#") {
    return `<a class="${className}" href="${safePlayLink}" target="_blank" rel="noreferrer">${escapeHtml(project.playLabel || "去游玩")}</a>`;
  }

  return `<span class="${className} disabled">暂未开放</span>`;
}

function renderTagList(items, className) {
  return (items || [])
    .map(item => `<span class="${className}">${escapeHtml(item)}</span>`)
    .join("");
}

function renderContactCards(cards) {
  return (cards || []).map(card => {
    const label = escapeHtml(card.label);
    const value = escapeHtml(card.value);

    if (card.href) {
      const href = sanitizeUrl(card.href);
      const isExternal = href.startsWith("http://") || href.startsWith("https://");
      const rel = isExternal ? ' target="_blank" rel="noreferrer"' : "";

      return `
        <a class="contact-card" href="${href}"${rel}>
          <strong>${label}</strong>
          <span>${value}</span>
        </a>
      `;
    }

    return `
      <div class="contact-card">
        <strong>${label}</strong>
        <span>${value}</span>
      </div>
    `;
  }).join("");
}

function serializeSnapshot(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function injectStaticBlock(source, marker, content) {
  const pattern = new RegExp(`(<!-- STATIC:${marker}:start -->)([\\s\\S]*?)(<!-- STATIC:${marker}:end -->)`);
  if (!pattern.test(source)) {
    throw new Error(`Missing static marker: ${marker}`);
  }

  return source.replace(pattern, `$1\n${content}\n$3`);
}

function writeStaticPage(fileName, blocks) {
  const filePath = path.join(ROOT_DIR, fileName);
  let source = readFile(filePath);

  blocks.forEach(({ marker, content }) => {
    source = injectStaticBlock(source, marker, content);
  });

  writeFile(filePath, source);
}

function renderProjectsPageContent(site, projects) {
  const projectsPage = site.projectsPage || {};

  return `
          <div class="project-meta" id="project-meta">${escapeHtml(projectsPage.kicker || "Projects")}</div>
          <h1 class="project-title" id="page-title">${escapeHtml(projectsPage.headline || "项目列表")}</h1>
          <p class="project-lead" id="project-lead">${escapeHtml(projectsPage.lead || "这里直接展示项目封面、简介和游玩入口，不再单独跳转项目详情页。")}</p>
          <section class="project-grid" id="project-list" aria-label="项目列表">
            ${projects.map(project => `
              <article class="project-card" id="project-${escapeHtml(project.slug)}">
                ${renderProjectCover(project)}
                <div class="project-body">
                  <h2>${escapeHtml(project.title)}</h2>
                  <p class="summary">${escapeHtml(project.summary)}</p>
                  <div class="project-action-row">
                    ${renderProjectAction(project)}
                  </div>
                </div>
              </article>
            `).join("")}
          </section>
        `.trim();
}

function renderProfilePageContent(site, profile) {
  const profilePage = site.profilePage || {};

  return `
          <div class="profile-meta">${escapeHtml(profilePage.kicker || "Profile")}</div>
          <h1 class="profile-title" id="profile-title">${escapeHtml(profile.headline)}</h1>
          <p class="profile-summary">${escapeHtml(profile.summary)}</p>
          <div class="profile-page-grid">
            <div>
              <div class="profile-status" aria-label="当前状态">
                ${profile.status.map(item => `
                  <div class="profile-status-row">
                    <strong>${escapeHtml(item.label)}</strong>
                    <span>${escapeHtml(item.value)}</span>
                  </div>
                `).join("")}
              </div>
              <div class="timeline" aria-label="经历时间线">
                ${profile.timeline.map(item => `
                  <article class="timeline-item">
                    <time>${escapeHtml(item.time)}</time>
                    <div>
                      <h2>${escapeHtml(item.title)}</h2>
                      <p>${escapeHtml(item.description)}</p>
                    </div>
                  </article>
                `).join("")}
              </div>
            </div>
            <div class="skill-board" aria-label="技能矩阵">
              ${profile.skills.map(group => `
                <div class="skill-group">
                  <span class="skill-group-label">${escapeHtml(group.label)}</span>
                  <div class="skills">
                    ${renderTagList(group.items, "skill-tag")}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `.trim();
}

function renderContactPageContent(site, contact) {
  const contactPage = site.contactPage || {};

  return `
          <div class="contact-meta">${escapeHtml(contactPage.kicker || "Contact")}</div>
          <h1 class="contact-title" id="contact-title">${escapeHtml(contact.headline)}</h1>
          <p class="contact-summary">${escapeHtml(contact.summary)}</p>
          <div class="contact-layout">
            <div>
              <p class="contact-copy">${escapeHtml(contact.copy)}</p>
              <p class="contact-note">${escapeHtml(contact.note)}</p>
            </div>
            <div class="contact-actions">
              ${renderContactCards(contact.cards)}
            </div>
          </div>
        `.trim();
}

function buildStaticPageSnapshots(projects) {
  const site = readJson(SITE_PATH);
  const profile = readJson(PROFILE_PATH);
  const contact = readJson(CONTACT_PATH);

  writeStaticPage("projects.html", [
    {
      marker: "projects-content",
      content: renderProjectsPageContent(site, projects)
    },
    {
      marker: "projects-snapshot",
      content: serializeSnapshot({ site, projects })
    }
  ]);

  writeStaticPage("profile.html", [
    {
      marker: "profile-content",
      content: renderProfilePageContent(site, profile)
    },
    {
      marker: "profile-snapshot",
      content: serializeSnapshot({ site, profile })
    }
  ]);

  writeStaticPage("contact.html", [
    {
      marker: "contact-content",
      content: renderContactPageContent(site, contact)
    },
    {
      marker: "contact-snapshot",
      content: serializeSnapshot({ site, contact })
    }
  ]);
}

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
      body: normalizeMarkdownBody(body),
      file: publicFile
    };
  });

  writeJson(path.join(PUBLIC_POSTS_DIR, "index.json"), posts);
  return posts;
}

function main() {
  const projects = buildProjects();
  const posts = buildPosts();
  buildStaticPageSnapshots(projects);

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
