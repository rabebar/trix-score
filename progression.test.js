const assert = require("node:assert/strict");
const { afterCommit, afterUndo } = require("./progression.js");

let state = {
  kingdomNumber: 1,
  kingdomOwner: 0,
  completedRounds: [],
  gameFinished: false
};

state = { ...state, ...afterCommit(state, "king") };
assert.deepEqual(state.completedRounds, ["king"]);
assert.equal(state.activeRound, "queens");

for (const type of ["queens", "diamonds", "tricks", "trix"]) {
  state = { ...state, ...afterCommit(state, type) };
}
assert.equal(state.kingdomNumber, 2);
assert.equal(state.kingdomOwner, 1);
assert.deepEqual(state.completedRounds, []);
assert.equal(state.activeRound, "king");

const history = [
  { type: "tricks", kingdomNumber: 1, kingdomOwner: 0 },
  { type: "diamonds", kingdomNumber: 1, kingdomOwner: 0 },
  { type: "queens", kingdomNumber: 1, kingdomOwner: 0 },
  { type: "king", kingdomNumber: 1, kingdomOwner: 0 }
];
assert.deepEqual(afterUndo(history, { type: "trix", kingdomNumber: 1, kingdomOwner: 0 }), {
  kingdomNumber: 1,
  kingdomOwner: 0,
  completedRounds: ["tricks", "diamonds", "queens", "king"],
  activeRound: "trix",
  gameFinished: false
});

state = {
  kingdomNumber: 4,
  kingdomOwner: 3,
  completedRounds: ["king", "queens", "diamonds", "tricks"],
  gameFinished: false
};
state = { ...state, ...afterCommit(state, "trix") };
assert.equal(state.gameFinished, true);
assert.equal(state.kingdomNumber, 4);

console.log("All progression tests passed.");
