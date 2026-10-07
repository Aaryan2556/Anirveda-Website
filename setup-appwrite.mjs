import { Client, Databases, Permission, Role, ID } from "node-appwrite";

// --- CONFIGURATION ---
const ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;   // Paste your project ID here
const API_KEY = process.env.APPWRITE_API_KEY;         // Paste your secret API Key here

const IPL_DATABASE_ID = "ipl_elimination_db";
const TEAMS_COLLECTION_ID = "teams";
const QUESTIONS_COLLECTION_ID = "questions";
const SUBMISSIONS_COLLECTION_ID = "submissions";
const LEADERBOARD_COLLECTION_ID = "leaderboard";

// --- 10 IPL TEAMS DATA ---
const TEAMS_DATA = [
    { teamId: "csk", name: "Chennai Super Kings", shortName: "CSK" },
    { teamId: "mi", name: "Mumbai Indians", shortName: "MI" },
    { teamId: "rcb", name: "Royal Challengers Bengaluru", shortName: "RCB" },
    { teamId: "kkr", name: "Kolkata Knight Riders", shortName: "KKR" },
    { teamId: "srh", name: "Sunrisers Hyderabad", shortName: "SRH" },
    { teamId: "rr", name: "Rajasthan Royals", shortName: "RR" },
    { teamId: "dc", name: "Delhi Capitals", shortName: "DC" },
    { teamId: "pbks", name: "Punjab Kings", shortName: "PBKS" },
    { teamId: "gt", name: "Gujarat Titans", shortName: "GT" },
    { teamId: "lsg", name: "Lucknow Super Giants", shortName: "LSG" },
];

