import React, { useState } from "react";
import Navbar from "../components/Navbar";
import ContactUs from "../components/ContactUs";
// import About from "../components/Economania/About";
import Events from "../components/Economania/Events";
import TapGame from "../components/Economania/TapGame";
import ImageStrip from "../components/Economania/ImageStrip";

import EcoSponsors from "../components/Economania/EcoSponsors";
import AnnouncementBar from '../components/AnnouncementBar';
const Economania = () => {
  const [gameStarted, setGameStarted] = useState(false);

const images = [
  "/images/sponsors/zionSalon.webp",
  "/images/sponsors/zionSalon.webp",
  "/images/sponsors/zionSalon.webp",
  "/images/sponsors/zionSalon.webp",
  "/images/sponsors/zionSalon.webp",
  "/images/sponsors/zionSalon.webp",,
];

  return (
    <div className="bg-black font-sans min-h-screen w-full relative overflow-x-hidden">
      <AnnouncementBar />
      <Navbar className = ""/>
      <section 
        className="relative flex min-h-[60vh] sm:min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden px-4"
        style={{ 
          backgroundImage: "linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://res.cloudinary.com/duygdcgj3/image/upload/v1756113471/breach2025_igls9m.png')"
        }}
      >
        <div className="relative text-center px-4 animate-fade-in-up max-w-5xl mx-auto">
          <h1 className="font-Bebas text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl uppercase tracking-tight sm:tracking-wider text-primary leading-[0.95] mb-4 drop-shadow-lg max-w-full break-words">
            <span className="text-secondary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">ECONOMANIA 2026</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-secondary animate-slide-in-right">
            Bigger Than Ever!
          </p>
          <p className="text-xl md:text-2xl mb-8 text-secondary animate-slide-in-right">
          Stay Connected to be a part of Once in a year Event
          </p>
        </div>
      </section>
      {/* <About /> */}
      <Events />
      
      {/* Breach 2025 Section */}
      {/* <section className="text-center py-16">
        <h2 className="text-4xl font-bold text-primary mb-6">Breach 2025 - The Hackathon</h2>
         */}
        {/* Prize Pool */}
        {/* <div className="bg-gradient-to-r from-primary to-secondary text-white py-6 px-8 rounded-lg shadow-lg mb-8 max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold">₹1,00,000 Prize Pool</h3>
          <p className="text-lg">3 Days to Solve Real-World Fintech Challenges 💡</p>
          <p className="text-lg">Elite Judges + Industry Leaders 🎯</p>
        </div> */}
        
        {/* Divider */}
        {/* <div className="w-full flex items-center justify-center my-8">
          <div className="w-1/4 h-px bg-primary"></div>
          <span className="text-primary mx-4 text-xl">❖</span>
          <div className="w-1/4 h-px bg-primary"></div>
        </div> */}
        
        {/* Keynote Speaker */}
        {/* <div className="text-center max-w-2xl mx-auto mb-12">
          <h3 className="text-3xl font-bold text-primary mb-4">Keynote Speaker</h3>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <img src="/images/speaker.jpg" alt="Keynote Speaker" className="w-32 h-32 mx-auto rounded-full mb-4" />
            <h4 className="text-xl font-semibold text-secondary">Dr. John Smith</h4>
            <p className="text-gray-400">Chief Technology Officer at Global Fintech Solutions</p>
            <p className="text-gray-400">Pioneer in Blockchain Technology and Digital Banking</p>
          </div>
        </div> */}
        
        {/* Judges Section */}
        {/* <div className="text-center max-w-4xl mx-auto mb-12">
          <h3 className="text-3xl font-bold text-primary mb-4">Meet Our Judges</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((judge) => (
              <div key={judge} className="bg-gray-800 rounded-lg p-6 shadow-lg text-center">
                <img src={`/images/judge${judge}.jpg`} alt={`Judge ${judge}`} className="w-24 h-24 mx-auto rounded-full mb-4" />
                <h4 className="text-xl font-semibold text-secondary">Industry Expert</h4>
                <p className="text-gray-400">Leading professional from top fintech companies</p>
              </div>
            ))}
          </div>
        </div> */}
        
        {/* Divider */}
        <div className="w-full flex items-center justify-center my-8">
          <div className="w-1/4 h-px bg-primary"></div>
          <span className="text-primary mx-4 text-xl">❖</span>
          <div className="w-1/4 h-px bg-primary"></div>
        </div>
      {/* </section> */}
      
      {/* Game Section */}
      <section id="game" className="py-16 text-center">
        <h2 className="text-4xl font-bold text-primary mb-6">Play & Win Your Registration!</h2>
        {!gameStarted ? (
          <button 
            className="bg-primary text-white px-6 py-3 rounded-full font-bold text-xl hover:bg-secondary transition transform hover:scale-110"
            onClick={() => setGameStarted(true)}
          >
            Start Game
          </button>
        ) : (
          < >
          <TapGame />
          <ImageStrip images={images} />          
          </>
        )}



      </section>
      <EcoSponsors />
      <ContactUs />
    </div>
  );
};

export default Economania;
