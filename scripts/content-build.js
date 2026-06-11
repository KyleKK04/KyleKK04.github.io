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

function sanitizeSlug(value, fallback = "post") {
  const safeValue = String(value ?? "").trim();
  if (/^[A-Za-z0-9_-]+$/.test(safeValue)) {
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

function renderInlineMarkdown(value) {
  let html = escapeHtml(String(value ?? ""));

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, href) => {
    const safeHref = sanitizeUrl(href, "#");
    const altText = alt || "";
    return `<img src="${safeHref}" alt="${escapeHtml(altText)}" loading="lazy">`;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const safeHref = sanitizeUrl(href, "#");
    const isExternal = safeHref.startsWith("http://") || safeHref.startsWith("https://");
    const rel = isExternal ? ' target="_blank" rel="noreferrer"' : "";
    return `<a href="${safeHref}"${rel}>${escapeHtml(label)}</a>`;
  });

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  return html;
}

function closeList(state, html) {
  while (state.listStack.length > 0) {
    const type = state.listStack.pop();
    html.push(`</${type}>`);
  }
}

function openList(state, html, type) {
  if (state.listStack.length === 0 || state.listStack[state.listStack.length - 1] !== type) {
    html.push(`<${type}>`);
    state.listStack.push(type);
  }
}

function dedentListStack(state, html, indent) {
  while (state.listStack.length > indent) {
    const type = state.listStack.pop();
    html.push(`</${type}>`);
  }
}

function isBlank(line) {
  return !line || !line.trim();
}

