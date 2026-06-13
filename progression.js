(function exposeTrixProgression(root) {
  const roundOrder = ["king", "queens", "diamonds", "tricks", "trix"];

  function afterCommit(state, roundType) {
    const completedRounds = [...state.completedRounds, roundType];
    const completedKingdom = completedRounds.length === roundOrder.length;

    if (completedKingdom && state.kingdomNumber < 4) {
      return {
        kingdomNumber: state.kingdomNumber + 1,
        kingdomOwner: (state.kingdomOwner + 1) % 4,
        completedRounds: [],
        activeRound: roundOrder[0],
        gameFinished: false,
        completedKingdom
      };
    }

    if (completedKingdom) {
      return {
        kingdomNumber: state.kingdomNumber,
        kingdomOwner: state.kingdomOwner,
        completedRounds,
        activeRound: roundType,
        gameFinished: true,
        completedKingdom
      };
    }

    return {
      kingdomNumber: state.kingdomNumber,
      kingdomOwner: state.kingdomOwner,
      completedRounds,
      activeRound: roundOrder.find(type => !completedRounds.includes(type)),
      gameFinished: false,
      completedKingdom
    };
  }

  function afterUndo(history, lastRound) {
    return {
      kingdomNumber: lastRound.kingdomNumber,
      kingdomOwner: lastRound.kingdomOwner,
      completedRounds: history
        .filter(item => item.kingdomNumber === lastRound.kingdomNumber)
        .map(item => item.type),
      activeRound: lastRound.type,
      gameFinished: false
    };
  }

  const api = { roundOrder, afterCommit, afterUndo };
  root.TrixProgression = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
