"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { account } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkSession } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<
    "verifying" | "success" | "error"
  >("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const verifySession = async () => {
      const userId = searchParams.get("userId");
      const secret = searchParams.get("secret");

      if (!userId || !secret) {
        console.error("Missing userId or secret");
        setErrorMessage("Missing userId or secret in URL parameters");
        setVerificationStatus("error");
        return;
      }

      try {
        console.log("Attempting to update magic URL session");
        await account.updateMagicURLSession(userId, secret);
        console.log("Magic URL session updated successfully");
        await checkSession();
        setVerificationStatus("success");
      } catch (error) {
        console.error("Error verifying session:", error);
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setVerificationStatus("error");
      }
    };

    verifySession();
  }, [searchParams, checkSession]);

  useEffect(() => {
    if (verificationStatus === "success") {
      router.push("/");
    }
  }, [verificationStatus, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Verifying your magic link...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          {verificationStatus === "verifying"}
          {verificationStatus === "success" && (
            <p>Verification successful. Redirecting...</p>
          )}
          {verificationStatus === "error" && (
            <>
              <p>Verification failed. Redirecting to login...</p>
              <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
