/**
 * ============================================================================
 *  FICTIONAL MOCK PLAYERS — LOCAL DEVELOPMENT AND TESTING ONLY
 * ============================================================================
 *  Every name, statistic and recent-performance entry below is INVENTED.
 *  None of it describes a real cricketer. Any resemblance to a real person is
 *  coincidental. Each record carries dataSource: "FICTIONAL" so the UI can
 *  label it, and it must never be presented as real data.
 *
 *  Base prices are whole lakhs (₹1 Cr = 100 lakhs).
 * ============================================================================
 */

const FICTIONAL = "FICTIONAL";

const batting = (matches, innings, runs, average, strikeRate, fifties, hundreds, highestScore) => ({
  matches, innings, runs, average, strikeRate, fifties, hundreds, highestScore,
});

const bowling = (matches, innings, wickets, economy, average, strikeRate, bestBowling) => ({
  matches, innings, wickets, economy, average, strikeRate, bestBowling,
});

const keeping = (catches, stumpings) => ({ catches, stumpings });

let counter = 0;
const player = (fields) => {
  counter += 1;
  return {
    id: `mock-player-${String(counter).padStart(2, "0")}`,
    image: null,
    dataSource: FICTIONAL,
    ...fields,
  };
};

const mockPlayers = [
  // ----- Batters -----
  player({ name: "Aarav Kesarwala", nationality: "India", isOverseas: false, age: 27, role: "BATTER",
    battingStyle: "Right-hand bat", bowlingStyle: null, basePrice: 200,
    stats: { batting: batting(88, 86, 2710, 36.1, 139.4, 21, 2, "112*") },
    recentPerformance: ["64 (41)", "12 (10)", "88* (52)", "30 (22)", "5 (7)"] }),
  player({ name: "Liam Castellow", nationality: "Australia", isOverseas: true, age: 29, role: "BATTER",
    battingStyle: "Left-hand bat", bowlingStyle: null, basePrice: 150,
    stats: { batting: batting(71, 70, 2204, 33.4, 147.8, 17, 1, "104") },
    recentPerformance: ["45 (28)", "71 (39)", "2 (4)", "18 (11)", "56 (33)"] }),
  player({ name: "Ishaan Vadhera", nationality: "India", isOverseas: false, age: 22, role: "BATTER",
    battingStyle: "Right-hand bat", bowlingStyle: null, basePrice: 30,
    stats: { batting: batting(14, 13, 322, 26.8, 131.2, 2, 0, "67") },
    recentPerformance: ["67 (44)", "9 (8)", "21 (19)"] }),
  player({ name: "Theo Brankworth", nationality: "England", isOverseas: true, age: 31, role: "BATTER",
    battingStyle: "Right-hand bat", bowlingStyle: null, basePrice: 100,
    stats: { batting: batting(96, 94, 2630, 30.2, 142.1, 18, 1, "101*") },
    recentPerformance: ["33 (20)", "0 (1)", "59 (35)", "40 (27)", "14 (12)"] }),
  player({ name: "Reyansh Kothiwal", nationality: "India", isOverseas: false, age: 25, role: "BATTER",
    battingStyle: "Left-hand bat", bowlingStyle: null, basePrice: 50,
    stats: { batting: batting(38, 36, 905, 28.3, 128.6, 5, 0, "79") },
    recentPerformance: ["79 (55)", "26 (21)", "11 (9)", "44 (37)"] }),
  player({ name: "Darnell Pryceworth", nationality: "West Indies", isOverseas: true, age: 28, role: "BATTER",
    battingStyle: "Left-hand bat", bowlingStyle: null, basePrice: 75,
    stats: { batting: batting(52, 51, 1318, 27.5, 158.3, 9, 0, "94") },
    recentPerformance: ["94 (46)", "7 (5)", "38 (17)", "1 (3)", "50 (24)"] }),
  player({ name: "Kabir Solankar", nationality: "India", isOverseas: false, age: 20, role: "BATTER",
    battingStyle: "Right-hand bat", bowlingStyle: null, basePrice: 20,
    stats: { batting: batting(6, 6, 118, 19.7, 124.2, 0, 0, "41") },
    recentPerformance: ["41 (33)", "3 (6)", "18 (15)"] }),
  player({ name: "Vihaan Mirchandra", nationality: "India", isOverseas: false, age: 30, role: "BATTER",
    battingStyle: "Right-hand bat", bowlingStyle: null, basePrice: 75,
    stats: { batting: batting(64, 61, 1602, 29.1, 133.7, 10, 0, "88") },
    recentPerformance: ["20 (18)", "62 (40)", "35 (29)", "9 (11)"] }),

  // ----- Bowlers -----
  player({ name: "Nikhil Barvadkar", nationality: "India", isOverseas: false, age: 28, role: "BOWLER",
    battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast", basePrice: 150,
    stats: { bowling: bowling(80, 79, 98, 7.9, 22.4, 17.0, "4/18") },
    recentPerformance: ["2/24 (4)", "1/31 (4)", "3/19 (4)", "0/38 (4)", "2/27 (4)"] }),
  player({ name: "Jonah Ferreira-Blake", nationality: "South Africa", isOverseas: true, age: 26, role: "BOWLER",
    battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast", basePrice: 125,
    stats: { bowling: bowling(47, 47, 61, 8.3, 20.9, 15.1, "5/22") },
    recentPerformance: ["3/28 (4)", "2/35 (4)", "1/22 (3)", "4/30 (4)"] }),
  player({ name: "Harshil Maniyar", nationality: "India", isOverseas: false, age: 24, role: "BOWLER",
    battingStyle: "Right-hand bat", bowlingStyle: "Leg-break", basePrice: 50,
    stats: { bowling: bowling(29, 28, 31, 7.6, 24.3, 19.2, "3/17") },
    recentPerformance: ["1/26 (4)", "2/21 (4)", "0/33 (3)"] }),
  player({ name: "Mateo Lindqvist", nationality: "New Zealand", isOverseas: true, age: 32, role: "BOWLER",
    battingStyle: "Left-hand bat", bowlingStyle: "Left-arm medium-fast", basePrice: 75,
    stats: { bowling: bowling(66, 65, 72, 8.1, 25.6, 19.0, "4/25") },
    recentPerformance: ["1/40 (4)", "2/29 (4)", "2/33 (4)", "0/25 (2)"] }),
  player({ name: "Pranav Dhulekar", nationality: "India", isOverseas: false, age: 21, role: "BOWLER",
    battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium", basePrice: 20,
    stats: { bowling: bowling(8, 8, 7, 8.8, 30.1, 20.6, "2/24") },
    recentPerformance: ["2/24 (4)", "0/41 (4)"] }),
  player({ name: "Farid Nooranzai", nationality: "Afghanistan", isOverseas: true, age: 23, role: "BOWLER",
    battingStyle: "Right-hand bat", bowlingStyle: "Left-arm wrist-spin", basePrice: 100,
    stats: { bowling: bowling(39, 39, 52, 7.1, 18.7, 15.8, "4/14") },
    recentPerformance: ["2/18 (4)", "3/21 (4)", "1/27 (4)", "2/16 (4)"] }),
  player({ name: "Sameer Tolakia", nationality: "India", isOverseas: false, age: 33, role: "BOWLER",
    battingStyle: "Right-hand bat", bowlingStyle: "Off-break", basePrice: 50,
    stats: { bowling: bowling(91, 88, 84, 7.4, 27.9, 22.6, "3/12") },
    recentPerformance: ["1/28 (4)", "1/24 (4)", "0/30 (3)", "2/26 (4)"] }),
  player({ name: "Owen Hartsfield", nationality: "England", isOverseas: true, age: 27, role: "BOWLER",
    battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium", basePrice: 50,
    stats: { bowling: bowling(33, 33, 37, 8.6, 24.9, 17.4, "3/26") },
    recentPerformance: ["2/37 (4)", "0/29 (3)", "3/26 (4)"] }),

  // ----- All-rounders -----
  player({ name: "Advait Rajgorwala", nationality: "India", isOverseas: false, age: 26, role: "ALL_ROUNDER",
    battingStyle: "Left-hand bat", bowlingStyle: "Slow left-arm orthodox", basePrice: 200,
    stats: {
      batting: batting(74, 60, 1310, 28.5, 141.0, 6, 0, "83*"),
      bowling: bowling(74, 70, 58, 7.5, 27.2, 21.8, "3/20"),
    },
    recentPerformance: ["41 (25) & 1/22", "8 (6) & 2/19", "55* (30) & 0/31"] }),
  player({ name: "Callum Westerby", nationality: "Australia", isOverseas: true, age: 30, role: "ALL_ROUNDER",
    battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium", basePrice: 150,
    stats: {
      batting: batting(81, 72, 1580, 25.9, 152.6, 8, 0, "91"),
      bowling: bowling(81, 75, 69, 8.9, 26.4, 17.8, "4/31"),
    },
    recentPerformance: ["22 (11) & 2/36", "60 (29) & 0/41", "15 (9) & 3/28"] }),
  player({ name: "Yuvaan Bhimani", nationality: "India", isOverseas: false, age: 23, role: "ALL_ROUNDER",
    battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium", basePrice: 30,
    stats: {
      batting: batting(17, 14, 244, 20.3, 136.3, 1, 0, "52"),
      bowling: bowling(17, 15, 12, 8.7, 29.8, 20.5, "2/21"),
    },
    recentPerformance: ["52 (31) & 0/18", "4 (5) & 2/21"] }),
  player({ name: "Kofi Mensah-Doyle", nationality: "West Indies", isOverseas: true, age: 29, role: "ALL_ROUNDER",
    battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium", basePrice: 100,
    stats: {
      batting: batting(58, 50, 960, 24.0, 161.2, 4, 0, "77"),
      bowling: bowling(58, 54, 49, 9.2, 27.1, 17.7, "3/24"),
    },
    recentPerformance: ["31 (13) & 1/39", "77 (35) & 2/30", "0 (2) & 1/44"] }),
  player({ name: "Siddhant Parekhji", nationality: "India", isOverseas: false, age: 31, role: "ALL_ROUNDER",
    battingStyle: "Right-hand bat", bowlingStyle: "Off-break", basePrice: 75,
    stats: {
      batting: batting(90, 70, 1245, 23.1, 129.8, 3, 0, "68"),
      bowling: bowling(90, 82, 63, 7.2, 29.5, 24.5, "3/15"),
    },
    recentPerformance: ["18 (15) & 1/24", "27 (21) & 2/22", "6 (8) & 0/28"] }),
  player({ name: "Ruwan Senadheeragoda", nationality: "Sri Lanka", isOverseas: true, age: 25, role: "ALL_ROUNDER",
    battingStyle: "Left-hand bat", bowlingStyle: "Leg-break", basePrice: 50,
    stats: {
      batting: batting(26, 21, 402, 22.3, 138.1, 2, 0, "61"),
      bowling: bowling(26, 25, 24, 7.8, 25.6, 19.7, "3/23"),
    },
    recentPerformance: ["61 (40) & 1/30", "12 (9) & 3/23"] }),
  player({ name: "Om Trivedkar", nationality: "India", isOverseas: false, age: 19, role: "ALL_ROUNDER",
    battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium-fast", basePrice: 20,
    stats: {
      batting: batting(4, 3, 47, 15.7, 117.5, 0, 0, "29"),
      bowling: bowling(4, 4, 3, 9.1, 36.0, 23.7, "2/33"),
    },
    recentPerformance: ["29 (24) & 2/33"] }),

  // ----- Wicketkeepers -----
  player({ name: "Arjun Mehtaliya", nationality: "India", isOverseas: false, age: 28, role: "WICKETKEEPER",
    battingStyle: "Right-hand bat", bowlingStyle: null, basePrice: 200,
    stats: { batting: batting(85, 83, 2455, 34.6, 144.9, 19, 1, "108"), keeping: keeping(49, 14) },
    recentPerformance: ["73 (44)", "19 (14)", "47 (30)", "2 (3)", "66* (38)"] }),
  player({ name: "Ethan Wrayburn", nationality: "England", isOverseas: true, age: 27, role: "WICKETKEEPER",
    battingStyle: "Left-hand bat", bowlingStyle: null, basePrice: 100,
    stats: { batting: batting(55, 54, 1450, 29.0, 150.4, 11, 0, "97") , keeping: keeping(31, 7) },
    recentPerformance: ["97 (51)", "14 (9)", "25 (16)", "38 (25)"] }),
  player({ name: "Tanmay Ghoshalkar", nationality: "India", isOverseas: false, age: 24, role: "WICKETKEEPER",
    battingStyle: "Right-hand bat", bowlingStyle: null, basePrice: 30,
    stats: { batting: batting(19, 17, 356, 22.3, 129.0, 1, 0, "58"), keeping: keeping(12, 4) },
    recentPerformance: ["58 (42)", "6 (9)", "21 (16)"] }),
  player({ name: "Brandon Okafor-Leigh", nationality: "South Africa", isOverseas: true, age: 33, role: "WICKETKEEPER",
    battingStyle: "Right-hand bat", bowlingStyle: null, basePrice: 75,
    stats: { batting: batting(92, 90, 2380, 29.4, 137.2, 15, 1, "100") , keeping: keeping(57, 11) },
    recentPerformance: ["12 (10)", "44 (29)", "31 (26)", "0 (2)"] }),
  player({ name: "Rudra Pandhare", nationality: "India", isOverseas: false, age: 21, role: "WICKETKEEPER",
    battingStyle: "Left-hand bat", bowlingStyle: null, basePrice: 20,
    stats: { batting: batting(5, 5, 88, 17.6, 121.9, 0, 0, "36"), keeping: keeping(3, 1) },
    recentPerformance: ["36 (28)", "10 (12)"] }),
  player({ name: "Devansh Kulkarnee", nationality: "India", isOverseas: false, age: 29, role: "WICKETKEEPER",
    battingStyle: "Right-hand bat", bowlingStyle: null, basePrice: 50,
    stats: { batting: batting(47, 44, 1012, 25.3, 132.5, 6, 0, "81"), keeping: keeping(28, 9) },
    recentPerformance: ["81 (57)", "15 (13)", "22 (20)"] }),
];

export default mockPlayers;
