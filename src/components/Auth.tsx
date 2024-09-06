"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

export function Auth({ onClose }: { onClose: () => void }) {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendMagicLink(email);
      toast({
        title: "Login Link Sent",
        description: "Please check your email for the login link.",
      });
      onClose(); // Close the dialog after successful submission
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to send login link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-none">
      <CardHeader className="p-0 mb-1">
        <CardTitle>Login / Register</CardTitle>
        <CardDescription>
          Enter your email to receive a login link
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full p-0 m-0">
        <form onSubmit={handleSubmit}>
          <div className="space-y-2 mb-4">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
