document.querySelector("#current-year").textContent = new Date().getFullYear();

const profileShell = document.querySelector("#profile-content");
const profileWindowTitle = document.querySelector("#profile-window-title");
let siteCopy = null;
const pageSnapshot = SiteContent.readEmbeddedJson("profile-page-snapshot");

function applyProfileChrome(profile) {
  const ownerName = siteCopy?.ownerName || "朱绪达 KyleKK";
  const profilePage = siteCopy?.profilePage || {};
  SiteContent.applyNavigation(siteCopy || {});
  SiteContent.applyTheme(siteCopy || {});
  SiteContent.applyMeta({
    title: `${profile.headline} | ${ownerName}`,
    description: profile.metaDescription,
    ogTitle: `${profile.headline} | ${ownerName}`,
    ogDescription: profile.metaDescription,
    ogUrl: "https://kylekk.com/profile.html"
  });
  profileWindowTitle.textContent = profilePage.windowTitle || "profile.log";
}

function renderProfile(profile) {
  const profilePage = siteCopy?.profilePage || {};
  applyProfileChrome(profile);
  profileShell.innerHTML = `
    <div class="profile-meta">${SiteContent.escapeHtml(profilePage.kicker || "Profile")}</div>
    <h1 class="profile-title" id="profile-title">${SiteContent.escapeHtml(profile.headline)}</h1>
    <p class="profile-summary">${SiteContent.escapeHtml(profile.summary)}</p>
    <div class="profile-page-grid">
      <div>
        <div class="profile-status" aria-label="当前状态">
          ${profile.status.map(item => `
            <div class="profile-status-row">
              <strong>${SiteContent.escapeHtml(item.label)}</strong>
              <span>${SiteContent.escapeHtml(item.value)}</span>
            </div>
          `).join("")}
        </div>
        <div class="timeline" aria-label="经历时间线">
          ${profile.timeline.map(item => `
            <article class="timeline-item">
              <time>${SiteContent.escapeHtml(item.time)}</time>
              <div>
                <h2>${SiteContent.escapeHtml(item.title)}</h2>
                <p>${SiteContent.escapeHtml(item.description)}</p>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
      <div class="skill-board" aria-label="技能矩阵">
        ${profile.skills.map(group => `
          <div class="skill-group">
            <span class="skill-group-label">${SiteContent.escapeHtml(group.label)}</span>
            <div class="skills">
              ${SiteContent.renderTagList(group.items, "skill-tag")}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

async function initProfilePage() {
  if (pageSnapshot?.site && pageSnapshot?.profile) {
    siteCopy = pageSnapshot.site;
    applyProfileChrome(pageSnapshot.profile);
    return;
  }

  try {
    const [site, profile] = await Promise.all([
      SiteContent.fetchJson("content/site.json"),
      SiteContent.fetchJson("content/profile.json")
    ]);
    siteCopy = site;
    renderProfile(profile);
  } catch (error) {
    if (siteCopy) {
      SiteContent.applyNavigation(siteCopy);
      SiteContent.applyTheme(siteCopy);
      profileWindowTitle.textContent = siteCopy.profilePage?.windowTitle || "profile.log";
    }
    profileShell.innerHTML = `<p style="color:var(--muted)">${SiteContent.escapeHtml(siteCopy?.profilePage?.loadErrorMessage || "Profile 内容暂时无法加载。")}</p>`;
  }
}

initProfilePage();
