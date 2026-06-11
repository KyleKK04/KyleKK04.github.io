const fs = require("fs");
const path = require("path");
const {
  PROJECTS_CONTENT_DIR,
  POSTS_CONTENT_DIR,
  SITE_PATH,
  PROFILE_PATH,
  CONTACT_PATH,
  PUBLIC_PROJECTS_DIR,
  PUBLIC_POSTS_DIR,
  readContentEntries,
  readJson
} = require("./content-lib");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateProjects() {
  const entries = readContentEntries(PROJECTS_CONTENT_DIR);
  const slugs = new Set();
  const allowedTones = new Set(["teal", "amber", "violet", "rose", "blue", "green"]);
  const allowedCoverFits = new Set(["cover", "contain"]);
  const allowedCoverPositions = new Set(["center", "top", "bottom", "left", "right"]);
  const disallowedLegacyFields = ["engine", "stack", "link", "date"];

  entries.forEach(entry => {
    const { data, fileName } = entry;
    assert(data.slug, `${fileName}: missing slug`);
    assert(data.title, `${fileName}: missing title`);
    assert(data.summary, `${fileName}: missing summary`);
    assert(data.coverLabel, `${fileName}: missing coverLabel`);
    assert(data.tone && allowedTones.has(data.tone), `${fileName}: tone must be one of ${Array.from(allowedTones).join(", ")}`);
    disallowedLegacyFields.forEach(fieldName => {
      assert(!(fieldName in data), `${fileName}: legacy field ${fieldName} is no longer supported`);
    });
    if (data.coverFit) {
      assert(allowedCoverFits.has(data.coverFit), `${fileName}: coverFit must be cover or contain`);
    }
    if (data.coverPosition) {
      assert(allowedCoverPositions.has(data.coverPosition), `${fileName}: invalid coverPosition ${data.coverPosition}`);
    }
    assert(!slugs.has(data.slug), `${fileName}: duplicate slug ${data.slug}`);
    slugs.add(data.slug);

    if (data.cover && !/^https?:\/\//.test(data.cover)) {
      const coverPath = path.resolve(path.dirname(PROJECTS_CONTENT_DIR), "..", data.cover);
      assert(fs.existsSync(coverPath), `${fileName}: missing cover asset ${data.cover}`);
    }

  });

  const publicProjects = readJson(path.join(PUBLIC_PROJECTS_DIR, "index.json"));
  assert(publicProjects.length === entries.length, "projects/index.json count does not match content/projects");
}

function validatePosts() {
  const entries = readContentEntries(POSTS_CONTENT_DIR);
  const slugs = new Set();

  entries.forEach(entry => {
    const { data, fileName } = entry;
    assert(data.slug, `${fileName}: missing slug`);
    assert(data.title, `${fileName}: missing title`);
    assert(data.summary, `${fileName}: missing summary`);
    assert(data.date && isValidDate(data.date), `${fileName}: invalid or missing date`);
    assert(Array.isArray(data.tags) && data.tags.length > 0, `${fileName}: tags must be a non-empty list`);
    assert(!slugs.has(data.slug), `${fileName}: duplicate slug ${data.slug}`);
    slugs.add(data.slug);
  });

  const publicPosts = readJson(path.join(PUBLIC_POSTS_DIR, "index.json"));
  assert(publicPosts.length === entries.length, "posts/index.json count does not match content/posts");
}

function validateProfile() {
  const profile = readJson(PROFILE_PATH);

  assert(profile.headline, "content/profile.json: missing headline");
  assert(profile.summary, "content/profile.json: missing summary");
  assert(Array.isArray(profile.status) && profile.status.length > 0, "content/profile.json: status must be a non-empty list");
  assert(Array.isArray(profile.timeline) && profile.timeline.length > 0, "content/profile.json: timeline must be a non-empty list");
  assert(Array.isArray(profile.skills) && profile.skills.length > 0, "content/profile.json: skills must be a non-empty list");
  assert(profile.hero && profile.hero.description, "content/profile.json: hero description is required");
}

function validateSite() {
  const site = readJson(SITE_PATH);
  const allowedBackgroundFits = new Set(["contain", "cover"]);
  const allowedBackgroundPositions = new Set(["center", "top", "bottom", "left", "right"]);

  assert(site.siteName, "content/site.json: missing siteName");
  assert(site.ownerName, "content/site.json: missing ownerName");
  assert(site.backgroundImage, "content/site.json: backgroundImage is required");
  assert(site.backgroundFit && allowedBackgroundFits.has(site.backgroundFit), "content/site.json: backgroundFit must be contain or cover");
  assert(site.backgroundPosition && allowedBackgroundPositions.has(site.backgroundPosition), "content/site.json: invalid backgroundPosition");
  assert(site.navigation && site.navigation.projects, "content/site.json: navigation.projects is required");
  assert(site.navigation && site.navigation.profile, "content/site.json: navigation.profile is required");
  assert(site.navigation && site.navigation.notes, "content/site.json: navigation.notes is required");
  assert(site.navigation && site.navigation.contact, "content/site.json: navigation.contact is required");
  assert(site.home && site.home.title, "content/site.json: home.title is required");
  assert(site.home && site.home.metaDescription, "content/site.json: home.metaDescription is required");
  assert(site.home && site.home.hero && site.home.hero.primaryLabel, "content/site.json: home.hero.primaryLabel is required");
  assert(site.home && site.home.hero && site.home.hero.secondaryLabel, "content/site.json: home.hero.secondaryLabel is required");
  assert(site.home && site.home.sections && site.home.sections.projects && site.home.sections.projects.title, "content/site.json: home.sections.projects.title is required");
  assert(site.projectsPage && site.projectsPage.kicker, "content/site.json: projectsPage.kicker is required");
  assert(site.projectsPage && site.projectsPage.headline, "content/site.json: projectsPage.headline is required");
  assert(site.projectsPage && site.projectsPage.lead, "content/site.json: projectsPage.lead is required");
  assert(site.blogPage && site.blogPage.listTitle, "content/site.json: blogPage.listTitle is required");
  assert(site.blogPage && site.blogPage.listSummary, "content/site.json: blogPage.listSummary is required");
  assert(site.profilePage && site.profilePage.kicker, "content/site.json: profilePage.kicker is required");
  assert(site.contactPage && site.contactPage.kicker, "content/site.json: contactPage.kicker is required");
}

function validateContact() {
  const contact = readJson(CONTACT_PATH);

  assert(contact.headline, "content/contact.json: missing headline");
  assert(contact.summary, "content/contact.json: missing summary");
  assert(contact.copy, "content/contact.json: missing copy");
  assert(Array.isArray(contact.cards) && contact.cards.length > 0, "content/contact.json: cards must be a non-empty list");
}

function main() {
  validateProjects();
  validatePosts();
  validateSite();
  validateProfile();
  validateContact();
  console.log("Content validation passed.");
}

if (require.main === module) {
  main();
}

module.exports = {
  validateProjects,
  validatePosts,
  validateSite,
  validateProfile,
  validateContact,
  main
};
