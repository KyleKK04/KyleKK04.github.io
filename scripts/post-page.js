document.querySelector("#current-year").textContent = new Date().getFullYear();

function renderMath(target) {
  if (!target || typeof renderMathInElement !== "function") return;

  renderMathInElement(target, {
    throwOnError: false,
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false }
    ]
  });
}

renderMath(document.querySelector("#article-summary"));
renderMath(document.querySelector("#reader-content"));
