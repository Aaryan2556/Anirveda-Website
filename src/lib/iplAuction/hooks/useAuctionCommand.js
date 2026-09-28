import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ERROR } from "../engine/index.js";
import { getAuctionRepository } from "../repository/index.js";

/**
 * Sends commands as `actor` and reports the outcome in one consistent way.
 *
 *   const { send, pending, lastError } = useAuctionCommand(actor);
 *   const result = await send(command, { success: "Saved.", quiet: false });
 *
 * - Adds the actor (callers never pass one).
 * - `pending` is true while any command from this hook is in flight.
 * - Rejections show an error toast (unless `quiet`) and are kept in `lastError`.
 * - Resolves to the engine result shape; never throws.
 */
export function useAuctionCommand(actor, repository = getAuctionRepository()) {
  const [inFlight, setInFlight] = useState(0);
  const [lastError, setLastError] = useState(null);
  const actorRef = useRef(actor);
  actorRef.current = actor;

  const send = useCallback(
    async (command, { success, quiet = false } = {}) => {
      const current = actorRef.current;
      if (!current) {
        const error = { code: ERROR.UNAUTHORIZED, message: "You are not allowed to change the auction." };
        setLastError(error);
        if (!quiet) toast.error(error.message);
        return { ok: false, state: repository.getSnapshot(), error };
      }
      setInFlight((n) => n + 1);
      try {
        const result = await repository.dispatch({ ...command, actor: current });
        if (result.ok) {
          setLastError(null);
          if (success && !quiet) toast.success(success);
        } else {
          setLastError(result.error);
          if (!quiet) toast.error(result.error.message);
        }
        return result;
      } finally {
        setInFlight((n) => n - 1);
      }
    },
    [repository]
  );

  return { send, pending: inFlight > 0, lastError };
}
