document.querySelector("#current-year").textContent = new Date().getFullYear();

const projectHighlightList = document.querySelector("#project-highlight-list");
const notePreviewList = document.querySelector("#note-preview-list");

function renderHomeChrome(site) {
  const home = site.home || {};
  const sections = home.sections || {};
  const projectsSection = sections.projects || {};
  const profileSection = sections.profile || {};
  const notesSection = sections.notes || {};
  const contactSection = sections.contact || {};

  SiteContent.applyNavigation(site);
  SiteContent.applyTheme(site);
  SiteContent.applyMeta({
    title: home.title,
    description: home.metaDescription,
    ogTitle: home.ogTitle,
    ogDescription: home.ogDescription,
    ogUrl: "https://kylekk.com/"
  });

  document.querySelector("#hero-primary-link").textContent = home.hero?.primaryLabel || "查看项目";
  document.querySelector("#hero-secondary-link").textContent = home.hero?.secondaryLabel || "查看经历与技能";
  document.querySelector("#home-panel-window-title").textContent = home.panelWindowTitle || "status.log";

  document.querySelector("#home-projects-kicker").textContent = projectsSection.kicker || "Projects";
  document.querySelector("#home-projects-title").textContent = projectsSection.title || "精选项目";
  document.querySelector("#home-projects-detail").textContent = projectsSection.detailLabel || "查看全部项目";
  document.querySelector("#home-projects-lead").textContent = projectsSection.lead || "首页保留少量项目入口，完整项目封面、简介和游玩入口会集中在项目页维护。";

  document.querySelector("#home-profile-kicker").textContent = profileSection.kicker || "Profile";
  document.querySelector("#home-profile-title").textContent = profileSection.title || "经历与技能";
  document.querySelector("#home-profile-detail").textContent = profileSection.detailLabel || "打开经历页";

  document.querySelector("#home-notes-kicker").textContent = notesSection.kicker || "Notes";
  document.querySelector("#home-notes-title").textContent = notesSection.title || "技术博客";
  document.querySelector("#home-notes-detail").textContent = notesSection.detailLabel || "查看全部博客";

  document.querySelector("#home-contact-kicker").textContent = contactSection.kicker || "Contact";
  document.querySelector("#home-contact-title").textContent = contactSection.title || "联系我";
  document.querySelector("#home-contact-detail").textContent = contactSection.detailLabel || "打开联系页";
}

function renderProjectHighlights(projects) {
  const featuredProjects = projects.filter(project => project.featured !== false).slice(0, 5);

  projectHighlightList.innerHTML = featuredProjects.map((project, index) => `
    <article class="project-tile ${index === 0 ? "featured" : ""}" id="home-project-${SiteContent.escapeHtml(project.slug)}">
      ${SiteContent.renderProjectCover(project)}
      <div class="project-info">
        <h3>${SiteContent.escapeHtml(project.title)}</h3>
        <p>${SiteContent.escapeHtml(project.summary)}</p>
        <div class="project-cta-row">
          ${SiteContent.renderProjectAction(project, { className: "project-cta" })}
        </div>
      </div>
    </article>
  `).join("");
}

function renderNotePreviews(posts) {
  notePreviewList.innerHTML = posts.slice(0, 3).map(post => `
    <a class="note-card" href="blog.html?post=${encodeURIComponent(post.slug)}">
      <small>${SiteContent.escapeHtml(post.date)}</small>
      <h3>${SiteContent.escapeHtml(post.title)}</h3>
      <p>${SiteContent.escapeHtml(post.summary)}</p>
      <div class="note-tags">
        ${SiteContent.renderTagList(post.tags, "mini-tag")}
      </div>
    </a>
  `).join("");
}

function renderHeroAndProfile(site, profile) {
  const home = site.home || {};
  const heroCopy = home.hero || {};
  const profilePreview = home.profilePreview || {};
  const heroKicker = document.querySelector("#hero-kicker");
  const heroName = document.querySelector("#hero-name");
  const heroHighlight = document.querySelector("#hero-highlight");
  const heroText = document.querySelector("#hero-text");
  const heroReadout = document.querySelector("#hero-readout");
  const panelRole = document.querySelector("#profile-panel-role");
  const panelSummary = document.querySelector("#profile-panel-summary");
  const panelStatus = document.querySelector("#profile-panel-status");
  const profileTimeline = document.querySelector("#profile-timeline");
  const profileSkillBoard = document.querySelector("#profile-skill-board");

  const kickerItems = Array.isArray(heroCopy.kicker) && heroCopy.kicker.length > 0
    ? heroCopy.kicker
    : profile.hero.kicker;
  const readoutItems = Array.isArray(heroCopy.readout) && heroCopy.readout.length > 0
    ? heroCopy.readout
    : profile.hero.readout;

  heroKicker.innerHTML = kickerItems
    .map(item => `<span>${SiteContent.escapeHtml(item)}</span>`)
    .join("");
  heroName.textContent = heroCopy.name || profile.hero.name;
  heroHighlight.textContent = heroCopy.highlight || profile.hero.highlight;
  heroText.textContent = heroCopy.description || profile.hero.description;
  heroReadout.innerHTML = readoutItems.map(item => `
    <div class="readout-item">
      <strong>${SiteContent.escapeHtml(item.label)}</strong>
      <span>${SiteContent.escapeHtml(item.value)}</span>
    </div>
  `).join("");

  panelRole.textContent = profilePreview.panelTitle || profile.panelTitle;
  panelSummary.textContent = profilePreview.summary || profile.summary;
  panelStatus.innerHTML = profile.status.map(item => `
    <div class="status-row">
      <strong>${SiteContent.escapeHtml(item.label)}</strong>
      <span>${SiteContent.escapeHtml(item.value)}</span>
    </div>
  `).join("");

  profileTimeline.innerHTML = profile.timeline.map(item => `
    <article class="timeline-item">
      <time>${SiteContent.escapeHtml(item.time)}</time>
      <div>
        <h3>${SiteContent.escapeHtml(item.title)}</h3>
        <p>${SiteContent.escapeHtml(item.description)}</p>
      </div>
    </article>
  `).join("");

  profileSkillBoard.innerHTML = profile.skills.map(group => `
    <div class="skill-group">
      <span class="skill-group-label">${SiteContent.escapeHtml(group.label)}</span>
      <div class="skills">
        ${SiteContent.renderTagList(group.items, "skill-tag")}
      </div>
    </div>
  `).join("");
}

function renderContactSection(contact) {
  document.querySelector("#contact-copy").textContent = contact.summary;
  document.querySelector("#contact-actions").innerHTML = SiteContent.renderContactCards(contact.cards);
}

async function initHome() {
  try {
    const [site, projectResponse, postResponse, profile, contact] = await Promise.all([
      SiteContent.fetchJson("content/site.json"),
      SiteContent.fetchProjects(),
      SiteContent.fetchPosts(),
      SiteContent.fetchJson("content/profile.json"),
      SiteContent.fetchJson("content/contact.json")
    ]);

    renderHomeChrome(site);
    renderProjectHighlights(projectResponse);
    renderNotePreviews(postResponse);
    renderHeroAndProfile(site, profile);
    renderContactSection(contact);
  } catch (error) {
    projectHighlightList.innerHTML = '<article class="project-tile"><div class="project-info"><h3>项目暂时无法加载</h3><p>请检查 projects/index.json。</p></div></article>';
    notePreviewList.innerHTML = '<article class="note-card"><h3>博客暂时无法加载</h3><p>请检查 posts/index.json。</p></article>';
  }
}

initHome();

const revealItems = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealItems.forEach(item => observer.observe(item));
