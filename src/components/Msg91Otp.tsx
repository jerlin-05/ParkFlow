"use client";

import { useEffect, useRef, useState } from "react";

interface Msg91OtpProps {
  mobile: string;
  onVerified: (data: unknown) => void;
}

// Module-level (not component-level) state: the MSG91 script registers a
// `<h-captcha>` custom element as a side effect, and customElements.define()
// can only ever run once per tag name for the lifetime of the page. If this
// component unmounts/remounts (e.g. Back → Continue, or React Strict Mode's
// mount-unmount-remount in dev) and re-injects the script, the second run
// throws NotSupportedError and silently breaks window.sendOtp/verifyOtp,
// which is why you'd see "MSG91 OTP service is unavailable". So: load the
// script at most once for the whole page lifetime, and never remove it.
let msg91ScriptState: "idle" | "loading" | "ready" | "error" = "idle";
let msg91ScriptListeners: Array<(ok: boolean) => void> = [];

function loadMsg91Script(onDone: (ok: boolean) => void) {
  if (msg91ScriptState === "ready") {
    onDone(true);
    return;
  }
  if (msg91ScriptState === "error") {
    onDone(false);
    return;
  }
  if (msg91ScriptState === "loading") {
    msg91ScriptListeners.push(onDone);
    return;
  }

  msg91ScriptState = "loading";
  msg91ScriptListeners.push(onDone);

  const script = document.createElement("script");
  script.src = "https://verify.msg91.com/otp-provider.js";
  script.type = "text/javascript";
  script.async = true;

  script.onload = () => {
    msg91ScriptState = "ready";
    msg91ScriptListeners.forEach((cb) => cb(true));
    msg91ScriptListeners = [];
  };

  script.onerror = () => {
    msg91ScriptState = "error";
    msg91ScriptListeners.forEach((cb) => cb(false));
    msg91ScriptListeners = [];
  };

  document.body.appendChild(script);
  // Deliberately never removed: MSG91's script has permanent page-level side
  // effects (custom element registration), so it must only ever run once.
}

// Minimum time between OTP sends for the same mobile number. Persisted in
// sessionStorage (not component state) so it survives this component
// unmounting/remounting — e.g. clicking Back then Continue again no longer
// fires another real send to MSG91 within the cooldown window. This is what
// was tripping MSG91's own per-IP throttle during normal testing.
const RESEND_COOLDOWN_SECONDS = 45;

function msg91CooldownKey(mobile: string) {
  return `parkflow_msg91_last_sent_${mobile}`;
}

function getMsg91CooldownRemaining(mobile: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const last = Number(sessionStorage.getItem(msg91CooldownKey(mobile)) || 0);
    const elapsed = (Date.now() - last) / 1000;
    return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
  } catch {
    return 0;
  }
}

function markMsg91Sent(mobile: string) {
  try {
    sessionStorage.setItem(msg91CooldownKey(mobile), String(Date.now()));
  } catch {
    // sessionStorage unavailable (e.g. privacy mode) — cooldown just won't persist
  }
}

