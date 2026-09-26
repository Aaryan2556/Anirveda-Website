import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEV_DEFAULT_CONFIG, validateConfig } from "../config.js";
import { formatLakhs } from "../money.js";
import { reserveRequired } from "../engine/rules.js";
import mockPlayers from "../../../data/iplAuction/mockPlayers.js";
import mockTeams from "../../../data/iplAuction/mockTeams.js";
import { testConfig } from "./fixtures.js";

describe("config", () => {
  it("dev defaults are valid", () => {
    assert.deepEqual(validateConfig(DEV_DEFAULT_CONFIG), []);
  });

  it("rejects squad.min greater than squad.max", () => {
    const errors = validateConfig(testConfig({ squad: { min: 5, max: 3 } }));
    assert.ok(errors.some((e) => e.includes("squad.min")));
  });

  it("rejects role minimums that cannot fit in the squad", () => {
    const config = testConfig({
      squad: { min: 0, max: 2 },
      roleLimits: {
        BATTER: { min: 1, max: 2 },
        BOWLER: { min: 1, max: 2 },
        ALL_ROUNDER: { min: 1, max: 2 },
        WICKETKEEPER: { min: 0, max: 1 },
      },
    });
    assert.ok(validateConfig(config).some((e) => e.includes("role minimums")));
  });

  it("rejects non-whole-lakh purse and a reserve larger than the purse", () => {
    assert.ok(validateConfig(testConfig({ initialPurse: 99.5 })).length > 0);
    const reserve = testConfig({ squad: { min: 4, max: 4 }, minimumReserve: { enabled: true, perSlot: 300 } });
    assert.ok(validateConfig(reserve).some((e) => e.includes("minimumReserve")));
  });

  it("rejects unknown roles", () => {
    const config = testConfig();
    config.roleLimits.CAPTAIN = { min: 0, max: 1 };
    assert.ok(validateConfig(config).some((e) => e.includes("CAPTAIN")));
  });
});

describe("money", () => {
  it("formats whole lakhs for display", () => {
    assert.equal(formatLakhs(20), "₹20 L");
    assert.equal(formatLakhs(100), "₹1 Cr");
    assert.equal(formatLakhs(150), "₹1.5 Cr");
    assert.equal(formatLakhs(1025), "₹10.25 Cr");
    assert.equal(formatLakhs(null), "—");
  });
});

describe("minimum reserve", () => {
  it("reserve covers the slots still needed to reach squad.min", () => {
    const withReserve = testConfig({ squad: { min: 3, max: 4 }, minimumReserve: { enabled: true, perSlot: 50 } });
    assert.equal(reserveRequired(withReserve, 1), 100);
    assert.equal(reserveRequired(withReserve, 3), 0);
    assert.equal(reserveRequired(withReserve, 4), 0);
    assert.equal(reserveRequired(testConfig(), 1), 0, "disabled reserve");
  });
});

describe("mock data", () => {
  it("every mock player is labelled FICTIONAL and has a unique id", () => {
    assert.ok(mockPlayers.length >= 20);
    assert.ok(mockPlayers.every((player) => player.dataSource === "FICTIONAL"));
    assert.equal(new Set(mockPlayers.map((player) => player.id)).size, mockPlayers.length);
    assert.equal(new Set(mockTeams.map((team) => team.id)).size, mockTeams.length);
  });
});
