const MarkdownParser = (() => {
  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderInline(value) {
    let html = escapeHtml(value);

    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, href) => {
      const safeHref = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("/") || href.startsWith("#") ? href : "#";
      const altText = alt || "";
      return `<img src="${safeHref}" alt="${altText}" loading="lazy">`;
    });

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      const safeHref = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("/") || href.startsWith("#") ? href : "#";
      const isExternal = safeHref.startsWith("http");
      const rel = isExternal ? ' target="_blank" rel="noreferrer"' : "";
      return `<a href="${safeHref}"${rel}>${label}</a>`;
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
    return markdown.replace(/^---[\s\S]*?---\s*/, "");
  }

  function stripTitleHeading(content, currentTitle) {
    if (!currentTitle) return content;
    const escapedTitle = currentTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return content.replace(new RegExp(`^#\\s+${escapedTitle}\\s*\\n+`), "");
  }

  function toHtml(markdown, currentTitle = "") {
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
        html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
        continue;
      }

      const quote = line.match(/^>\s+(.+)$/);
      if (quote) {
        closeList(state, html);
        html.push(`<blockquote>${renderInline(quote[1])}</blockquote>`);
        continue;
      }

      const indent = lineIndent(line);
      const trimmed = line.trim();
      const listLevel = Math.floor(indent / LIST_INDENT);

      const unordered = trimmed.match(/^[-*]\s+(.+)$/);
      if (unordered) {
        dedentListStack(state, html, listLevel);
        openList(state, html, "ul");
        html.push(`<li>${renderInline(unordered[1])}</li>`);
        continue;
      }

      const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
      if (ordered) {
        dedentListStack(state, html, listLevel);
        openList(state, html, "ol");
        html.push(`<li>${renderInline(ordered[1])}</li>`);
        continue;
      }

      closeList(state, html);
      html.push(`<p>${renderInline(line)}</p>`);
    }

    closeList(state, html);
    return html.join("\n");
  }

  return { toHtml, renderInline, escapeHtml, stripFrontmatter };
})();
