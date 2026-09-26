import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  databases,
  DATABASE_ID,
  SITUATIONS_COLLECTION_ID,
  RESPONSES_COLLECTION_ID,
  TEAMS_COLLECTION_ID,
  ID,
} from "../config/appwrite";
import { Query } from "appwrite";

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Custom React Hook managing Mock RBI Player authentication, active situation polling,
 * response submission, team score updates, and live leaderboard polling.
 */
export function useMockRbiPlayer() {
  const [team, setTeam] = useState(null);
  const [activeSituation, setActiveSituation] = useState(null);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [allTeams, setAllTeams] = useState([]);
  const [canFetchNew, setCanFetchNew] = useState(false);
  const [situationStartTime, setSituationStartTime] = useState(null);

  const navigate = useNavigate();

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        TEAMS_COLLECTION_ID,
        [Query.orderDesc("Score")]
      );

      const sortedTeams = [...response.documents].sort((a, b) => {
        if (b.Score !== a.Score) return b.Score - a.Score;
        const aTime =
          a.averageResponseTime !== undefined
            ? a.averageResponseTime
            : Number.MAX_SAFE_INTEGER;
        const bTime =
          b.averageResponseTime !== undefined
            ? b.averageResponseTime
            : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });

      setAllTeams(sortedTeams.slice(0, 5));
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  }, []);

  const fetchActiveSituation = useCallback(
    async (currentTeam) => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          SITUATIONS_COLLECTION_ID,
          [Query.equal("isActive", true)]
        );
        if (response.documents.length > 0) {
          const situation = response.documents[0];
          const optionsWithIndices = situation.option.map((opt, index) => ({
            text: opt,
            originalIndex: index,
            weight: situation.weight[index],
          }));
          const shuffled = shuffleArray(optionsWithIndices);
          setShuffledOptions(shuffled);

          const responses = await databases.listDocuments(
            DATABASE_ID,
            RESPONSES_COLLECTION_ID,
            [
              Query.equal("teamId", currentTeam.$id),
              Query.equal("situationId", situation.$id),
            ]
          );

          setActiveSituation(situation);
          if (responses.documents.length > 0) {
            setSubmitted(true);
            setTimerActive(false);
            setCanFetchNew(false);
          } else {
            setSubmitted(false);
            setSituationStartTime(Date.now());
            const savedTimer = sessionStorage.getItem("mockrbi-timer");
            const savedSituationId = sessionStorage.getItem(
              "mockrbi-active-situation-id"
            );
            if (savedTimer && savedSituationId === situation.$id) {
              setTimeLeft(parseInt(savedTimer, 10));
            } else {
              setTimeLeft(90);
              sessionStorage.setItem("mockrbi-timer", "90");
              sessionStorage.setItem(
                "mockrbi-active-situation-id",
                situation.$id
              );
            }
            setTimerActive(true);
            setCanFetchNew(false);
          }
        } else {
          setActiveSituation(null);
          setSubmitted(false);
          setTimerActive(false);
          setCanFetchNew(false);
        }
      } catch (err) {
        console.error("Error fetching active situation:", err);
        setError("Failed to fetch current situation.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkIfNewSituationAvailable = useCallback(async () => {
    if (!team) return;
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        SITUATIONS_COLLECTION_ID,
        [Query.equal("isActive", true)]
      );
      if (response.documents.length > 0) {
        const active = response.documents[0];
        if (!activeSituation || active.$id !== activeSituation.$id) {
          setCanFetchNew(true);
          return;
        }

        const responses = await databases.listDocuments(
          DATABASE_ID,
          RESPONSES_COLLECTION_ID,
          [
            Query.equal("teamId", team.$id),
            Query.equal("situationId", active.$id),
          ]
        );

        if (responses.documents.length === 0 && !submitted) {
          setCanFetchNew(false);
        } else {
          setCanFetchNew(false);
        }
      } else {
        setCanFetchNew(false);
      }
    } catch (err) {
      console.error("Error checking for new situation:", err);
    }
  }, [team, activeSituation, submitted]);

  // Auth check & leaderboard polling interval
  useEffect(() => {
    const savedTeam = localStorage.getItem("mockrbi-team");
    if (!savedTeam) {
      navigate("/mockrbi/player-login");
      return;
    }
    const teamObj = JSON.parse(savedTeam);
    setTeam(teamObj);
    fetchActiveSituation(teamObj);
    fetchLeaderboard();

    const leaderboardInterval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(leaderboardInterval);
  }, [navigate, fetchActiveSituation, fetchLeaderboard]);

  // Timer Countdown Effect
  useEffect(() => {
    if (timerActive && timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => {
        const newTime = timeLeft - 1;
        setTimeLeft(newTime);
        sessionStorage.setItem("mockrbi-timer", newTime.toString());
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      checkIfNewSituationAvailable();
    }
  }, [timerActive, timeLeft, submitted, checkIfNewSituationAvailable]);

  // Poll for new situation when idle
  useEffect(() => {
    if (!timerActive && !canFetchNew) {
      const interval = setInterval(() => {
        checkIfNewSituationAvailable();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [timerActive, canFetchNew, checkIfNewSituationAvailable]);

  const handleSubmitChoice = async (option) => {
    if (!team || !activeSituation || submitted) return;
    try {
      setLoading(true);
      setError("");

      const calculatedResponseTime = situationStartTime
        ? Date.now() - situationStartTime
        : null;

      const choiceWeight = option ? option.weight : 0;
      const newScore = team.Score + choiceWeight;

      let newAvgTime = team.averageResponseTime || 0;
      let newTotalResponses = (team.totalResponses || 0) + 1;

      if (calculatedResponseTime !== null) {
        if (team.averageResponseTime) {
          newAvgTime =
            (team.averageResponseTime * team.totalResponses +
              calculatedResponseTime) /
            newTotalResponses;
        } else {
          newAvgTime = calculatedResponseTime;
        }
      }

      await databases.createDocument(
        DATABASE_ID,
        RESPONSES_COLLECTION_ID,
        ID.unique(),
        {
          teamId: team.$id,
          situationId: activeSituation.$id,
          chosenOptionIndex: option ? option.originalIndex : -1,
          scoreWeight: choiceWeight,
          responseTime: calculatedResponseTime,
        }
      );

      await databases.updateDocument(
        DATABASE_ID,
        TEAMS_COLLECTION_ID,
        team.$id,
        {
          Score: newScore,
          averageResponseTime: Math.round(newAvgTime),
          totalResponses: newTotalResponses,
        }
      );

      const updatedTeam = {
        ...team,
        Score: newScore,
        averageResponseTime: Math.round(newAvgTime),
        totalResponses: newTotalResponses,
      };
      setTeam(updatedTeam);
      localStorage.setItem("mockrbi-team", JSON.stringify(updatedTeam));

      setSubmitted(true);
      setTimerActive(false);
      sessionStorage.removeItem("mockrbi-timer");
      sessionStorage.removeItem("mockrbi-active-situation-id");
      setCanFetchNew(false);
    } catch (err) {
      console.error("Error submitting response:", err);
      setError("Failed to submit response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNewSituation = async () => {
    setCanFetchNew(false);
    setSelectedOption(null);
    setSubmitted(false);
    sessionStorage.removeItem("mockrbi-timer");
    sessionStorage.removeItem("mockrbi-active-situation-id");
    await fetchActiveSituation(team);
    await fetchLeaderboard();
  };

  return {
    team,
    activeSituation,
    shuffledOptions,
    selectedOption,
    setSelectedOption,
    submitted,
    loading,
    error,
    timeLeft,
    timerActive,
    allTeams,
    canFetchNew,
    handleSubmitChoice,
    handleFetchNewSituation,
  };
}
