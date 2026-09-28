import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPurchasesCsv, buildSummaryJson, toCsv } from "../io/auctionExport.js";
import { buy, live } from "./fixtures.js";

describe("auction exports", () => {
  it("escapes CSV cells", () => {
    assert.equal(toCsv([["a,b", 'q"q', null, 3]]), '"a,b","q""q",,3');
  });

  it("lists purchases in sale order with prices in lakhs", () => {
    const state = buy(buy(live(), "t2", "bat2", 70), "t1", "bowl2", 90);
    const lines = buildPurchasesCsv(state).split("\r\n");
    assert.equal(lines.length, 3);
    assert.match(lines[0], /^#,Player,Role/);
    assert.match(lines[1], /^1,Test bat2,Batter,No,50,Test Team Two,70,/);
    assert.match(lines[2], /^2,Test bowl2,Bowler,Yes,75,Test Team One,90,.*FICTIONAL$/);
  });

  it("summarises every team", () => {
    const state = buy(live(), "t2", "bat2", 70);
    const summary = JSON.parse(buildSummaryJson(state));
    assert.equal(summary.moneyUnit, "lakhs");
    assert.equal(summary.totalSpent, 70);
    assert.equal(summary.teams.length, 3);
    const t2 = summary.teams.find((team) => team.id === "t2");
    assert.deepEqual([t2.spent, t2.purseLeft, t2.squadSize, t2.roles.BATTER], [70, 930, 1, 1]);
    assert.deepEqual(t2.squad.map((player) => [player.name, player.price]), [["Test bat2", 70]]);
  });
});
