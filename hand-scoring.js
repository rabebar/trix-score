(function exposeHandScoring(root) {
  const values = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
    "10": 10, J: 10, Q: 10, K: 10, A: 11, Joker: 15
  };

  function cardTotal(cards) {
    return cards.reduce((sum, rank) => sum + values[rank], 0);
  }

  function calculate({ mode, winner, hand, players }) {
    const multiplier = hand ? 2 : 1;
    if (mode === "partnership") {
      const winnerTeam = winner % 2;
      const loserTeam = winnerTeam === 0 ? 1 : 0;
      const changes = [0, 0];
      changes[winnerTeam] = -30 * multiplier;
      changes[loserTeam] = players
        .map((player, index) => ({ player, index }))
        .filter(item => item.index % 2 === loserTeam)
        .reduce((sum, item) => sum + (item.player.laid ? cardTotal(item.player.cards) : 100), 0) * multiplier;
      return changes;
    }

    return players.map((player, index) => {
      if (index === winner) return -30 * multiplier;
      return (player.laid ? cardTotal(player.cards) : 100) * multiplier;
    });
  }

  const api = { values, cardTotal, calculate };
  root.HandScoring = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
