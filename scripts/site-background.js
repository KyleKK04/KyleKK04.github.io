(function () {
  const INTRO_SESSION_KEY = "matrix-intro-shown";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const INTRO_DURATION = prefersReducedMotion ? 180 : 1200;
  const REVEAL_DELAY = prefersReducedMotion ? 0 : 220;
  const FADE_DURATION = prefersReducedMotion ? 160 : 420;

  function hasSeenIntro() {
    try {
      return window.sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
    } catch (_error) {
      return false;
    }
  }

  function markIntroSeen() {
    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    } catch (_error) {
      // Ignore storage failures and keep the intro functional.
    }
  }

  function randomDigit() {
    return Math.random() > 0.5 ? "1" : "0";
  }

  function createIntro() {
    const overlay = document.createElement("div");
    overlay.className = "matrix-intro";
    overlay.setAttribute("aria-hidden", "true");

    const canvas = document.createElement("canvas");
    canvas.className = "matrix-intro__canvas";

    const glow = document.createElement("div");
    glow.className = "matrix-intro__glow";

    const scan = document.createElement("div");
    scan.className = "matrix-intro__scan";

    overlay.append(canvas, glow, scan);
    return { overlay, canvas };
  }

  function resizeCanvas(canvas, context) {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    return { width, height };
  }

  function startMatrixRain(canvas) {
    const context = canvas.getContext("2d", { alpha: true });
    const state = {
      width: 0,
      height: 0,
      fontSize: 18,
      columns: 0,
      drops: [],
      frameId: 0,
      startTime: performance.now()
    };

    function reset() {
      const viewport = resizeCanvas(canvas, context);
      state.width = viewport.width;
      state.height = viewport.height;
      state.fontSize = Math.max(14, Math.round(state.width / 96));
      state.columns = Math.max(12, Math.floor(state.width / state.fontSize));
      state.drops = Array.from({ length: state.columns }, () => (Math.random() * -state.height) / state.fontSize);
      context.font = `${state.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      context.textBaseline = "top";
    }

    function draw(now) {
      const elapsed = now - state.startTime;
      const intensity = Math.min(1, elapsed / 500);

      context.fillStyle = "rgba(0, 0, 0, 0.17)";
      context.fillRect(0, 0, state.width, state.height);

      context.shadowBlur = 14;
      context.shadowColor = "rgba(83, 216, 140, 0.35)";

      for (let index = 0; index < state.drops.length; index += 1) {
        const x = index * state.fontSize;
        const y = state.drops[index] * state.fontSize;
        const digit = randomDigit();
        const headGlow = Math.random() > 0.88;
        context.fillStyle = headGlow
          ? `rgba(190, 255, 214, ${0.88 * intensity})`
          : `rgba(83, 216, 140, ${0.72 * intensity})`;
        context.fillText(digit, x, y);

        if (y > state.height && Math.random() > 0.975) {
          state.drops[index] = (Math.random() * -state.height) / state.fontSize;
        } else {
          state.drops[index] += headGlow ? 1.12 : 0.92;
        }
      }

      context.shadowBlur = 0;

      if (elapsed < INTRO_DURATION + 200) {
        state.frameId = window.requestAnimationFrame(draw);
      }
    }

    reset();
    state.frameId = window.requestAnimationFrame(draw);
    window.addEventListener("resize", reset);

    return () => {
      window.cancelAnimationFrame(state.frameId);
      window.removeEventListener("resize", reset);
    };
  }

  function revealPage(overlay) {
    window.setTimeout(() => {
      document.body.classList.add("matrix-ready");
    }, REVEAL_DELAY);

    window.setTimeout(() => {
      overlay.classList.add("is-fading");
    }, Math.max(0, INTRO_DURATION - FADE_DURATION));

    window.setTimeout(() => {
      overlay.remove();
      document.body.classList.remove("matrix-intro-active");
    }, INTRO_DURATION + 120);
  }

  function init() {
    const page = document.querySelector(".page");
    if (!page || !document.body.dataset.matrixIntro) return;
    if (hasSeenIntro()) {
      document.body.classList.add("matrix-ready");
      return;
    }

    document.body.classList.add("matrix-intro-active");
    markIntroSeen();
    const { overlay, canvas } = createIntro();
    document.body.appendChild(overlay);

    const stopRain = startMatrixRain(canvas);
    revealPage(overlay);

    overlay.addEventListener("transitionend", () => {
      if (!document.body.contains(overlay)) return;
      stopRain();
    }, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
