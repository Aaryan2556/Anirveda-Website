import React, { useState } from "react";
import { Wheel } from "react-custom-roulette";
import confetti from "canvas-confetti";

const SpinWheel = () => {
  const data = [
    { option: "Scribble & Guess", description: "Draw and guess to win!" },
    { option: "Love the Way You Lie", description: "Bluff your way to victory!" },
    { option: "Diced", description: "Team up and dominate with dice!" },
    { option: "Heads Up", description: "Guess the word before time runs out!" },
  ];


  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameDescription, setGameDescription] = useState("");

  const handleSpinClick = () => {
    const randomPrize = Math.floor(Math.random() * data.length);
    setPrizeNumber(randomPrize);
    setMustSpin(true);
  };

  const handleSpinComplete = () => {
    const game = data[prizeNumber];
    setSelectedGame(game.option);
    setGameDescription(game.description);
    runConfetti();
  };

  const runConfetti = () => {
    confetti({
      particleCount: window.innerWidth < 768 ? 120 : 350,
      spread: 120,
      startVelocity: 30,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.5 },
    });
  };

  return (
    <div className="bg-black text-white min-h-screen max-w-full overflow-x-hidden relative flex flex-col items-center justify-center font-Bebas px-2">
      <h1 className="text-3xl xs:text-4xl sm:text-5xl font-bold text-shadow mb-4 sm:mb-8 text-primary text-center">
        Spin the Wheel!
      </h1>

      <div className="relative flex flex-col items-center max-w-full overflow-hidden">
        <div className="relative mb-2 sm:mb-4 shadow-xl flex justify-center max-w-full overflow-hidden scale-[0.58] xs:scale-75 sm:scale-90 md:scale-100 transform origin-center -my-16 xs:-my-8 sm:my-0">
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={data.map((game) => ({ option: game.option }))}
            backgroundColors={[
              "#C9872B", // Theme primary color
              "#B69575", // Theme secondary color
              "#B19359", // Theme tertiary color
              "#E6C475", // Gold
            ]}
            textColors={[
              "#FFFFFF", // For dark backgrounds
              "#000000", // For light backgrounds
              "#FFD700", // For accent color contrast
              "#0F0F0F", // For dark contrast
            ]}
            onStopSpinning={() => {
              setMustSpin(false);
              handleSpinComplete();
            }}
            radius={250}
            outerBorderColor="#FFD700"
            outerBorderWidth={1}
            innerRadius={10}
            spinDuration={0.7}
            fontSize={20} // Adjust font size for smaller text
            textDistance={60} // Adjust text distance from the center
            fontFamily="Bebas Neue, sans-serif" 
          />
        </div>
        <button
          className="mt-6 px-8 py-4 bg-gradient-to-r from-yellow-400 to-red-400 text-black font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
          onClick={handleSpinClick}
          disabled={mustSpin}
        >
          {mustSpin ? "Spinning..." : "Spin Now"}
        </button>
      </div>

      {/* Popup */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-gray-900 to-gray-700 p-8 rounded-3xl shadow-2xl text-center max-w-sm">
            <h2 className="text-4xl font-bold text-yellow-400 mb-4 animate-pulse">Congratulations!</h2>
            <p className="text-lg text-white mb-4">
              You got{" "}
              <span className="text-yellow-500 font-extrabold">{selectedGame}</span>!
            </p>
            <p className="text-white text-base italic mb-6">{gameDescription}</p>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-500 hover:scale-105 transition-all duration-300 ease-in-out"
                onClick={() => setSelectedGame(null)}
              >
                Spin Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinWheel;