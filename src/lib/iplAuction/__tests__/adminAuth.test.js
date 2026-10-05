import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createAppwriteAdminAuth, createLocalAdminAuth } from "../auth/adminAuth.js";
import { ADMIN_LABEL, TABLE_PERMISSIONS } from "../repository/appwriteSchema.js";

function fakeAccount({ user = null } = {}) {
  let current = user;
  return {
    async get() {
      if (!current) throw Object.assign(new Error("missing scope"), { code: 401 });
      return current;
    },
    async createEmailPasswordSession(email, password) {
      if (password !== "right") throw Object.assign(new Error("Invalid credentials"), { code: 401 });
      current = { $id: "u1", name: "Admin", email, labels: email.startsWith("admin") ? [ADMIN_LABEL] : [] };
    },
    async deleteSession({ sessionId }) {
      assert.equal(sessionId, "current");
      current = null;
    },
  };
}

describe("admin auth", () => {
  it("local mode is always an admin with no login", async () => {
    const auth = createLocalAdminAuth();
    assert.equal(auth.kind, "local");
    assert.deepEqual(await auth.getSession(), { user: null, isAdmin: true });
  });

  it("appwrite mode: signed out → not admin; admin label → admin; other users → not admin", async () => {
    const auth = createAppwriteAdminAuth({ account: fakeAccount() });
    assert.deepEqual(await auth.getSession(), { user: null, isAdmin: false });

    const admin = await auth.signIn("admin@example.test", "right");
    assert.equal(admin.isAdmin, true);
    assert.equal(admin.user.email, "admin@example.test");

    await auth.signOut();
    assert.equal((await auth.getSession()).user, null);

    const team = await auth.signIn("team@example.test", "right");
    assert.equal(team.isAdmin, false);
  });

  it("wrong password and non-auth errors surface to the caller", async () => {
    const auth = createAppwriteAdminAuth({ account: fakeAccount() });
    await assert.rejects(auth.signIn("admin@example.test", "wrong"), /Invalid credentials/);
    const broken = createAppwriteAdminAuth({
      account: { get: async () => { throw Object.assign(new Error("server down"), { code: 500 }); } },
    });
    await assert.rejects(broken.getSession(), /server down/);
  });

  it("table permissions: anyone reads, only the admin label writes", () => {
    assert.ok(TABLE_PERMISSIONS.includes('read("any")'));
    for (const action of ["create", "update", "delete"]) {
      assert.ok(TABLE_PERMISSIONS.includes(`${action}("label:${ADMIN_LABEL}")`));
    }
    assert.ok(!TABLE_PERMISSIONS.some((p) => /^(create|update|delete)\("(any|users)"\)$/.test(p)));
    assert.match(ADMIN_LABEL, /^[a-zA-Z0-9]{1,36}$/, "Appwrite labels must be alphanumeric");
  });
});
