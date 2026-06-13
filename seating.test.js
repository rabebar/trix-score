const assert = require("node:assert/strict");
const seating = require("./seating.js");

const rotated = seating.rotateCounterClockwise(["أسفل", "يمين", "أعلى", "يسار"], 0);
assert.deepEqual(rotated.players, ["يسار", "أسفل", "يمين", "أعلى"]);
assert.equal(rotated.starter, 1);
assert.deepEqual(seating.teamPlayerIndexes(0), [0, 2]);
assert.deepEqual(seating.teamPlayerIndexes(1), [1, 3]);

console.log("All seating tests passed.");
