import { sponsorsData } from "./sponsorsData";

// Re-export sponsors array for backwards compatibility
export const sponsors = sponsorsData.filter(
  (s) => ["SPONSOR_01", "SPONSOR_05", "SPONSOR_06", "SPONSOR_07", "SPONSOR_08"].includes(s.id)
);

export default sponsors;