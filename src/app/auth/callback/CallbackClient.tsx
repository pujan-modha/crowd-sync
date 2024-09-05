"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { account } from "@/lib/appwrite";

export default function CallbackClient() {
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const secret = searchParams.get("secret");
      const userId = searchParams.get("userId");

      if (secret && userId) {
        try {
          // Create a session using the secret
          await account.createSession(userId, secret);

          // Fetch the user data
          const userData = await account.get();

          // Update the user in your AuthContext
          setUser(userData);

          // Force reload by redirecting to home page
          window.location.href = "/";
        } catch (error) {
          console.error("Error during login:", error);
          window.location.href = "/";
        }
      } else {
        console.error("Missing secret or userId in callback URL");
        window.location.href = "/";
      }
    };

    handleCallback();
  }, [searchParams, setUser]);

  return <div>Processing login...</div>;
}
