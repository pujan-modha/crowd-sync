"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Auth } from "@/components/Auth";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

export default function Home() {
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <nav className="sticky top-0 z-50 w-full bg-background border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="font-bold text-xl">CrowdSync</div>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button size="sm" className="px-2 lg:px-3">
                  <PlusIcon className="h-5 w-5 lg:mr-2" />
                  <span className="hidden lg:inline">Report</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                  {user ? <p>Report form goes here</p> : <Auth />}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <ScrollArea className="h-[calc(100vh-3.5rem)] px-4 py-6 lg:px-8">
          <div className="container max-w-screen-2xl">
            {user ? (
              <div className="flex justify-between items-center">
                <p className="text-lg">Welcome, {user.name || "User"}!</p>
                <Button onClick={logout} variant="outline">
                  Logout
                </Button>
              </div>
            ) : (
              <p className="text-lg text-center">
                Please log in to view and submit reports.
              </p>
            )}
          </div>
        </ScrollArea>
      </main>
      <footer className="border-t border-border/40 bg-background">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-center">
          <p className="text-sm text-muted-foreground">
            CrowdSync is a crowdsourced disaster reporting tool.
          </p>
        </div>
      </footer>
    </div>
  );
}
