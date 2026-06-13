const assert = require("node:assert/strict");
const { calculate } = require("./scoring.js");

assert.deepEqual(
  calculate("king", { eater: 2, doubled: false, doubler: null }),
  [0, 0, -75, 0]
);

assert.deepEqual(
  calculate("king", { eater: 2, doubled: true, doubler: 0 }),
  [75, 0, -150, 0]
);

assert.deepEqual(
  calculate("king", { eater: 2, doubled: true, doubler: 2 }),
  [0, 0, -75, 0]
);

assert.deepEqual(
  calculate("queens", {
    assignments: { "Q♠": 1 },
    doubled: { "Q♠": true },
    doublers: { "Q♠": 1 }
  }),
  [0, -25, 0, 0]
);

assert.deepEqual(
  calculate("queens", {
    assignments: { "Q♠": 0, "Q♥": 1, "Q♦": 1, "Q♣": 3 },
    doubled: { "Q♥": true },
    doublers: { "Q♥": 2 }
  }),
  [-25, -75, 25, -25]
);

assert.deepEqual(
  calculate("diamonds", { counts: [4, 3, 3, 3] }),
  [-40, -30, -30, -30]
);

assert.deepEqual(
  calculate("tricks", { counts: [4, 3, 5, 1] }),
  [-60, -45, -75, -15]
);

assert.deepEqual(
  calculate("trix", { order: [3, 1, 0, 2] }),
  [100, 150, 50, 200]
);

console.log("All scoring tests passed.");
