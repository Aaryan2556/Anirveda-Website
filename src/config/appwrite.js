import { Client, Databases, Account, ID, Query, TablesDB } from "appwrite";

const client = new Client();

// Only configure what is set, so a missing env var doesn't crash every page on import.
if (import.meta.env.VITE_APPWRITE_ENDPOINT) client.setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT);
if (import.meta.env.VITE_APPWRITE_PROJECT_ID) client.setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

// SINGLE DECLARATION with fallback
export const DATABASE_ID =
  import.meta.env.VITE_APPWRITE_DATABASE_ID || "ipl_elimination_db";

export const TEAMS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_TEAMS_COLLECTION_ID || "teams";

export const SITUATIONS_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_SITUATIONS_COLLECTION_ID;

export const RESPONSES_COLLECTION_ID =
  import.meta.env.VITE_APPWRITE_RESPONSES_COLLECTION_ID;

// IPL Auction (separate dev database; table IDs live in src/lib/iplAuction/repository/appwriteSchema.js)
export const tablesDB = new TablesDB(client);
export const IPL_AUCTION_DATABASE_ID =
  import.meta.env.VITE_IPL_AUCTION_DATABASE_ID || DATABASE_ID;

// Target collections for Elimination Round
export const IPL_DATABASE_ID ="ipl_elimination_db";

export const COLLECTIONS = {
  TEAMS: "teams",
  QUESTIONS: "questions",
  SUBMISSIONS: "submissions",
  LEADERBOARD: "leaderboard",
};

export default client;
export { ID, Query, client };
