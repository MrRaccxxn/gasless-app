"use client";

import { useEffect } from "react";
// import ReCAPTCHA from 'react-google-recaptcha' // Disabled

interface RecaptchaWrapperProps {
  onVerify: (token: string) => void
  onError: () => void
}

export function RecaptchaWrapper({ onVerify, onError: _onError }: RecaptchaWrapperProps) {
  // reCAPTCHA is disabled - automatically call onVerify with a dummy token
  useEffect(() => {
    onVerify("disabled-token");
  }, [onVerify]);

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-blue-800 text-sm">
        reCAPTCHA is disabled for development
      </p>
    </div>
  );
}
