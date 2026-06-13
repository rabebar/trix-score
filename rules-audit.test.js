const assert = require("node:assert/strict");
const trix = require("./scoring.js");
const complex = require("./complex-scoring.js");
const tarneeb = require("./tarneeb-scoring.js");
const handEnd = require("./hand-end.js");

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

// Every complete penalty round totals -500, including all doubling combinations.
for (let kingEater = 0; kingEater < 4; kingEater += 1) {
  for (let kingDoubler = 0; kingDoubler < 4; kingDoubler += 1) {
    const draft = {
      king: { eater: kingEater, doubled: true, doubler: kingDoubler },
      queens: {
        "Q♠": { eater: 0, doubled: true, doubler: 0 },
        "Q♥": { eater: 1, doubled: true, doubler: 2 },
        "Q♦": { eater: 2, doubled: false, doubler: null },
        "Q♣": { eater: 3, doubled: false, doubler: null }
      },
      diamonds: [4, 3, 3, 3],
      tricks: [4, 3, 5, 1]
    };
    assert.equal(sum(complex.calculateComplex(draft)), -500);
  }
}

// Trix placement always distributes exactly 500 points.
const orders = [
  [0, 1, 2, 3],
  [3, 2, 1, 0],
  [2, 0, 3, 1]
];
orders.forEach(order => assert.equal(sum(complex.calculateTrix(order)), 500));

// Standalone Trix categories preserve their published totals.
assert.equal(sum(trix.calculate("king", { eater: 0, doubled: true, doubler: 1 })), -75);
assert.equal(sum(trix.calculate("queens", {
  assignments: { "Q♠": 0, "Q♥": 1, "Q♦": 2, "Q♣": 3 },
  doubled: { "Q♠": true, "Q♥": true },
  doublers: { "Q♠": 0, "Q♥": 2 }
})), -100);
assert.equal(sum(trix.calculate("diamonds", { counts: [4, 3, 3, 3] })), -130);
assert.equal(sum(trix.calculate("tricks", { counts: [4, 3, 5, 1] })), -195);

// Tarneeb boundaries: all bids and all possible trick counts return finite scores.
for (let bidder = 0; bidder < 2; bidder += 1) {
  for (let bid = 7; bid <= 13; bid += 1) {
    for (let bidderTricks = 0; bidderTricks <= 13; bidderTricks += 1) {
      const result = tarneeb.calculate({ bidder, bid, bidderTricks });
      assert.equal(result.length, 2);
      result.forEach(value => assert.ok(Number.isFinite(value)));
    }
  }
}

// Hand end modes respect their exact boundaries.
assert.equal(handEnd.shouldFinish({ mode: "five", roundCount: 5, scores: [0, 0] }), true);
assert.equal(handEnd.shouldFinish({ mode: "minus200", roundCount: 1, scores: [-200, 0] }), true);
assert.equal(handEnd.shouldFinish({ mode: "minus200", roundCount: 1, scores: [-199, 0] }), false);

console.log("Full rules audit passed.");
