import React, { useState } from "react";
import { Wheel } from "react-custom-roulette";
import confetti from "canvas-confetti";

const roundData = {
  "Round 1": [
    { option: "Problem 1", description: "" },
    { option: "Problem 2", description: "" },
    { option: "Problem 3", description: "" },
    { option: "Problem 4", description: "" },
    { option: "Problem 5", description: "" },
    { option: "Problem 6", description: "" },
    { option: "Problem 7", description: "" },
  ],
  "Round 2": [
    { option: "Problem 1", description: "" },
    { option: "Problem 2", description: "" },
    { option: "Problem 3", description: "" },
    { option: "Problem 4", description: "" },
  ],
};

const SpinWheel = ({ round, onBack }) => {
  const data = roundData[round];

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
      particleCount: 200,
      spread: 120,
      startVelocity: 30,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.5 },
    });
  };

  return (
    <div className="bg-black text-white min-h-screen max-w-full overflow-x-hidden relative flex flex-col items-center justify-center font-Bebas px-2">
      <h1 className="text-3xl xs:text-4xl sm:text-5xl font-bold text-shadow mb-4 sm:mb-8 text-primary text-center">
        {round} - Spin the Wheel!
      </h1>
      <div className="relative flex flex-col items-center max-w-full overflow-hidden">
        <div className="relative mb-2 sm:mb-4 shadow-xl flex justify-center max-w-full overflow-hidden scale-[0.58] xs:scale-75 sm:scale-90 md:scale-100 transform origin-center -my-16 xs:-my-8 sm:my-0">
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={data.map((game) => ({ option: game.option }))}
            backgroundColors={["#C9872B", "#B69575", "#B19359", "#E6C475"]}
            textColors={["#FFFFFF", "#000000", "#FFD700", "#0F0F0F"]}
            onStopSpinning={() => {
              setMustSpin(false);
              handleSpinComplete();
            }}
            radius={250}
            outerBorderColor="#FFD700"
            outerBorderWidth={1}
            innerRadius={10}
            spinDuration={0.7}
            fontSize={20}
            textDistance={60}
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
        <button
          className="mt-4 px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-all duration-300 ease-in-out"
          onClick={onBack}
        >
          Back
        </button>
      </div>
      {selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-gray-900 to-gray-700 p-8 rounded-3xl shadow-2xl text-center max-w-sm">
            <h2 className="text-4xl font-bold text-yellow-400 mb-4">Congratulations!</h2>
            <p className="text-lg text-white mb-4">
              You got <span className="text-yellow-500 font-extrabold">{selectedGame}</span>!
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

const PlayGame = () => {
  const [selectedRound, setSelectedRound] = useState(null);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center font-Bebas">
      {!selectedRound ? (
        <div className="text-center">
          <h1 className="text-5xl font-bold text-shadow mb-8 text-primary">Play</h1>
          <button
            className="text-4xl m-4 px-8 py-4  text-white font- rounded-xl shadow-lg hover:scale-110 transition-all duration-300"
            onClick={() => setSelectedRound("Round 1")}
          >
            Round 1
          </button>
          <button
            className="text-4xl m-4 px-8 py-4  text-white font- rounded-xl shadow-xl hover:scale-110 transition-all duration-300"
            onClick={() => setSelectedRound("Round 2")}
          >
            Round 2
          </button>
        </div>
      ) : (
        <SpinWheel round={selectedRound} onBack={() => setSelectedRound(null)} />
      )}
    </div>
  );
};

export default PlayGame;
