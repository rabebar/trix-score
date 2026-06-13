const assert = require("node:assert/strict");
const { calculate } = require("./tarneeb-scoring.js");

assert.deepEqual(calculate({ bidder: 0, bid: 8, bidderTricks: 9 }), [9, 0]);
assert.deepEqual(calculate({ bidder: 1, bid: 9, bidderTricks: 8 }), [5, -9]);
assert.deepEqual(calculate({ bidder: 0, bid: 7, bidderTricks: 0 }), [-7, 16]);
assert.deepEqual(calculate({ bidder: 0, bid: 13, bidderTricks: 13 }), [26, 0]);
assert.deepEqual(calculate({ bidder: 1, bid: 13, bidderTricks: 10 }), [3, -16]);

console.log("All Tarneeb scoring tests passed.");