function lineIndent(line) {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

function stripFrontmatter(markdown) {
  return String(markdown ?? "").replace(/^---[\s\S]*?---\s*/, "");
}

function stripTitleHeading(content, currentTitle) {
  if (!currentTitle) return content;
  const escapedTitle = currentTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content.replace(new RegExp(`^#\\s+${escapedTitle}\\s*\\n+`), "");
}

function renderMarkdownToHtml(markdown, currentTitle = "") {
  let content = stripFrontmatter(markdown);
  content = stripTitleHeading(content, currentTitle);

  const lines = content.split(/\r?\n/);
  const html = [];
  const state = { listStack: [], inCode: false, codeLines: [], codeLang: "" };
  const LIST_INDENT = 2;

  for (const line of lines) {
    const codeFence = line.trim().match(/^```(\w*)\s*$/);
    if (codeFence) {
      if (state.inCode) {
        const langAttr = state.codeLang ? ` class="language-${state.codeLang}"` : "";
        html.push(`<pre><code${langAttr}>${escapeHtml(state.codeLines.join("\n"))}</code></pre>`);
        state.codeLines = [];
        state.inCode = false;
        state.codeLang = "";
      } else {
        closeList(state, html);
        state.inCode = true;
        state.codeLang = codeFence[1] || "";
      }
      continue;
    }

    if (state.inCode) {
      state.codeLines.push(line);
      continue;
    }

    if (isBlank(line)) {
      closeList(state, html);
      continue;
    }

    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      closeList(state, html);
      html.push("<hr>");
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList(state, html);
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const quote = line.match(/^>\s+(.+)$/);
    if (quote) {
      closeList(state, html);
      html.push(`<blockquote>${renderInlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }

    const indent = lineIndent(line);
    const trimmed = line.trim();
    const listLevel = Math.floor(indent / LIST_INDENT);

    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      dedentListStack(state, html, listLevel);
      openList(state, html, "ul");
      html.push(`<li>${renderInlineMarkdown(unordered[1])}</li>`);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      dedentListStack(state, html, listLevel);
      openList(state, html, "ol");
      html.push(`<li>${renderInlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    closeList(state, html);
    html.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }

  closeList(state, html);
  return html.join("\n");
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

function renderHomePageContent(site, projects, posts, profile, contact) {
  const home = site.home || {};
  const sections = home.sections || {};
  const heroCopy = home.hero || {};
  const profilePreview = home.profilePreview || {};
  const projectsSection = sections.projects || {};
  const profileSection = sections.profile || {};
  const notesSection = sections.notes || {};
  const contactSection = sections.contact || {};
  const featuredProjects = projects.filter(project => project.featured !== false).slice(0, 5);
  const notePreviews = posts.slice(0, 3);
  const kickerItems = Array.isArray(heroCopy.kicker) && heroCopy.kicker.length > 0
    ? heroCopy.kicker
    : (profile.hero?.kicker || []);
  const readoutItems = Array.isArray(heroCopy.readout) && heroCopy.readout.length > 0
    ? heroCopy.readout
    : (profile.hero?.readout || []);

  return `
      <section class="hero" aria-labelledby="hero-title">
        <div>
          <div class="hero-kicker" id="hero-kicker">
            ${kickerItems.map(item => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
          <h1 class="hero-title" id="hero-title">
            <span id="hero-name">${escapeHtml(heroCopy.name || profile.hero?.name || site.ownerName || site.siteName || "KyleKK")}</span>
            <span class="highlight" id="hero-highlight">${escapeHtml(heroCopy.highlight || profile.hero?.highlight || "Game Dev Lab")}</span>
          </h1>
          <div class="hero-text" id="hero-text">${escapeHtml(heroCopy.description || profile.hero?.description || "")}</div>
          <div class="actions">
            <a class="button primary" href="projects.html" id="hero-primary-link">${escapeHtml(heroCopy.primaryLabel || "查看项目")}</a>
            <a class="button secondary" href="profile.html" id="hero-secondary-link">${escapeHtml(heroCopy.secondaryLabel || "查看经历与技能")}</a>
          </div>
          <div class="hero-readout" aria-label="核心方向" id="hero-readout">
            ${readoutItems.map(item => `
              <div class="readout-item">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(item.value)}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="terminal-window profile-panel" aria-label="个人概览">
          <div class="window-header">
            <span class="window-dot red"></span>
            <span class="window-dot yellow"></span>
            <span class="window-dot green"></span>
            <span class="window-title" id="home-panel-window-title">${escapeHtml(home.panelWindowTitle || "status.log")}</span>
          </div>
          <div class="window-body profile-body">
            <div class="avatar">K</div>
            <h2 id="profile-panel-role">${escapeHtml(profilePreview.panelTitle || profile.panelTitle || "Gameplay Developer Intern")}</h2>
            <div id="profile-panel-summary">${escapeHtml(profilePreview.summary || profile.summary || "")}</div>
            <div class="status-list" id="profile-panel-status">
              ${profile.status.map(item => `
                <div class="status-row">
                  <strong>${escapeHtml(item.label)}</strong>
                  <span>${escapeHtml(item.value)}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </section>

      <section class="module reveal" id="projects">
        <div class="module-head">
          <div>
            <span class="module-kicker" id="home-projects-kicker">${escapeHtml(projectsSection.kicker || "Projects")}</span>
            <h2 class="module-title" id="home-projects-title">${escapeHtml(projectsSection.title || "精选项目")}</h2>
          </div>
          <a class="detail-link" href="projects.html" id="home-projects-detail">${escapeHtml(projectsSection.detailLabel || "查看全部项目")}</a>
        </div>
        <p class="module-copy" id="home-projects-lead">${escapeHtml(projectsSection.lead || "首页保留少量项目入口，完整项目封面、简介和游玩入口会集中在项目页维护。")}</p>
        <div class="project-highlight-list" id="project-highlight-list" aria-label="精选项目列表">
          ${featuredProjects.map((project, index) => `
            <article class="project-tile ${index === 0 ? "featured" : ""}" id="home-project-${escapeHtml(project.slug)}">
              ${renderProjectCover(project)}
              <div class="project-info">
                <h3>${escapeHtml(project.title)}</h3>
                <p>${escapeHtml(project.summary)}</p>
                <div class="project-cta-row">
                  ${renderProjectAction(project, "project-cta")}
                </div>
              </div>
            </article>
          `).join("")}
        </div>
      </section>

      <section class="module reveal" id="profile">
        <div class="module-head">
          <div>
            <span class="module-kicker" id="home-profile-kicker">${escapeHtml(profileSection.kicker || "Profile")}</span>
            <h2 class="module-title" id="home-profile-title">${escapeHtml(profileSection.title || "经历与技能")}</h2>
          </div>
          <a class="detail-link" href="profile.html" id="home-profile-detail">${escapeHtml(profileSection.detailLabel || "打开经历页")}</a>
        </div>
        <div class="profile-grid">
          <div class="timeline" aria-label="经历时间线" id="profile-timeline">
            ${profile.timeline.map(item => `
              <article class="timeline-item">
                <time>${escapeHtml(item.time)}</time>
                <div>
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.description)}</p>
                </div>
              </article>
            `).join("")}
          </div>

          <div class="skill-board" aria-label="技能矩阵" id="profile-skill-board">
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
      </section>

      <section class="module reveal" id="notes">
        <div class="module-head">
          <div>
            <span class="module-kicker" id="home-notes-kicker">${escapeHtml(notesSection.kicker || "Notes")}</span>
            <h2 class="module-title" id="home-notes-title">${escapeHtml(notesSection.title || "技术博客")}</h2>
          </div>
          <a class="detail-link" href="blog.html" id="home-notes-detail">${escapeHtml(notesSection.detailLabel || "查看全部博客")}</a>
        </div>
        <div class="notes-grid" id="note-preview-list" aria-label="博客预览列表">
          ${notePreviews.map(post => `
            <a class="note-card" href="${getPostPageHref(post)}">
              <small>${escapeHtml(post.date)}</small>
              <h3>${escapeHtml(post.title)}</h3>
              <p>${escapeHtml(post.summary)}</p>
              <div class="note-tags">
                ${renderTagList(post.tags, "mini-tag")}
              </div>
            </a>
          `).join("")}
        </div>
      </section>

      <section class="module reveal" id="contact">
        <div class="module-head">
          <div>
            <span class="module-kicker" id="home-contact-kicker">${escapeHtml(contactSection.kicker || "Contact")}</span>
            <h2 class="module-title" id="home-contact-title">${escapeHtml(contactSection.title || "联系我")}</h2>
          </div>
          <a class="detail-link" href="contact.html" id="home-contact-detail">${escapeHtml(contactSection.detailLabel || "打开联系页")}</a>
        </div>
        <div class="contact-layout">
          <div class="contact-copy" id="contact-copy">${escapeHtml(contact.summary || "")}</div>
          <div class="contact-actions" id="contact-actions">
            ${renderContactCards(contact.cards)}
          </div>
        </div>
      </section>
    `.trim();
}

function getPostPageHref(post, basePath = "") {
  return `${basePath}posts/${sanitizeSlug(post.slug)}.html`;
}

function renderBlogListContent(site, posts) {
  const blogPage = site.blogPage || {};

  return `
          <div class="article-meta" id="article-meta" style="display:none"></div>
          <h1 class="article-title" id="article-title">${escapeHtml(blogPage.listTitle || "技术博客")}</h1>
          <p class="article-summary" id="article-summary">${renderInlineMarkdown(blogPage.listSummary || "技术复盘、项目笔记和学习记录。").replace(/\n/g, "")}</p>
          <div class="post-tags" id="article-tags"></div>
          <div class="reader-content" id="reader-content">
            <div class="post-list">${posts.map(post => `
                <a class="post-option" href="${getPostPageHref(post)}">
                  <small>${escapeHtml(post.date)}</small>
                  <h3>${escapeHtml(post.title)}</h3>
                  <p>${renderInlineMarkdown(post.summary || "")}</p>
                  <div class="post-tags">
                    ${renderTagList(post.tags, "mini-tag")}
                  </div>
                </a>`).join("")}
            </div>
          </div>
        `.trim();
}

function renderBlogPostPage(site, post) {
  const ownerName = escapeHtml(site.ownerName || "KyleKK");
  const siteName = escapeHtml(site.siteName || "KyleKK");
  const navigation = site.navigation || {};
  const safeSlug = sanitizeSlug(post.slug);
  const title = escapeHtml(post.title);
  const summaryHtml = renderInlineMarkdown(post.summary || "");
  const bodyHtml = renderMarkdownToHtml(post.body || "", post.title);
  const backgroundImage = sanitizeUrl(site.backgroundImage, "/res/background.jpg");
  const backgroundFit = site.backgroundFit === "cover" ? "cover" : "contain";
  const allowedPositions = new Set(["center", "top", "bottom", "left", "right"]);
  const backgroundPosition = allowedPositions.has(site.backgroundPosition) ? site.backgroundPosition : "center";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(post.summary || "")}">
  <title>${title} | ${ownerName}</title>
  <meta property="og:title" content="${title} | ${ownerName}">
  <meta property="og:description" content="${escapeHtml(post.summary || "")}">
  <meta property="og:url" content="https://kylekk.com/posts/${safeSlug}.html">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <link rel="stylesheet" href="../styles/main.css?v=20260611-blog-readability-3">
  <style>
    :root {
      --bg-image: url("${backgroundImage}");
      --bg-image-fit: ${backgroundFit};
      --bg-image-position: ${backgroundPosition};
    }

    body {
      background:
        radial-gradient(circle at 15% 10%, rgba(83, 216, 140, 0.04), transparent 30rem),
        radial-gradient(circle at 80% 20%, rgba(111, 183, 214, 0.025), transparent 25rem),
        var(--bg);
      line-height: 1.75;
    }

    .page {
      width: min(1080px, calc(100% - 40px));
    }

    .article-window {
      margin: 0 0 54px;
    }

    .article-window .window-body {
      padding: 38px 40px 42px;
    }

    .article-meta {
      margin-bottom: 14px;
      color: var(--primary);
      font-size: 12px;
      font-weight: 600;
    }

    .article-title {
      max-width: 920px;
      margin-bottom: 16px;
      font-size: 38px;
      line-height: 1.14;
      letter-spacing: -0.01em;
      overflow-wrap: anywhere;
      font-weight: 700;
    }

    .article-summary {
      max-width: 52em;
      margin-bottom: 24px;
      color: #d9e1de;
      font-size: 15px;
      line-height: 1.9;
      font-weight: 500;
    }

    .article-summary strong {
      color: #f4f7f6;
    }

    .reader-content .katex {
      color: #dfe7e3;
    }

    .reader-content .katex-display {
      margin: 1.2rem 0;
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 0.15rem;
    }

    .article-window .mini-tag {
      color: #b8ffd5;
      background: rgba(83, 216, 140, 0.24);
      border-color: rgba(83, 216, 140, 0.48);
      box-shadow: inset 0 0 0 1px rgba(83, 216, 140, 0.08);
    }

    .reader-content {
      max-width: 52em;
      color: #e0e7e3;
      font-size: 14px;
      line-height: 1.95;
    }

    .reader-content p,
    .reader-content ul,
    .reader-content ol,
    .reader-content li {
      color: #dce5e1;
    }

    .reader-content p {
      margin: 15px 0;
    }

    .reader-content ul,
    .reader-content ol {
      margin: 15px 0 15px 26px;
    }

    .reader-content li {
      margin: 6px 0;
      padding-left: 2px;
    }

    .reader-content strong {
      color: #f5f7f6;
      font-weight: 700;
    }

    .reader-content h1,
    .reader-content h2,
    .reader-content h3 {
      max-width: 28em;
      margin-top: 34px;
      color: #f3f6f4;
    }

    .reader-content blockquote {
      color: #dce5e1;
      background: rgba(255, 255, 255, 0.03);
      border-left: 3px solid rgba(83, 216, 140, 0.82);
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
    }

    .reader-content code {
      padding: 0.12em 0.32em;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.06);
      color: #eef6f1;
    }

    .reader-content pre {
      margin: 18px 0;
      padding: 16px 18px;
      overflow-x: auto;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.28);
    }

    .reader-content pre code {
      padding: 0;
      background: transparent;
    }

    .post-link {
      color: var(--primary);
    }

    @media (max-width: 640px) {
      .article-window .window-body {
        padding: 22px;
      }

      .article-title {
        font-size: 28px;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="nav">
      <a class="logo" href="../index.html">${siteName}</a>
      <nav class="nav-links" aria-label="主导航">
        <a href="../projects.html">${escapeHtml(navigation.projects || "Projects")}</a>
        <a href="../profile.html">${escapeHtml(navigation.profile || "Profile")}</a>
        <a class="active" href="../blog.html">${escapeHtml(navigation.notes || "Notes")}</a>
        <a href="../contact.html">${escapeHtml(navigation.contact || "Contact")}</a>
      </nav>
    </header>

    <main>
      <article class="terminal-window article-window">
        <div class="window-header">
          <span class="window-dot red"></span>
          <span class="window-dot yellow"></span>
          <span class="window-dot green"></span>
          <span class="window-title">${escapeHtml(safeSlug)}.md</span>
        </div>
        <div class="window-body">
          <div class="article-meta">${escapeHtml(post.date)}</div>
          <h1 class="article-title">${title}</h1>
          <p class="article-summary" id="article-summary">${summaryHtml}</p>
          <div class="post-tags">
            ${renderTagList(post.tags, "mini-tag")}
          </div>
          <div class="reader-content" id="reader-content">
            ${bodyHtml}
          </div>
          <p style="margin-top:28px"><a class="post-link" href="../blog.html">返回博客列表</a></p>
        </div>
      </article>
    </main>

    <footer>
      <p>&copy; <span id="current-year">${new Date().getFullYear()}</span> ${ownerName}</p>
    </footer>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
  <script src="../scripts/post-page.js"></script>
</body>
</html>
`;
}

function buildStaticPageSnapshots(projects, posts) {
  const site = readJson(SITE_PATH);
  const profile = readJson(PROFILE_PATH);
  const contact = readJson(CONTACT_PATH);

  writeStaticPage("index.html", [
    {
      marker: "home-main",
      content: renderHomePageContent(site, projects, posts, profile, contact)
    },
    {
      marker: "home-snapshot",
      content: serializeSnapshot({ site, projects, posts, profile, contact })
    }
  ]);

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

  writeStaticPage("blog.html", [
    {
      marker: "blog-content",
      content: renderBlogListContent(site, posts)
    },
    {
      marker: "blog-snapshot",
      content: serializeSnapshot({ site, posts })
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

  if (fs.existsSync(PUBLIC_POSTS_DIR)) {
    fs.readdirSync(PUBLIC_POSTS_DIR)
      .filter(fileName => fileName.endsWith(".html"))
      .forEach(fileName => {
        fs.unlinkSync(path.join(PUBLIC_POSTS_DIR, fileName));
      });
  }

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

  const site = readJson(SITE_PATH);
  posts.forEach(post => {
    writeFile(
      path.join(PUBLIC_POSTS_DIR, `${sanitizeSlug(post.slug)}.html`),
      renderBlogPostPage(site, post)
    );
  });

  writeJson(path.join(PUBLIC_POSTS_DIR, "index.json"), posts);
  return posts;
}

function main() {
  const projects = buildProjects();
  const posts = buildPosts();
  buildStaticPageSnapshots(projects, posts);

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
