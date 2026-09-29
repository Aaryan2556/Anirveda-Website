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
      <div className="flex items-center justify-between px-5">
        <div>
          <Link to="/">
            <img
              src="./images/logos/logo.webp"
              alt="Anirveda Logo"
              className="w-1/4"
            />
          </Link>
        </div>
        <div className="cursor-pointer">
          <Icon
            icon="charm:menu-hamburger"
            color={"#B69575"}
            className="text-4xl"
            onClick={handleHamburgerClick}
          />
        </div>
      </div>

      {/* Hamburger bar items */}
      <div
        className={`fixed inset-0 z-50 h-full w-full bg-secondary-opacity px-5 pt-3 font-Lato text-secondary transition-transform duration-300 ease-in  
    ${isOpen ? "translate-x-0" : "translate-x-[-100%]"}`}
      >
        {/* Top Bar inside drawer */}
        <div className="flex items-center justify-between">
          <div>
            <img
              src="./images/logos/logo_white.webp"
              alt="Anirveda Logo"
              className="w-1/4"
            />
          </div>
          <div className="cursor-pointer">
            <Icon
              icon="akar-icons:cross"
              color={"#B69575"}
              className="text-4xl"
              onClick={handleHamburgerClick}
            />
          </div>
        </div>

        {/* Links */}
        <div className="mt-4 text-center text-2xl">
          <Link to="/" onClick={handleHamburgerClick}>
            <h1 className="mt-3 cursor-pointer uppercase hover:text-primary">Home</h1>
          </Link>
          <Link to="/events" onClick={handleHamburgerClick}>
            <h1 className="mt-3 cursor-pointer uppercase hover:text-primary">Events</h1>
          </Link>
          <Link to="/gallery" onClick={handleHamburgerClick}>
            <h1 className="mt-3 cursor-pointer uppercase hover:text-primary">Gallery</h1>
          </Link>
          <Link to="/committee" onClick={handleHamburgerClick}>
            <h1 className="mt-3 cursor-pointer uppercase hover:text-primary">Committee</h1>
          </Link>
          <Link to="/sponsors" onClick={handleHamburgerClick}>
            <h1 className="mt-3 cursor-pointer uppercase hover:text-primary">Sponsors</h1>
          </Link>
          <Link to="/blogs" onClick={handleHamburgerClick}>
            <h1 className="mt-3 cursor-pointer uppercase hover:text-primary">Blogs</h1>
          </Link>
          <a href="#contact" onClick={handleHamburgerClick}>
            <h1 className="mt-3 cursor-pointer uppercase hover:text-primary">Contact</h1>
          </a>

          {/* Collapsible More */}
          <div
            className="flex cursor-pointer items-center justify-center gap-1 hover:text-primary"
            onClick={handleMoreClick}
          >
            <h1 className="mt-3 uppercase">More</h1>
            {isMoreClicked ? (
              <Icon icon="carbon:chevron-up" color="#B69575" className="mt-3 text-3xl" />
            ) : (
              <Icon icon="carbon:chevron-down" color="#B69575" className="mt-3 text-3xl" />
            )}
          </div>
          {isMoreClicked && (
            <div>
              <Link to="/economania" onClick={handleHamburgerClick}>
                <h1 className="mt-3 cursor-pointer uppercase hover:text-primary">Economania</h1>
              </Link>
              <Link to={"/galaxecon"} onClick={handleHamburgerClick}>
                <h1 className="mt-3 cursor-pointer uppercase hover:text-primary">GalaxEcon</h1>
              </Link>
              <Link to={"/mock-rbi"} onClick={handleHamburgerClick}>
                <h1 className="mt-3 cursor-pointer uppercase hover:text-primary">MockRBI</h1>
              </Link>
              <Link to={"/ipl-auction"} onClick={handleHamburgerClick}>
                <h1 className="mt-3 cursor-pointer uppercase hover:text-primary">IPL Auction</h1>
              </Link>
            </div>
          )}

          {/* ✅ Join Us Button */}
          <div className="mt-6 flex justify-center">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfeI3Bi013_xIiV8P3sNSc6wa46X52Qy3gCDdDjCfDD3MfnNw/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-lg uppercase text-primary shadow-md transition-all duration-300 hover:scale-105 hover:border-primary hover:text-accent hover:shadow-lg hover:shadow-primary/20"
              onClick={handleHamburgerClick}
            >
              <OrgLogo />
              Join Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
