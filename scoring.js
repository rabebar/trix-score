(function exposeTrixScoring(root) {
  function calculate(type, draft) {
    const changes = [0, 0, 0, 0];

    if (type === "king") {
      changes[draft.eater] -= draft.doubled ? 150 : 75;
      if (draft.doubled) changes[draft.doubler] += 75;
    }

    if (type === "queens") {
      Object.entries(draft.assignments).forEach(([cardId, player]) => {
        changes[player] -= draft.doubled[cardId] ? 50 : 25;
        const doubler = draft.doublers[cardId];
        if (draft.doubled[cardId] && doubler !== undefined) {
          changes[doubler] += 25;
        }
      });
    }

    if (type === "diamonds") {
      draft.counts.forEach((count, player) => {
        changes[player] -= count * 10;
      });
    }

    if (type === "tricks") {
      draft.counts.forEach((count, index) => {
        changes[index] -= count * 15;
      });
    }

    if (type === "trix") {
      [200, 150, 100, 50].forEach((score, rank) => {
        changes[draft.order[rank]] += score;
      });
    }

    return changes;
  }

  const api = { calculate };
  root.TrixScoring = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
