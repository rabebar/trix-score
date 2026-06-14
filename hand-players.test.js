const assert = require("node:assert/strict");
const handPlayers = require("./hand-players.js");

assert.equal(handPlayers.normalizeCount(2), 2);
assert.equal(handPlayers.normalizeCount("3"), 3);
assert.equal(handPlayers.normalizeCount(9), 4);
assert.deepEqual(handPlayers.active(["أ", "ب", "ج", "د"], 2), ["أ", "ب"]);
assert.deepEqual(handPlayers.active(["أ", "ب", "ج", "د"], 3), ["أ", "ب", "ج"]);
assert.equal(handPlayers.canUsePartnership(2), false);
assert.equal(handPlayers.canUsePartnership(4), true);
assert.equal(handPlayers.scoreCount(2, "individual"), 2);
assert.equal(handPlayers.scoreCount(3, "individual"), 3);
assert.equal(handPlayers.scoreCount(4, "partnership"), 2);

console.log("All Hand player-count tests passed.");
