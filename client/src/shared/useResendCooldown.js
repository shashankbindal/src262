import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Countdown timer for "resend code" buttons. Nothing previously stopped a
 * user from tapping Resend every second while waiting for the email to
 * arrive — each tap is a real request, and the backend only allows 3 OTP
 * resends per hour per account, so a few impatient taps in the first ten
 * seconds could exhaust that quota and lock the user out of getting a new
 * code for up to an hour. This hook gives the UI a visible cooldown so the
 * button simply can't be re-tapped that fast.
 *
 * Usage: const [secondsLeft, startCooldown] = useResendCooldown(45);
 *   - disable the button while `secondsLeft > 0`
 *   - call `startCooldown()` right after a resend request succeeds
 */
export function useResendCooldown(duration = 45) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    setSecondsLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [secondsLeft]);

  return [secondsLeft, start];
}