export default function Msg91Otp({
  mobile,
  onVerified,
}: Msg91OtpProps) {
  const [loaded, setLoaded] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const otpSentRef = useRef(false);

  /*
   * Load MSG91 SDK (once per page — see loadMsg91Script above)
   */
  useEffect(() => {
    let cancelled = false;

    const initialize = () => {
      if (cancelled) return;

      const widgetId =
        process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;

      const tokenAuth =
        process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH;

      console.log("MSG91 widget ID:", widgetId);
      console.log(
        "MSG91 token available:",
        Boolean(tokenAuth)
      );

      if (!widgetId || !tokenAuth) {
        setError(
          "MSG91 configuration is missing. Restart the Next.js server."
        );
        return;
      }

      if (
        typeof window.initSendOTP !== "function"
      ) {
        setError(
          "MSG91 SDK loaded, but OTP service is unavailable."
        );
        return;
      }

      try {
        window.initSendOTP({
          widgetId,
          tokenAuth,
          exposeMethods: true,

          success: (data) => {
            console.log(
              "MSG91 initialization successful:",
              data
            );
          },

          failure: (error) => {
            console.error(
              "MSG91 initialization failed:",
              error
            );

            setError(
              "Invalid OTP. Please enter the correct 4-digit OTP sent to your mobile number."
            );
          },
        });

        setLoaded(true);
      } catch (error) {
        console.error(
          "MSG91 initialization exception:",
          error
        );

        setError(
          "Unable to initialize OTP service."
        );
      }
    };

    loadMsg91Script((ok) => {
      if (cancelled) return;
      if (ok) {
        initialize();
      } else {
        setError("Unable to load MSG91 OTP service.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Tick the resend cooldown down once a second while it's active
   */
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  /*
   * Automatically send OTP when Step 2 opens
   */
  useEffect(() => {
    if (!loaded) return;
    if (!mobile) return;
    if (otpSentRef.current) return;

    const remaining = getMsg91CooldownRemaining(mobile);
    if (remaining > 0) {
      // Already sent one recently (e.g. this is a remount from Back →
      // Continue) — don't fire another real request, just reflect the
      // existing cooldown in the UI.
      otpSentRef.current = true;
      setCooldown(remaining);
      return;
    }

    sendOtp();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, mobile]);

  /*
   * Send OTP
   */
  function sendOtp() {
    if (!loaded) {
      setError(
        "OTP service is still loading. Please wait."
      );
      return;
    }

    const cleanMobile =
      mobile.replace(/\D/g, "");

    if (cleanMobile.length !== 10) {
      setError(
        "Enter a valid 10-digit mobile number."
      );
      return;
    }

    const remaining = getMsg91CooldownRemaining(mobile);
    if (remaining > 0) {
      setCooldown(remaining);
      return;
    }

    if (
      typeof window.sendOtp !== "function"
    ) {
      setError(
        "MSG91 OTP service is unavailable."
      );
      return;
    }

    otpSentRef.current = true;

    setSending(true);
    setError("");

    const identifier = `91${cleanMobile}`;

    console.log(
      "Sending MSG91 OTP to:",
      identifier
    );

    markMsg91Sent(mobile);
    setCooldown(RESEND_COOLDOWN_SECONDS);

    window.sendOtp(
      identifier,

      (data) => {
        console.log(
          "MSG91 OTP sent successfully:",
          data
        );

        setSending(false);
        setError("");
      },

      (error) => {
        console.error(
          "MSG91 OTP send failed:",
          error
        );

        otpSentRef.current = false;

        setSending(false);

        const errObj = error as { message?: string; code?: string } | undefined;
        if (errObj?.code === "408" || errObj?.message === "IPBlocked") {
          setError(
            "MSG91 has temporarily rate-limited this network for too many OTP requests. Please wait a few minutes before trying again."
          );
        } else {
          setError(
            "Unable to send OTP. Please try again."
          );
        }
      }
    );
  }

  /*
   * OTP box change
   */
  function handleOtpChange(
    index: number,
    value: string
  ) {
    const digit = value
      .replace(/\D/g, "")
      .slice(-1);

    const newOtp = [...otp];

    newOtp[index] = digit;

    setOtp(newOtp);

    if (digit && index < 3) {
      document
        .getElementById(`otp-${index + 1}`)
        ?.focus();
    }
  }

  /*
   * Backspace → previous box
   */
  function handleOtpKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      document
        .getElementById(`otp-${index - 1}`)
        ?.focus();
    }
  }

  /*
   * Verify OTP
   */
  function verifyOtp() {
    const otpValue = otp.join("");

    if (otpValue.length !== 4) {
      setError(
        "Please enter all 4 digits of the OTP."
      );
      return;
    }

    if (
      typeof window.verifyOtp !== "function"
    ) {
      setError(
        "MSG91 OTP service is unavailable."
      );
      return;
    }

    setLoading(true);
    setError("");

    window.verifyOtp(
      otpValue,

      (data) => {
        console.log(
          "MSG91 OTP verified:",
          data
        );

        setLoading(false);
        setError("");

        onVerified(data);
      },

      (error) => {
        console.error(
          "MSG91 OTP verification failed:",
          error
        );

        setLoading(false);

        setError(
          "Incorrect OTP. Please enter the 4-digit OTP sent to your mobile number."
        );
      }
    );
  }

  return (
    <div className="space-y-4">

      {/* OTP sending status */}
      {sending && (
        <p className="text-center text-sm text-mist">
          Sending OTP to your mobile number...
        </p>
      )}

      {/* Four OTP boxes */}
      <div className="flex justify-center gap-3">

        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(e) =>
              handleOtpChange(
                index,
                e.target.value
              )
            }
            onKeyDown={(e) =>
              handleOtpKeyDown(
                index,
                e
              )
            }
            disabled={sending}
            className="h-14 w-14 rounded-lg border border-gray-700 bg-gray-900 text-center text-2xl font-bold text-white outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 disabled:opacity-50"
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}

      </div>

      {/* Resend control */}
      <div className="text-center text-[13px] text-mist">
        {cooldown > 0 ? (
          <span>Resend OTP in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={sendOtp}
            disabled={sending}
            className="font-medium text-amber underline-offset-2 hover:underline disabled:opacity-50"
          >
            Resend OTP
          </button>
        )}
      </div>

      {/* Verify button */}
      <button
        type="button"
        onClick={verifyOtp}
        disabled={
          loading ||
          sending ||
          otp.join("").length !== 4
        }
        className="w-full rounded-lg bg-green-500 px-4 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Verifying..."
          : "Verify OTP"}
      </button>

      {/* Error */}
      {error && (
        <p className="break-words text-sm text-red-400">
          {error}
        </p>
      )}

    </div>
  );
}