const assert = require("node:assert/strict");
const { shouldFinish } = require("./hand-end.js");

assert.equal(shouldFinish({ mode: "manual", roundCount: 20, scores: [-500, 10] }), false);
assert.equal(shouldFinish({ mode: "five", roundCount: 4, scores: [0, 0] }), false);
assert.equal(shouldFinish({ mode: "five", roundCount: 5, scores: [0, 0] }), true);
assert.equal(shouldFinish({ mode: "minus200", roundCount: 2, scores: [-199, 20] }), false);
assert.equal(shouldFinish({ mode: "minus200", roundCount: 2, scores: [-200, 20] }), true);
assert.equal(shouldFinish({ mode: "minus200", roundCount: 2, scores: [-240, -10] }), true);

console.log("All Hand end-mode tests passed.");
