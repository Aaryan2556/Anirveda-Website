import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveTeamFromLabels, teamLabel } from "../auth/teamAuth.js";
import { makeId } from "../repository/mockSeed.js";
import { ADMIN_LABEL } from "../repository/appwriteSchema.js";

describe("team labels", () => {
  it("builds an alphanumeric label from the team ID", () => {
    assert.equal(teamLabel("mock-team-1"), "iplteammockteam1");
    assert.equal(teamLabel("team_A.2"), "iplteamteamA2");
  });

  it("every generated team ID gives a valid Appwrite label (alphanumeric, ≤ 36)", () => {
    for (let i = 0; i < 200; i += 1) {
      const label = teamLabel(makeId("team"));
      assert.match(label, /^[A-Za-z0-9]{1,36}$/);
    }
  });

  it("refuses IDs that can't make a label", () => {
    assert.equal(teamLabel("---"), null);
    assert.equal(teamLabel("x".repeat(40)), null);
  });

  it("never collides with the admin label", () => {
    assert.notEqual(teamLabel("admin"), ADMIN_LABEL);
  });
});

describe("resolveTeamFromLabels", () => {
  const teams = ["mock-team-1", "mock-team-2"];

  it("finds the one team the account is labelled for", () => {
    assert.deepEqual(resolveTeamFromLabels(["iplteammockteam2"], teams), { teamId: "mock-team-2", reason: null });
  });

  it("ignores unrelated labels", () => {
    assert.equal(resolveTeamFromLabels(["vip", "iplteammockteam1"], teams).teamId, "mock-team-1");
  });

  it("gives no team without a matching label, or for a team not in this auction", () => {
    assert.equal(resolveTeamFromLabels([], teams).teamId, null);
    assert.equal(resolveTeamFromLabels(["iplteammockteam9"], teams).teamId, null);
    assert.match(resolveTeamFromLabels([], teams).reason, /not linked/);
  });

  it("refuses an account labelled for two teams", () => {
    const result = resolveTeamFromLabels(["iplteammockteam1", "iplteammockteam2"], teams);
    assert.equal(result.teamId, null);
    assert.match(result.reason, /more than one team/);
  });
});
