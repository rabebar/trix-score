const assert = require("node:assert/strict");
const { calculateComplex, calculateTrix } = require("./complex-scoring.js");

assert.deepEqual(calculateComplex({
  king: { eater: 0, doubled: true, doubler: 2 },
  queens: {
    "Q♠": { eater: 0, doubled: false, doubler: null },
    "Q♥": { eater: 1, doubled: true, doubler: 3 },
    "Q♦": { eater: 2, doubled: false, doubler: null },
    "Q♣": { eater: 3, doubled: false, doubler: null }
  },
  diamonds: [4, 3, 3, 3],
  tricks: [4, 3, 5, 1]
}), [-275, -125, -55, -45]);

assert.deepEqual(calculateTrix([3, 1, 0, 2]), [100, 150, 50, 200]);

assert.deepEqual(calculateComplex({
  king: { eater: 0, doubled: true, doubler: 0 },
  queens: {
    "Q♠": { eater: 1, doubled: true, doubler: 1 },
    "Q♥": { eater: 1, doubled: false, doubler: null },
    "Q♦": { eater: 2, doubled: false, doubler: null },
    "Q♣": { eater: 3, doubled: false, doubler: null }
  },
  diamonds: [13, 0, 0, 0],
  tricks: [13, 0, 0, 0]
}), [-400, -50, -25, -25]);

console.log("All Complex scoring tests passed.");
