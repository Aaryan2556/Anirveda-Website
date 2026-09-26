import { sponsorsData } from "./sponsorsData";

// Re-export ecoSponsors array for backwards compatibility
export const sponsors = sponsorsData.filter(
  (s) => ["SPONSOR_02", "SPONSOR_03", "SPONSOR_04"].includes(s.id)
);

export default sponsors;