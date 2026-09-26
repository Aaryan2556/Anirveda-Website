/**
 * Who is the admin? Two interchangeable implementations with the same shape:
 *
 *   kind                          "local" | "appwrite"
 *   getSession()  -> { user, isAdmin }
 *   signIn(email, password) -> { user, isAdmin }
 *   signOut()
 *
 * Local mode has no login (everything stays in this browser). Appwrite mode uses
 * an Appwrite Account session; a user is an admin when they carry ADMIN_LABEL.
 * The label only drives the UI — Appwrite table permissions are what actually
 * stop non-admins from writing.
 */
import { ADMIN_LABEL } from "../repository/appwriteSchema.js";

export function createLocalAdminAuth() {
  const session = { user: null, isAdmin: true };
  return {
    kind: "local",
    getSession: async () => session,
    signIn: async () => session,
    signOut: async () => {},
  };
}

export function createAppwriteAdminAuth({ account }) {
  async function getSession() {
    try {
      const user = await account.get();
      return {
        user: { id: user.$id, name: user.name, email: user.email, labels: user.labels ?? [] },
        isAdmin: (user.labels ?? []).includes(ADMIN_LABEL),
      };
    } catch (error) {
      if (error?.code === 401) return { user: null, isAdmin: false }; // not signed in
      throw error;
    }
  }

  return {
    kind: "appwrite",
    getSession,
    async signIn(email, password) {
      await account.createEmailPasswordSession({ email, password });
      return getSession();
    },
    async signOut() {
      await account.deleteSession({ sessionId: "current" });
    },
  };
}
