"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { account } from "@/lib/appwrite";

export default function VerifyEmail() {
  const [verificationStatus, setVerificationStatus] = useState<
    "verifying" | "success" | "error"
  >("verifying");
  const searchParams = useSearchParams();

  useEffect(() => {
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    if (userId && secret) {
      verifyEmail(userId, secret);
    } else {
      setVerificationStatus("error");
    }
  }, [searchParams]);

  const verifyEmail = async (userId: string, secret: string) => {
    try {
      await account.updateVerification(userId, secret);
      setVerificationStatus("success");
    } catch (error) {
      console.error("Error verifying email:", error);
      setVerificationStatus("error");
    }
  };

  return (
    <div>
      {verificationStatus === "verifying" && <p>Verifying your email...</p>}
      {verificationStatus === "success" && (
        <p>Your email has been successfully verified!</p>
      )}
      {verificationStatus === "error" && (
        <p>There was an error verifying your email. Please try again.</p>
      )}
    </div>
  );
}
