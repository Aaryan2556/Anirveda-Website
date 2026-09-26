import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import AnnouncementBar from "../components/AnnouncementBar";
import Main from "../components/Home/Main";
import BigText from "../components/Home/BigText";
import About from "../components/Home/About";
import ContactUs from "../components/ContactUs";
import Testimonial from "../components/Home/Testimonial";
import StaggeredDropDown from "../components/Home/StaggeredDropDown";
import CustomCursor from "../components/CustomCursor";

/**
 * HomePage Container Component
 * Features GPU mouse tracking cursor, Hero banner, 3D WebGL globe dashboard,
 * smooth anchor-scrolling resolution, and performance-optimized section layout.
 */
const HomePage = () => {
  // Smooth scroll resolver for deep links and cross-page redirects
  useEffect(() => {
    const targetId =
      sessionStorage.getItem("anirveda_scroll_target") ||
      (window.location.hash ? window.location.hash.replace("#", "") : null);

    if (targetId) {
      sessionStorage.removeItem("anirveda_scroll_target");

      // Defer execution slightly to guarantee layout and child hydration are complete
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          const navOffset = 80; // height buffer for top navigation bar
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="bg-background text-foreground font-sans min-h-screen relative overflow-x-hidden">
      {/* Ambient Mouse Tracking Light & Cursor */}
      <CustomCursor />

      {/* Floating Announcement Bar Marquee */}
      <AnnouncementBar />

      {/* Hero Header & Navigation */}
      <div className="flex flex-col relative z-20">
        <Navbar />
        <Main />
      </div>

      {/* Sections with Target IDs for Direct Anchor Scrolling */}
      <div className="relative z-10 space-y-12">
        <div>
          <BigText />
        </div>

        {/* 1. Genesis & Mission Target */}
        <section id="about" className="scroll-mt-24">
          <About />
        </section>

        {/* 2. Flagship Events Target */}
        <section id="events" className="scroll-mt-24">
          <StaggeredDropDown />
        </section>

        {/* 3. Alumni Voices Target */}
        <section id="testimonials" className="scroll-mt-24">
          <Testimonial />
        </section>

        {/* 4. Contact Us Section */}
        <section id="contact" className="scroll-mt-24">
          <ContactUs />
        </section>
      </div>
    </div>
  );
};

export default HomePage;
