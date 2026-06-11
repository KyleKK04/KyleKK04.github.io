const SiteContent = (() => {
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

  function renderTagList(items, className) {
    return (items || [])
      .map(item => `<span class="${className}">${escapeHtml(item)}</span>`)
      .join("");
  }

  function renderProjectAction(project, options = {}) {
    const safePlayLink = sanitizeUrl(project.playLink, "");
    const className = options.className || "project-action";

    if (safePlayLink && safePlayLink !== "#") {
      return `<a class="${className}" href="${safePlayLink}" target="_blank" rel="noreferrer">${escapeHtml(project.playLabel || "去游玩")}</a>`;
    }

    return `<span class="${className} disabled">暂未开放</span>`;
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

  function applyMeta(meta = {}) {
    if (meta.title) {
      document.title = meta.title;
    }

    if (meta.description) {
      const descriptionTag = document.querySelector('meta[name="description"]');
      if (descriptionTag) {
        descriptionTag.setAttribute("content", meta.description);
      }
    }

    if (meta.ogTitle) {
      const ogTitleTag = document.querySelector('meta[property="og:title"]');
      if (ogTitleTag) {
        ogTitleTag.setAttribute("content", meta.ogTitle);
      }
    }

    if (meta.ogDescription) {
      const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
      if (ogDescriptionTag) {
        ogDescriptionTag.setAttribute("content", meta.ogDescription);
      }
    }

    if (meta.ogUrl) {
      const ogUrlTag = document.querySelector('meta[property="og:url"]');
      if (ogUrlTag) {
        ogUrlTag.setAttribute("content", meta.ogUrl);
      }
    }
  }

  function applyNavigation(site) {
    const navigation = site?.navigation || {};
    const logo = document.querySelector("[data-site-logo]");
    if (logo && site?.siteName) {
      logo.textContent = site.siteName;
    }

    document.querySelectorAll("[data-owner-name]").forEach(node => {
      if (site?.ownerName) {
        node.textContent = site.ownerName;
      }
    });

    document.querySelectorAll("[data-nav-key]").forEach(link => {
      const key = link.dataset.navKey;
      if (navigation[key]) {
        link.textContent = navigation[key];
      }
    });
  }

  function applyTheme(site) {
    const backgroundImage = sanitizeUrl(site?.backgroundImage, "");
    const backgroundFit = site?.backgroundFit === "cover" ? "cover" : "contain";
    const allowedPositions = new Set(["center", "top", "bottom", "left", "right"]);
    const backgroundPosition = allowedPositions.has(site?.backgroundPosition) ? site.backgroundPosition : "center";
    if (!backgroundImage) return;
    document.documentElement.style.setProperty("--bg-image", `url(\"${backgroundImage}\")`);
    document.documentElement.style.setProperty("--bg-image-fit", backgroundFit);
    document.documentElement.style.setProperty("--bg-image-position", backgroundPosition);
  }

  function shouldHydrateFromSourceFiles() {
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    return response.json();
  }

  async function fetchText(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    return response.text();
  }

  function parseFrontmatterValue(rawValue) {
    const value = String(rawValue ?? "").trim();
    if (value === "true") return true;
    if (value === "false") return false;
    if (/^['"].*['"]$/.test(value)) return value.slice(1, -1);
    return value;
  }

  function parseMarkdownEntry(markdown) {
    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) {
      return {
        data: {},
        body: String(markdown ?? "").trim()
      };
    }

    const data = {};
    const lines = match[1].split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line.trim()) continue;

      const keyMatch = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
      if (!keyMatch) continue;

      const key = keyMatch[1];
      const rawValue = keyMatch[2] || "";

      if (rawValue === "") {
        const listValues = [];
        let cursor = index + 1;

        while (cursor < lines.length) {
          const listMatch = lines[cursor].match(/^\s*-\s+(.+)$/);
          if (!listMatch) break;
          listValues.push(parseFrontmatterValue(listMatch[1]));
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

      data[key] = parseFrontmatterValue(rawValue);
    }

    return {
      data,
      body: String(match[2] ?? "").trim()
    };
  }

  async function fetchProjects() {
    const index = await fetchJson("projects/index.json");
    if (!shouldHydrateFromSourceFiles()) {
      return index;
    }

    return Promise.all(index.map(async project => {
      if (!project.sourceFile) return project;

      try {
        const markdown = await fetchText(project.sourceFile);
        const { data: frontmatter } = parseMarkdownEntry(markdown);
        return {
          ...project,
          ...frontmatter,
          featured: frontmatter.featured !== false
        };
      } catch (_error) {
        return project;
      }
    }));
  }

  async function fetchPosts() {
    const index = await fetchJson("posts/index.json");
    if (!shouldHydrateFromSourceFiles()) {
      return index;
    }

    return Promise.all(index.map(async post => {
      if (!post.sourceFile) return post;

      try {
        const markdown = await fetchText(post.sourceFile);
        const { data: frontmatter, body } = parseMarkdownEntry(markdown);
        return {
          ...post,
          ...frontmatter,
          body
        };
      } catch (_error) {
        return post;
      }
    }));
  }

  return {
    escapeHtml,
    sanitizeUrl,
    renderProjectCover,
    renderProjectAction,
    renderTagList,
    renderContactCards,
    applyMeta,
    applyNavigation,
    applyTheme,
    fetchJson,
    fetchProjects,
    fetchPosts,
    parseMarkdownEntry
  };
})();
