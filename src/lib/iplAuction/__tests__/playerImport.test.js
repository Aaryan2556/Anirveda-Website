import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { COMMANDS, reduce } from "../engine/index.js";
import { parseCsv, parsePlayerImport, planPlayerImport } from "../io/playerImport.js";
import { ADMIN, setup } from "./fixtures.js";

let n = 0;
const makeId = (prefix) => `${prefix}-${(n += 1)}`;

describe("CSV parsing", () => {
  it("handles quotes, escaped quotes, embedded commas/newlines and CRLF", () => {
    const rows = parseCsv('a,b,c\r\n"x, y","say ""hi""","multi\nline"\r\n\r\n1,,3');
    assert.deepEqual(rows, [["a", "b", "c"], ["x, y", 'say "hi"', "multi\nline"], ["1", "", "3"]]);
  });
});

describe("parsePlayerImport", () => {
  it("reads CSV with loose headers, role aliases, overseas flags and stat columns", () => {
    const csv = [
      "Name,Role,Base Price,Overseas,Country,Age,batting.runs,batting.highestScore,bowling.bestBowling,Recent",
      "Fictional One,wk,20,no,India,23,512,88*,,12 (9)|40 (22)",
      'Fictional Two,All-Rounder,150,Yes,"Trinidad, WI",29,,,3/21,',
    ].join("\n");
    const { rows, error } = parsePlayerImport(csv);
    assert.equal(error, null);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].line, 2);
    assert.deepEqual(rows[0].input, {
      name: "Fictional One",
      role: "WICKETKEEPER",
      basePrice: 20,
      isOverseas: false,
      nationality: "India",
      age: 23,
      battingStyle: null,
      bowlingStyle: null,
      image: null,
      dataSource: null,
      recentPerformance: ["12 (9)", "40 (22)"],
      stats: { batting: { runs: 512, highestScore: "88*" } },
    });
    assert.equal(rows[1].input.role, "ALL_ROUNDER");
    assert.equal(rows[1].input.isOverseas, true);
    assert.equal(rows[1].input.nationality, "Trinidad, WI");
    assert.deepEqual(rows[1].input.stats, { bowling: { bestBowling: "3/21" } });
  });

  it("reads JSON arrays and { players: [...] } including nested stats", () => {
    const player = { name: "Fictional J", role: "BOWLER", basePrice: 30, isOverseas: false, stats: { bowling: { wickets: "12" } } };
    for (const text of [JSON.stringify([player]), JSON.stringify({ players: [player] })]) {
      const { rows } = parsePlayerImport(text);
      assert.equal(rows[0].input.name, "Fictional J");
      assert.deepEqual(rows[0].input.stats, { bowling: { wickets: 12 } });
    }
  });

  it("reports unusable input", () => {
    assert.match(parsePlayerImport("").error, /Nothing/);
    assert.match(parsePlayerImport("[oops").error, /Invalid JSON/);
    assert.match(parsePlayerImport('{"a":1}').error, /array/);
    assert.match(parsePlayerImport("role,basePrice\nBATTER,20").error, /name/);
  });
});

describe("planPlayerImport", () => {
  const csv = [
    "name,role,basePrice,isOverseas,dataSource",
    "Good Row,BATTER,20,no,",
    "Bad Role,CAPTAIN,20,no,",
    "Bad Price,BOWLER,12.5,no,",
    "Test bat1,BOWLER,20,no,", // same name as an existing fixture player
    "Own Source,BOWLER,25,yes,MANUAL_ENTRY",
  ].join("\n");

  it("validates each row through the engine and reports errors per line", () => {
    const state = setup();
    const plan = planPlayerImport(state, parsePlayerImport(csv).rows, { dataSource: "FICTIONAL", makeId });
    assert.deepEqual(plan.map((row) => [row.line, Boolean(row.command)]), [[2, true], [3, false], [4, false], [5, true], [6, true]]);
    assert.match(plan[1].error, /role/);
    assert.match(plan[2].error, /Base price/);
    assert.deepEqual(plan[3].warnings, ["A player with this name already exists."]);
    assert.equal(plan[0].command.player.dataSource, "FICTIONAL", "the default fills rows without a source");
    assert.equal(plan[4].command.player.dataSource, "MANUAL_ENTRY", "a row's own source wins");
    assert.equal(plan[0].command.type, COMMANDS.ADD_PLAYER);
  });

  it("requires a data source for every row", () => {
    const plan = planPlayerImport(setup(), parsePlayerImport(csv).rows, { dataSource: null, makeId });
    assert.match(plan[0].error, /data source/);
    assert.ok(plan[4].command, "rows that name their own source are still fine");
  });

  it("flags duplicates inside the file and planned commands apply cleanly in order", () => {
    const rows = parsePlayerImport("name,role,basePrice,isOverseas\nSame,BATTER,20,no\nsame,BATTER,20,no").rows;
    const plan = planPlayerImport(setup(), rows, { dataSource: "FICTIONAL", makeId });
    assert.deepEqual(plan[1].warnings, ["A player with this name already exists."]);

    let state = setup();
    for (const { command } of plan) {
      const result = reduce(state, { ...command, actor: ADMIN });
      assert.equal(result.ok, true);
      state = result.state;
    }
    assert.equal(state.playerOrder.length, setup().playerOrder.length + 2);
  });

  it("does not change the state it plans against", () => {
    const state = setup();
    planPlayerImport(state, parsePlayerImport(csv).rows, { dataSource: "FICTIONAL", makeId });
    assert.equal(state.version, 0);
  });
});
