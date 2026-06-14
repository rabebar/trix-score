const assert = require("node:assert/strict");
const seating = require("./seating.js");

const rotated = seating.rotateCounterClockwise(["أسفل", "يمين", "أعلى", "يسار"], 0);
assert.deepEqual(rotated.players, ["يسار", "أسفل", "يمين", "أعلى"]);
assert.equal(rotated.starter, 1);
const twoPlayers = seating.rotateCounterClockwise(["أ", "ب", "مخفي 1", "مخفي 2"], 0, 2);
assert.deepEqual(twoPlayers.players, ["ب", "أ", "مخفي 1", "مخفي 2"]);
assert.equal(twoPlayers.starter, 1);
const threePlayers = seating.rotateCounterClockwise(["أ", "ب", "ج", "مخفي"], 2, 3);
assert.deepEqual(threePlayers.players, ["ج", "أ", "ب", "مخفي"]);
assert.equal(threePlayers.starter, 0);
assert.deepEqual(seating.teamPlayerIndexes(0), [0, 2]);
assert.deepEqual(seating.teamPlayerIndexes(1), [1, 3]);

console.log("All seating tests passed.");
