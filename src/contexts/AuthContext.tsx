"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { account } from "@/lib/appwrite";
import { ID, Models } from "appwrite";

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  sendMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (error) {
      console.error("Error checking session:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      const response = await account.createMagicURLToken(
        ID.unique(),
        email,
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      );
      console.log("Magic link created successfully:", response);
    } catch (error) {
      console.error("Error sending magic link:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, sendMagicLink, logout, checkSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
