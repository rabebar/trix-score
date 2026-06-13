(function exposeTarneebScoring(root) {
  function calculate({ bidder, bid, bidderTricks }) {
    const other = bidder === 0 ? 1 : 0;
    const otherTricks = 13 - bidderTricks;
    const changes = [0, 0];

    if (bid === 13) {
      if (bidderTricks === 13) changes[bidder] += 26;
      else {
        changes[bidder] -= 16;
        changes[other] += otherTricks === 13 ? 16 : otherTricks;
      }
      return changes;
    }

    if (bidderTricks >= bid) {
      changes[bidder] += bidderTricks;
    } else {
      changes[bidder] -= bid;
      changes[other] += otherTricks === 13 ? 16 : otherTricks;
    }

    return changes;
  }

  const api = { calculate };
  root.TarneebScoring = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
