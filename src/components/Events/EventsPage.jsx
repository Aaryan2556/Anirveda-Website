import React from "react";
import PastEventsCards from "./PastEventCards";
import UpcomingEventsTimeline from "./UpcomingEventCards.jsx";

export default function EventsSection() {
  return (
    <section className="w-full">
      {/* Reduced mobile top padding from py-16 to pt-3 sm:pt-12 pb-10 sm:pb-16 */}
      <div className="container mx-auto px-4 sm:px-5 pt-3 sm:pt-12 pb-10 sm:pb-16">
        <UpcomingEventsTimeline />
      </div>

      <div className="container mx-auto px-4 sm:px-5 pb-16">
        <PastEventsCards />
      </div>
    </section>
  );
}