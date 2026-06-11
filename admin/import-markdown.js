(function initMarkdownImport() {
  window.__markdownImportLoaded = true;
  document.documentElement.setAttribute("data-md-import", "loaded");

  const STORAGE_KEY = "decap-markdown-import-payload";

  function normalizeString(value) {
    return String(value ?? "").trim();
  }

  function todayString() {
    return new Date().toISOString().slice(0, 10);
  }

  function slugify(value) {
    return normalizeString(value)
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `imported-post-${Date.now()}`;
  }

  function parseScalar(rawValue) {
    const value = normalizeString(rawValue);
    if (value === "true") return true;
    if (value === "false") return false;
    if (/^['"].*['"]$/.test(value)) return value.slice(1, -1);
    return value;
  }

  function parseMarkdownEntry(markdown) {
    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) {
      return { data: {}, body: normalizeString(markdown) };
    }

    const data = {};
    const lines = match[1].split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!normalizeString(line)) continue;

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

    return {
      data,
      body: normalizeString(match[2])
    };
  }

  function inferTitle(body, fallback) {
    const headingMatch = body.match(/^#\s+(.+)$/m);
    return normalizeString(headingMatch ? headingMatch[1] : fallback);
  }

  function inferSummary(body) {
    const cleaned = body
      .replace(/^#.+$/gm, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/\[[^\]]+\]\([^)]+\)/g, "$1")
      .split(/\n\s*\n/)
      .map(part => normalizeString(part))
      .find(Boolean) || "";

    return cleaned.slice(0, 96);
  }

  function normalizeDate(value) {
    const raw = normalizeString(value);
    if (!raw) return todayString();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return todayString();
  }

  function buildPayload(fileName, markdown) {
    const { data, body } = parseMarkdownEntry(markdown);
    const baseName = fileName.replace(/\.md$/i, "");
    const title = normalizeString(data.title) || inferTitle(body, baseName);

    return {
      slug: slugify(data.slug || title || baseName),
      title: title || baseName,
      date: normalizeDate(data.date),
      summary: normalizeString(data.summary) || inferSummary(body) || `${title || baseName} 的文章摘要待补充。`,
      tags: Array.isArray(data.tags) && data.tags.length > 0
        ? data.tags.map(item => normalizeString(item)).filter(Boolean)
        : ["Imported"],
      body: body || `# ${title || baseName}`,
      sourceName: fileName
    };
  }

  function getStoredPayload() {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function setStoredPayload(payload) {
    window.__markdownImportPayload = payload;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function clearStoredPayload() {
    window.__markdownImportPayload = null;
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  function findValueSetter(element) {
    let proto = Object.getPrototypeOf(element);
    while (proto) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
      if (descriptor && typeof descriptor.set === "function") {
        return descriptor.set;
      }
      proto = Object.getPrototypeOf(proto);
    }
    return null;
  }

  function setFormValue(element, value) {
    if (!element) return;
    const setter = findValueSetter(element);
    if (setter) {
      setter.call(element, value);
    }
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function includesLabelText(element, labelText) {
    return normalizeString(element?.textContent).includes(labelText);
  }

  function findFieldControl(labelText, selector) {
    const labels = [...document.querySelectorAll("label")].filter(label => includesLabelText(label, labelText));
    const scopes = [];

    labels.forEach(label => {
      if (label.control?.matches(selector)) {
        scopes.push(label.control);
      }

      [
        label,
        label.parentElement,
        label.closest("div"),
        label.closest("section"),
        label.parentElement?.parentElement
      ].filter(Boolean).forEach(scope => scopes.push(scope));
    });

    for (const scope of scopes) {
      if (scope.matches?.(selector)) {
        return scope;
      }

      const nested = scope.querySelector?.(selector);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  function findTextInput(position) {
    const textInputs = [...document.querySelectorAll('input[type="text"]')];
    return textInputs[position] || null;
  }

  function resolveCollectionName(collection) {
    if (!collection) return null;
    if (typeof collection.get === "function") {
      return collection.get("name");
    }
    if (typeof collection.name === "string") {
      return collection.name;
    }
    return null;
  }

  function syncSummaryField(payload) {
    const summaryTextarea = findFieldControl("文章摘要", "textarea") || document.querySelector("textarea");
    if (!summaryTextarea) return false;
    setFormValue(summaryTextarea, payload.summary);
    return true;
  }

  function syncBodyField(payload) {
    const textareas = [...document.querySelectorAll("textarea")];
    const bodyTextarea = findFieldControl("文章正文", "textarea") || textareas[textareas.length - 1];
    if (!bodyTextarea) return false;
    setFormValue(bodyTextarea, payload.body);
    return true;
  }

  function applyPayloadToEditor(payload) {
    const slugInput = findFieldControl("URL 标识", 'input[type="text"]') || findTextInput(0);
    const titleInput = findFieldControl("文章标题", 'input[type="text"]') || findTextInput(1);
    const dateInput = findFieldControl("发布日期", 'input[type="date"], input[type="text"]') || document.querySelector('input[type="date"]');

    setFormValue(slugInput, payload.slug);
    setFormValue(titleInput, payload.title);
    setFormValue(dateInput, payload.date);
    const summarySynced = syncSummaryField(payload);
    const bodySynced = syncBodyField(payload);

    return {
      summarySynced,
      bodySynced
    };
  }

  function renderPanelState(panel, payload, errorMessage, syncState = null) {
    const summary = panel.querySelector("[data-import-summary]");
    const error = panel.querySelector("[data-import-error]");

    if (payload) {
      const bodyPreview = payload.body
        .replace(/\s+/g, " ")
        .slice(0, 160);

      summary.innerHTML = `
        <strong>${payload.title}</strong>
        <span>slug: ${payload.slug}</span>
        <span>date: ${payload.date}</span>
        <span>tags: ${payload.tags.join(", ")}</span>
        <span>summary: ${payload.summary}</span>
        <span>body: ${bodyPreview}${payload.body.length > 160 ? "…" : ""}</span>
        <span class="markdown-import-note">${syncState?.bodySynced === false ? "正文已缓存，保存时仍会写入文章文件；如果编辑器刚重绘，稍等片刻会再次回填。" : "正文已导入 Markdown 编辑框，保存时会按原始 Markdown 发布。"}</span>
      `;
      summary.hidden = false;
    } else {
      summary.hidden = true;
      summary.innerHTML = "";
    }

    if (errorMessage) {
      error.textContent = errorMessage;
      error.hidden = false;
    } else {
      error.hidden = true;
      error.textContent = "";
    }
  }

  function buildImportPanel() {
    const panel = document.createElement("section");
    panel.id = "markdown-import-panel";
    panel.className = "markdown-import-panel";
    panel.innerHTML = `
      <div class="markdown-import-head">
        <strong>导入本地 Markdown</strong>
        <p>选择本地 .md 文件后，会自动解析 frontmatter 和正文，并填充到当前文章表单里。正文会按原始 Markdown 写入文本框。</p>
      </div>
      <div class="markdown-import-actions">
        <label class="markdown-import-button">
          <input type="file" accept=".md,text/markdown,text/plain" hidden>
          选择本地 Markdown 文件
        </label>
        <button type="button" class="markdown-import-clear">清除导入</button>
      </div>
      <div class="markdown-import-summary" data-import-summary hidden></div>
      <p class="markdown-import-error" data-import-error hidden></p>
    `;

    const fileInput = panel.querySelector('input[type="file"]');
    const clearButton = panel.querySelector(".markdown-import-clear");

    fileInput.addEventListener("change", event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const payload = buildPayload(file.name, String(reader.result || ""));
          setStoredPayload(payload);
          const syncState = applyPayloadToEditor(payload);
          renderPanelState(panel, payload, "", syncState);
        } catch (error) {
          renderPanelState(panel, null, error.message || "Markdown 解析失败。");
        }
      };
      reader.onerror = () => {
        renderPanelState(panel, null, "文件读取失败。");
      };
      reader.readAsText(file, "utf-8");
      event.target.value = "";
    });

    clearButton.addEventListener("click", () => {
      clearStoredPayload();
      renderPanelState(panel, null, "");
    });

    const payload = getStoredPayload();
    if (payload) {
      const syncState = applyPayloadToEditor(payload);
      renderPanelState(panel, payload, "", syncState);
    }

    return panel;
  }

  function ensureImportPanel() {
    if (!window.location.hash.includes("#/collections/posts/")) return;
    if (document.querySelector("#markdown-import-panel")) return;

    const firstTextInput = document.querySelector('input[type="text"]');
    if (!firstTextInput) return;

    const anchor = firstTextInput.closest("div");
    const container = anchor && anchor.parentElement;
    if (!container) return;

    container.insertBefore(buildImportPanel(), anchor);
  }

  function waitForCMS() {
    if (!window.CMS) {
      window.setTimeout(waitForCMS, 120);
      return;
    }

    const Immutable = window.Immutable;

    window.CMS.registerEventListener({
      name: "preSave",
      handler: ({ entry, collection }) => {
        const collectionName = resolveCollectionName(collection);
        const entryData = entry && typeof entry.get === "function"
          ? entry.get("data")
          : entry;

        if (!entryData) return entryData;
        if (collectionName && collectionName !== "posts") return entryData;
        if (!collectionName && !window.location.hash.includes("#/collections/posts/")) return entryData;

        const payload = window.__markdownImportPayload || getStoredPayload();
        if (!payload) {
          return entryData;
        }

        let next = entryData
          .set("slug", payload.slug)
          .set("title", payload.title)
          .set("date", payload.date)
          .set("summary", payload.summary)
          .set("body", payload.body);

        if (Immutable && typeof Immutable.fromJS === "function") {
          next = next.set("tags", Immutable.fromJS(payload.tags || ["Imported"]));
        } else {
          next = next.set("tags", payload.tags || ["Imported"]);
        }

        return next;
      }
    });

    window.CMS.registerEventListener({
      name: "postSave",
      handler: ({ collection }) => {
        const collectionName = resolveCollectionName(collection);
        if (collectionName === "posts" || (!collectionName && window.location.hash.includes("#/collections/posts/"))) {
          clearStoredPayload();
          const panel = document.querySelector("#markdown-import-panel");
          if (panel) {
            renderPanelState(panel, null, "");
          }
        }
      }
    });

    window.__markdownImportRegistered = true;
    document.documentElement.setAttribute("data-md-import", "registered");
    ensureImportPanel();

    const observer = new MutationObserver(() => ensureImportPanel());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("hashchange", () => {
      window.setTimeout(ensureImportPanel, 80);
    });
  }

  const style = document.createElement("style");
  style.textContent = `
    .markdown-import-panel {
      margin-bottom: 20px;
      padding: 14px;
      border: 1px dashed rgba(33, 44, 54, 0.24);
      border-radius: 10px;
      background: rgba(247, 249, 252, 0.9);
    }
    .markdown-import-head p,
    .markdown-import-summary span,
    .markdown-import-error {
      margin: 8px 0 0;
      font-size: 13px;
      line-height: 1.6;
    }
    .markdown-import-actions {
      display: flex;
      gap: 12px;
      margin-top: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .markdown-import-button,
    .markdown-import-clear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 0 14px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
    }
    .markdown-import-button {
      color: #fff;
      background: #2f6feb;
    }
    .markdown-import-clear {
      color: #2f6feb;
      background: transparent;
    }
    .markdown-import-summary {
      display: grid;
      gap: 4px;
      margin-top: 12px;
      padding: 12px;
      border-radius: 8px;
      background: #fff;
    }
    .markdown-import-error {
      color: #c62828;
    }
    .markdown-import-note {
      color: #41526a;
    }
  `;
  document.head.appendChild(style);

  waitForCMS();
})();
