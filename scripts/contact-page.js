document.querySelector("#current-year").textContent = new Date().getFullYear();

const contactShell = document.querySelector("#contact-content");
const contactWindowTitle = document.querySelector("#contact-window-title");
let siteCopy = null;

function renderContact(contact) {
  const ownerName = siteCopy?.ownerName || "朱绪达 KyleKK";
  const contactPage = siteCopy?.contactPage || {};
  SiteContent.applyNavigation(siteCopy || {});
  SiteContent.applyTheme(siteCopy || {});
  SiteContent.applyMeta({
    title: `${contact.headline} | ${ownerName}`,
    description: contact.metaDescription,
    ogTitle: `${contact.headline} | ${ownerName}`,
    ogDescription: contact.metaDescription,
    ogUrl: "https://kylekk.com/contact.html"
  });
  contactWindowTitle.textContent = contactPage.windowTitle || "contact.log";

  contactShell.innerHTML = `
    <div class="contact-meta">${SiteContent.escapeHtml(contactPage.kicker || "Contact")}</div>
    <h1 class="contact-title" id="contact-title">${SiteContent.escapeHtml(contact.headline)}</h1>
    <p class="contact-summary">${SiteContent.escapeHtml(contact.summary)}</p>
    <div class="contact-layout">
      <div>
        <p class="contact-copy">${SiteContent.escapeHtml(contact.copy)}</p>
        <p class="contact-note">${SiteContent.escapeHtml(contact.note)}</p>
      </div>
      <div class="contact-actions">
        ${SiteContent.renderContactCards(contact.cards)}
      </div>
    </div>
  `;
}

async function initContactPage() {
  try {
    const [site, contact] = await Promise.all([
      SiteContent.fetchJson("content/site.json"),
      SiteContent.fetchJson("content/contact.json")
    ]);
    siteCopy = site;
    renderContact(contact);
  } catch (error) {
    if (siteCopy) {
      SiteContent.applyNavigation(siteCopy);
      SiteContent.applyTheme(siteCopy);
      contactWindowTitle.textContent = siteCopy.contactPage?.windowTitle || "contact.log";
    }
    contactShell.innerHTML = `<p style="color:var(--muted)">${SiteContent.escapeHtml(siteCopy?.contactPage?.loadErrorMessage || "Contact 内容暂时无法加载。")}</p>`;
  }
}

initContactPage();
