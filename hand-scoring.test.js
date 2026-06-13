const assert = require("node:assert/strict");
const { cardTotal, calculate } = require("./hand-scoring.js");

assert.equal(cardTotal(["A", "Joker", "K", "5"]), 41);

const players = [
  { laid: true, cards: [] },
  { laid: true, cards: ["A", "5"] },
  { laid: false, cards: [] },
  { laid: true, cards: ["Joker", "K"] }
];

assert.deepEqual(calculate({ mode: "individual", winner: 0, hand: false, players }), [-30, 16, 100, 25]);
assert.deepEqual(calculate({ mode: "individual", winner: 0, hand: true, players }), [-60, 32, 200, 50]);
assert.deepEqual(calculate({ mode: "partnership", winner: 0, hand: false, players }), [-30, 41]);

console.log("All Hand scoring tests passed.");
