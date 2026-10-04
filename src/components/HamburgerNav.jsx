import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

// Reusable logo (optional, for consistency)
const OrgLogo = () => {
  return (
    <img
      src="./images/logos/logo_white.webp"
      alt="Anirveda Logo"
      className="h-5 w-5 object-contain"
    />
  );
};

export default function HamburgerNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreClicked, setIsMoreClicked] = useState(false);

  const handleHamburgerClick = () => {
    setIsOpen(!isOpen);
  };

  const handleMoreClick = () => {
    setIsMoreClicked(!isMoreClicked);
  };

  return (
    <div>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2">
        <Link to="/" className="flex items-center min-h-[44px] min-w-[44px]">
          <img
            src="./images/logos/logo.webp"
            alt="Anirveda Logo"
            className="h-8 w-auto object-contain"
          />
        </Link>
        <button
          onClick={handleHamburgerClick}
          aria-label="Open Navigation Menu"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-primary hover:bg-card/80 transition-colors"
        >
          <Icon
            icon="charm:menu-hamburger"
            color={"#D4AF37"}
            className="text-3xl sm:text-4xl"
          />
        </button>
      </div>

      {/* Hamburger bar items */}
      <div
        className={`fixed inset-0 z-50 h-full w-full bg-obsidian-900/95 backdrop-blur-2xl px-5 pt-4 pb-8 font-sans text-slate-100 overflow-y-auto transition-transform duration-300 ease-in-out  
    ${isOpen ? "translate-x-0" : "translate-x-[-100%]"}`}
      >
        {/* Top Bar inside drawer */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <Link to="/" onClick={handleHamburgerClick} className="flex items-center min-h-[44px]">
            <img
              src="./images/logos/logo_white.webp"
              alt="Anirveda Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <button
            onClick={handleHamburgerClick}
            aria-label="Close Navigation Menu"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-primary hover:bg-card/80 transition-colors"
          >
            <Icon
              icon="akar-icons:cross"
              color={"#D4AF37"}
              className="text-2xl"
            />
          </button>
        </div>

        {/* Links */}
        <div className="mt-6 flex flex-col items-center space-y-2 text-xl font-mono">
          <Link to="/" onClick={handleHamburgerClick} className="w-full text-center py-2.5 min-h-[44px] flex items-center justify-center rounded-xl hover:bg-card/60 transition-colors">
            <span className="uppercase text-foreground hover:text-primary">Home</span>
          </Link>
          <Link to="/events" onClick={handleHamburgerClick} className="w-full text-center py-2.5 min-h-[44px] flex items-center justify-center rounded-xl hover:bg-card/60 transition-colors">
            <span className="uppercase text-foreground hover:text-primary">Events</span>
          </Link>
          <Link to="/gallery" onClick={handleHamburgerClick} className="w-full text-center py-2.5 min-h-[44px] flex items-center justify-center rounded-xl hover:bg-card/60 transition-colors">
            <span className="uppercase text-foreground hover:text-primary">Gallery</span>
          </Link>
          <Link to="/committee" onClick={handleHamburgerClick} className="w-full text-center py-2.5 min-h-[44px] flex items-center justify-center rounded-xl hover:bg-card/60 transition-colors">
            <span className="uppercase text-foreground hover:text-primary">Committee</span>
          </Link>
          <Link to="/sponsors" onClick={handleHamburgerClick} className="w-full text-center py-2.5 min-h-[44px] flex items-center justify-center rounded-xl hover:bg-card/60 transition-colors">
            <span className="uppercase text-foreground hover:text-primary">Sponsors</span>
          </Link>
          <Link to="/blogs" onClick={handleHamburgerClick} className="w-full text-center py-2.5 min-h-[44px] flex items-center justify-center rounded-xl hover:bg-card/60 transition-colors">
            <span className="uppercase text-foreground hover:text-primary">Blogs</span>
          </Link>
          <a href="#contact" onClick={handleHamburgerClick} className="w-full text-center py-2.5 min-h-[44px] flex items-center justify-center rounded-xl hover:bg-card/60 transition-colors">
            <span className="uppercase text-foreground hover:text-primary">Contact</span>
          </a>

          {/* Collapsible More */}
          <button
            onClick={handleMoreClick}
            className="w-full min-h-[44px] py-2.5 flex items-center justify-center gap-1.5 uppercase text-foreground hover:text-primary hover:bg-card/60 rounded-xl transition-colors"
          >
            <span>More</span>
            {isMoreClicked ? (
              <Icon icon="carbon:chevron-up" className="text-xl text-primary" />
            ) : (
              <Icon icon="carbon:chevron-down" className="text-xl text-primary" />
            )}
          </button>
          {isMoreClicked && (
            <div className="w-full flex flex-col items-center space-y-1 bg-card/40 rounded-2xl p-2 border border-border">
              <Link to="/economania" onClick={handleHamburgerClick} className="w-full text-center py-2 min-h-[44px] flex items-center justify-center rounded-lg hover:bg-card">
                <span className="uppercase text-sm text-foreground hover:text-primary">Economania</span>
              </Link>
              <Link to="/galaxecon" onClick={handleHamburgerClick} className="w-full text-center py-2 min-h-[44px] flex items-center justify-center rounded-lg hover:bg-card">
                <span className="uppercase text-sm text-foreground hover:text-primary">GalaxEcon</span>
              </Link>
              <Link to="/mock-rbi" onClick={handleHamburgerClick} className="w-full text-center py-2 min-h-[44px] flex items-center justify-center rounded-lg hover:bg-card">
                <span className="uppercase text-sm text-foreground hover:text-primary">MockRBI</span>
              </Link>
              <Link to={"/ipl-auction"} onClick={handleHamburgerClick}>
                <h1 className="mt-3 cursor-pointer uppercase hover:text-primary">IPL Auction</h1>
              </Link>
            </div>
          )}

          {/* ✅ Join Us Button */}
          <div className="mt-6 flex justify-center w-full pt-4 border-t border-border/80">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfeI3Bi013_xIiV8P3sNSc6wa46X52Qy3gCDdDjCfDD3MfnNw/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-xs min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary text-primary-foreground font-bold text-sm uppercase shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-95"
              onClick={handleHamburgerClick}
            >
              <OrgLogo />
              <span>Join Us</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
