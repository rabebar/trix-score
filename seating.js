(function exposeSeating(root) {
  function rotateCounterClockwise(players, starter) {
    return {
      players: [players[3], players[0], players[1], players[2]],
      starter: (starter + 1) % 4
    };
  }

  function teamPlayerIndexes(team) {
    return team === 0 ? [0, 2] : [1, 3];
  }

  const api = { rotateCounterClockwise, teamPlayerIndexes };
  root.Seating = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
