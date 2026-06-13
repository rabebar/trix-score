(function exposeHandEnd(root) {
  function shouldFinish({ mode, roundCount, scores }) {
    if (mode === "five") return roundCount >= 5;
    if (mode === "minus200") return scores.some(score => score <= -200);
    return false;
  }

  const api = { shouldFinish };
  root.HandEnd = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
