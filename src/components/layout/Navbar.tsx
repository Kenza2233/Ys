"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, ListPlus, Settings } from "lucide-react";
import { YoutubeIcon as Youtube } from "@/components/icons/YoutubeIcon";
import Link from "next/link";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Youtube className="h-6 w-6 text-red-600" />
          <span>Playlist Saver</span>
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                </Button>
              </Link>
              <Link href="/import">
                <Button variant="ghost" size="sm">
                  <ListPlus className="h-4 w-4 mr-2" /> Import
                </Button>
              </Link>
              <div className="flex items-center gap-2 ml-2">
                <img src={session.user?.image || ""} alt="" className="h-8 w-8 rounded-full border" />
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={() => signIn("google")}>
              <Youtube className="h-4 w-4 mr-2" /> Sign in with Google
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
