(function exposeSeating(root) {
  function rotateCounterClockwise(players, starter, activeCount = players.length) {
    const active = players.slice(0, activeCount);
    const inactive = players.slice(activeCount);
    return {
      players: [active[active.length - 1], ...active.slice(0, -1), ...inactive],
      starter: (starter + 1) % activeCount
    };
  }

  function teamPlayerIndexes(team) {
    return team === 0 ? [0, 2] : [1, 3];
  }

  const api = { rotateCounterClockwise, teamPlayerIndexes };
  root.Seating = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
