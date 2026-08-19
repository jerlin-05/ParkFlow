"use client";

import { useEffect, useRef, useState } from "react";

interface Msg91OtpProps {
  mobile: string;
  onVerified: (data: unknown) => void;
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

  const otpSentRef = useRef(false);

  /*
   * Load MSG91 SDK
   */
  useEffect(() => {
    let script: HTMLScriptElement | null = null;

    const initialize = () => {
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

    script = document.createElement("script");

    script.src =
      "https://verify.msg91.com/otp-provider.js";

    script.type = "text/javascript";
    script.async = true;

    script.onload = initialize;

    script.onerror = () => {
      setError(
        "Unable to load MSG91 OTP service."
      );
    };

    document.body.appendChild(script);

    return () => {
      if (
        script &&
        document.body.contains(script)
      ) {
        document.body.removeChild(script);
      }
    };
  }, []);

  /*
   * Automatically send OTP when Step 2 opens
   */
  useEffect(() => {
    if (!loaded) return;
    if (!mobile) return;
    if (otpSentRef.current) return;

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

        setError(
          "Unable to send OTP. Please try again."
        );
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