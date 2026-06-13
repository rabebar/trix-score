(function exposeComplexScoring(root) {
  function calculateComplex(draft) {
    const changes = [0, 0, 0, 0];

    changes[draft.king.eater] -= draft.king.doubled ? 150 : 75;
    if (draft.king.doubled) {
      changes[draft.king.doubler] += 75;
    }

    Object.entries(draft.queens).forEach(([, queen]) => {
      changes[queen.eater] -= queen.doubled ? 50 : 25;
      if (queen.doubled) changes[queen.doubler] += 25;
    });

    draft.diamonds.forEach((count, player) => {
      changes[player] -= count * 10;
    });
    draft.tricks.forEach((count, player) => {
      changes[player] -= count * 15;
    });

    return changes;
  }

  function calculateTrix(order) {
    const changes = [0, 0, 0, 0];
    [200, 150, 100, 50].forEach((score, rank) => {
      changes[order[rank]] += score;
    });
    return changes;
  }

  const api = { calculateComplex, calculateTrix };
  root.ComplexScoring = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