// --- 20 QUESTIONS & ANSWERS DATA ---
const QUESTIONS_DATA = [
    { id: 1, text: "Who was the most expensive buy in the IPL 2024 auction?", options: ["Pat Cummins", "Mitchell Starc", "Sam Curran", "Daryl Mitchell"], answer: "Mitchell Starc" },
    { id: 2, text: "Which team has won 5 IPL trophies alongside Mumbai Indians?", options: ["Kolkata Knight Riders", "Chennai Super Kings", "Sunrisers Hyderabad", "Rajasthan Royals"], answer: "Chennai Super Kings" },
    { id: 3, text: "Who holds the record for the most runs scored in a single IPL season (973 runs)?", options: ["David Warner", "Chris Gayle", "Virat Kohli", "Jos Buttler"], answer: "Virat Kohli" },
    { id: 4, text: "Who holds the best bowling figures in IPL history (6/12)?", options: ["Sohail Tanvir", "Alzarri Joseph", "Adam Zampa", "Anil Kumble"], answer: "Alzarri Joseph" },
    { id: 5, text: "Who is popularly known as 'Mr. IPL' for his consistent performances?", options: ["Suresh Raina", "MS Dhoni", "Rohit Sharma", "AB de Villiers"], answer: "Suresh Raina" },
    { id: 6, text: "Which franchise won the IPL title in 2012, 2014, and 2024?", options: ["Sunrisers Hyderabad", "Kolkata Knight Riders", "Gujarat Titans", "Chennai Super Kings"], answer: "Kolkata Knight Riders" },
    { id: 7, text: "Who hit the highest individual score in IPL history (175* off 66 balls)?", options: ["Brendon McCullum", "Chris Gayle", "AB de Villiers", "KL Rahul"], answer: "Chris Gayle" },
    { id: 8, text: "Who is the all-time highest wicket-taker in IPL history?", options: ["Dwayne Bravo", "Yuzvendra Chahal", "Piyush Chawla", "Bhuvneshwar Kumar"], answer: "Yuzvendra Chahal" },
    { id: 9, text: "Which overseas batsman has won the Orange Cap the most times (3 times)?", options: ["Chris Gayle", "David Warner", "Faf du Plessis", "Shane Watson"], answer: "David Warner" },
    { id: 10, text: "Which franchise was previously known as Kings XI Punjab?", options: ["Delhi Capitals", "Punjab Kings", "Lucknow Super Giants", "Gujarat Titans"], answer: "Punjab Kings" },
    { id: 11, text: "Who captained Rajasthan Royals to their first and only IPL title in the inaugural 2008 season?", options: ["Shane Warne", "Rahul Dravid", "Graeme Smith", "Shane Watson"], answer: "Shane Warne" },
    { id: 12, text: "Which bowler has taken the most hat-tricks in IPL history (3 hat-tricks)?", options: ["Amit Mishra", "Lasith Malinga", "Yuvraj Singh", "Rashid Khan"], answer: "Amit Mishra" },
    { id: 13, text: "Which franchise won the IPL championship in its debut season in 2022?", options: ["Lucknow Super Giants", "Gujarat Titans", "Rising Pune Supergiant", "Kochi Tuskers Kerala"], answer: "Gujarat Titans" },
    { id: 14, text: "Who holds the record for the fastest 50 in IPL history (13 balls)?", options: ["Pat Cummins", "Yashasvi Jaiswal", "KL Rahul", "Nicholas Pooran"], answer: "Yashasvi Jaiswal" },
    { id: 15, text: "Which player has won the Most Valuable Player (MVP) award in IPL 3 times?", options: ["Andre Russell", "Sunil Narine", "Shane Watson", "Virat Kohli"], answer: "Sunil Narine" },
    { id: 16, text: "What team posted the lowest total in IPL history (49 all out)?", options: ["Delhi Daredevils", "Rajasthan Royals", "Royal Challengers Bengaluru", "Sunrisers Hyderabad"], answer: "Royal Challengers Bengaluru" },
    { id: 17, text: "Who was the first Indian to score a century in IPL history?", options: ["Manish Pandey", "Paul Valthaty", "Virat Kohli", "Virender Sehwag"], answer: "Manish Pandey" },
    { id: 18, text: "Which player has bowled the most dot balls in IPL history?", options: ["Bhuvneshwar Kumar", "Sunil Narine", "Ravichandran Ashwin", "Lasith Malinga"], answer: "Bhuvneshwar Kumar" },
    { id: 19, text: "Who captained Mumbai Indians in the 2024 season?", options: ["Rohit Sharma", "Hardik Pandya", "Suryakumar Yadav", "Jasprit Bumrah"], answer: "Hardik Pandya" },
    { id: 20, text: "Which team has the highest team total in IPL history (287/3)?", options: ["Royal Challengers Bengaluru", "Kolkata Knight Riders", "Sunrisers Hyderabad", "Mumbai Indians"], answer: "Sunrisers Hyderabad" },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup() {
    const client = new Client()
        .setEndpoint(ENDPOINT)
        .setProject(PROJECT_ID)
        .setKey(API_KEY);

    const databases = new Databases(client);

    console.log("🚀 Starting automated Appwrite setup...\n");

    // 1. Create Database
    try {
        console.log(`Creating Database [${IPL_DATABASE_ID}]...`);
        await databases.create(IPL_DATABASE_ID, "IPL Auction Elimination");
        console.log("✅ Database created.");
    } catch (err) {
        if (err.code === 409) console.log("ℹ️  Database already exists, skipping creation.");
        else throw err;
    }

    // 2. Create 'teams' Collection
    // Permissions: ANY user can READ and UPDATE (so TeamLogin can update isEntered lock)
    try {
        console.log(`Creating/Updating Collection [${TEAMS_COLLECTION_ID}]...`);
        try {
            await databases.createCollection(
                IPL_DATABASE_ID,
                TEAMS_COLLECTION_ID,
                "Teams",
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.any()),
                    Permission.create(Role.any())
                ]
            );
            console.log("✅ Teams collection created.");
        } catch (err) {
            if (err.code === 409) {
                console.log("ℹ️  Teams collection already exists, updating permissions...");
                await databases.updateCollection(
                    IPL_DATABASE_ID,
                    TEAMS_COLLECTION_ID,
                    "Teams",
                    [
                        Permission.read(Role.any()),
                        Permission.update(Role.any()),
                        Permission.create(Role.any())
                    ]
                );
                console.log("✅ Teams collection permissions updated.");
            } else throw err;
        }

        console.log("Adding attributes to Teams collection...");
        try {
            await databases.createStringAttribute(IPL_DATABASE_ID, TEAMS_COLLECTION_ID, "teamId", 50, true);
        } catch (e) {}
        try {
            await databases.createStringAttribute(IPL_DATABASE_ID, TEAMS_COLLECTION_ID, "name", 255, true);
        } catch (e) {}
        try {
            await databases.createStringAttribute(IPL_DATABASE_ID, TEAMS_COLLECTION_ID, "shortName", 20, true);
        } catch (e) {}
        try {
            await databases.createBooleanAttribute(IPL_DATABASE_ID, TEAMS_COLLECTION_ID, "isEntered", false, false);
            console.log("✅ isEntered boolean attribute created.");
        } catch (e) {}
        console.log("✅ Attributes verified. Waiting 5s for Appwrite schema indexer...");
        await sleep(5000);
    } catch (err) {
        console.error("Teams setup error:", err.message);
    }

    // 3. Create 'questions' Collection
    // Permissions: ANY user can READ (so teams get questions)
    try {
        console.log(`Creating Collection [${QUESTIONS_COLLECTION_ID}]...`);
        await databases.createCollection(
            IPL_DATABASE_ID,
            QUESTIONS_COLLECTION_ID,
            "Questions",
            [Permission.read(Role.any())]
        );
        console.log("✅ Questions collection created.");

        console.log("Adding attributes to Questions collection...");
        await databases.createIntegerAttribute(IPL_DATABASE_ID, QUESTIONS_COLLECTION_ID, "questionId", true);
        await databases.createStringAttribute(IPL_DATABASE_ID, QUESTIONS_COLLECTION_ID, "text", 1000, true);
        await databases.createStringAttribute(IPL_DATABASE_ID, QUESTIONS_COLLECTION_ID, "options", 255, true, undefined, true); // array: true
        await databases.createStringAttribute(IPL_DATABASE_ID, QUESTIONS_COLLECTION_ID, "answer", 255, true);
        console.log("✅ Attributes created. Waiting 5s for Appwrite schema indexer...");
        await sleep(5000);
    } catch (err) {
        if (err.code === 409) console.log("ℹ️  Questions collection already exists, skipping creation.");
        else throw err;
    }

    // 4. Create 'submissions' Collection
    // Permissions: ANY user can CREATE only (write-only drop box)
    try {
        console.log(`Creating Collection [${SUBMISSIONS_COLLECTION_ID}]...`);
        await databases.createCollection(
            IPL_DATABASE_ID,
            SUBMISSIONS_COLLECTION_ID,
            "Submissions",
            [
                Permission.create(Role.any()),
                Permission.read(Role.any()),
            ]
        );
        console.log("✅ Submissions collection created.");

        console.log("Adding attributes to Submissions collection...");
        await databases.createStringAttribute(IPL_DATABASE_ID, SUBMISSIONS_COLLECTION_ID, "teamId", 100, true);
        await databases.createStringAttribute(IPL_DATABASE_ID, SUBMISSIONS_COLLECTION_ID, "teamName", 255, true);
        await databases.createIntegerAttribute(IPL_DATABASE_ID, SUBMISSIONS_COLLECTION_ID, "questionId", true);
        await databases.createStringAttribute(IPL_DATABASE_ID, SUBMISSIONS_COLLECTION_ID, "selectedOption", 255, true);
        await databases.createStringAttribute(IPL_DATABASE_ID, SUBMISSIONS_COLLECTION_ID, "submittedAt", 50, false);
        console.log("✅ Attributes created. Waiting 5s for Appwrite schema indexer...");
        await sleep(5000);
    } catch (err) {
        if (err.code === 409) console.log("ℹ️  Submissions collection already exists, skipping creation.");
        else throw err;
    }

    try {
        console.log(`Creating Collection [${LEADERBOARD_COLLECTION_ID}]...`);
        await databases.createCollection(
            IPL_DATABASE_ID,
            LEADERBOARD_COLLECTION_ID,
            "Leaderboard",
            [
                Permission.create(Role.any()),
                Permission.read(Role.any()),
                Permission.update(Role.any())
            ]
        );
        console.log("✅ Leaderboard collection created.");

        console.log("Adding attributes to Leaderboard collection...");
        await databases.createStringAttribute(IPL_DATABASE_ID, LEADERBOARD_COLLECTION_ID, "teamId", 100, true);
        await databases.createStringAttribute(IPL_DATABASE_ID, LEADERBOARD_COLLECTION_ID, "teamName", 255, true);
        await databases.createIntegerAttribute(IPL_DATABASE_ID, LEADERBOARD_COLLECTION_ID, "score", true, 0);
        await databases.createIntegerAttribute(IPL_DATABASE_ID, LEADERBOARD_COLLECTION_ID, "questionsAnswered", false, 0);
        await databases.createStringAttribute(IPL_DATABASE_ID, LEADERBOARD_COLLECTION_ID, "updatedAt", 50, false);

        console.log("✅ Leaderboard attributes configured.");
        await sleep(3000);
    } catch (err) {
        if (err.code === 409) {
            console.log("ℹ️  Leaderboard collection already exists, skipping creation.");
        } else {
            throw err;
        }
    }

    // 5. Seed Teams Data
    console.log("\n📥 Seeding all 10 IPL teams into database...");
    for (const t of TEAMS_DATA) {
        try {
            await databases.createDocument(
                IPL_DATABASE_ID,
                TEAMS_COLLECTION_ID,
                ID.unique(),
                {
                    teamId: t.teamId,
                    name: t.name,
                    shortName: t.shortName,
                }
            );
            process.stdout.write(`  ✓ Seeded Team: ${t.name} (${t.shortName})\n`);
        } catch (err) {
            console.error(`  ❌ Failed Team ${t.name}:`, err.message);
        }
    }

    // 6. Seed Questions Data
    console.log("\n📥 Seeding all 20 questions into database...");
    for (const q of QUESTIONS_DATA) {
        try {
            await databases.createDocument(
                IPL_DATABASE_ID,
                QUESTIONS_COLLECTION_ID,
                ID.unique(),
                {
                    questionId: q.id,
                    text: q.text,
                    options: q.options,
                    answer: q.answer,
                }
            );
            process.stdout.write(`  ✓ Seeded Q#${q.id} - ${q.options[0]}...\n`);
        } catch (err) {
            console.error(`  ❌ Failed Q#${q.id}:`, err.message);
        }
    }

    console.log("\n🎉 ALL DONE! Database, collections, and sample data are ready.");
}

setup().catch(console.error);