const fs = require("fs");
const path = require("path");
const { CONTENT_DIR } = require("./content-lib");
const { main: buildContent } = require("./content-build");
const { main: validateContent } = require("./content-validate");

let timer = null;

function runPipeline() {
  try {
    buildContent();
    validateContent();
    console.log(`[content-watch] synced at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error(`[content-watch] ${error.message}`);
  }
}

function schedulePipeline() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(runPipeline, 180);
}

function startWatcher() {
  runPipeline();

  fs.watch(CONTENT_DIR, { recursive: true }, (_eventType, fileName) => {
    if (!fileName) return;
    const extension = path.extname(fileName);
    if (extension && extension !== ".md" && extension !== ".json") return;
    schedulePipeline();
  });

  console.log(`[content-watch] watching ${CONTENT_DIR}`);
}

startWatcher();
