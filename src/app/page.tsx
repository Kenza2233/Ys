"use client";

import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ListChecks, FileSpreadsheet, Search, Zap, ClipboardList } from "lucide-react";
import { YoutubeIcon as Youtube } from "@/components/icons/YoutubeIcon";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 max-w-3xl"
      >
        <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight">
          Bulk Save Your <span className="text-red-600">YouTube</span> Playlists
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The ultimate tool to manage and organize your YouTube videos. Import from URLs, XLSX files, or search directly.
        </p>
      </motion.div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {session ? (
          <Link href="/dashboard">
            <Button size="lg" className="h-12 px-8 text-lg">
              Go to Dashboard <Zap className="ml-2 h-5 w-5 fill-current" />
            </Button>
          </Link>
        ) : (
          <Button size="lg" className="h-12 px-8 text-lg" onClick={() => signIn("google")}>
            Connect YouTube Account <Youtube className="ml-2 h-5 w-5" />
          </Button>
        )}
        <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
          Learn More
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full max-w-6xl pt-12">
        <FeatureCard
            icon={<ClipboardList className="h-10 w-10 text-red-600" />}
            title="Manual URL Paste"
            description="Paste multiple URLs and we'll handle the rest."
        />
        <FeatureCard
            icon={<FileSpreadsheet className="h-10 w-10 text-red-600" />}
            title="XLSX Import"
            description="Upload Excel files with video links and custom data."
        />
        <FeatureCard
            icon={<Search className="h-10 w-10 text-red-600" />}
            title="In-app Search"
            description="Find and add videos without leaving the site."
        />
        <FeatureCard
            icon={<ListChecks className="h-10 w-10 text-red-600" />}
            title="YT Playlist Import"
            description="Sync existing playlists from your channel."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 bg-card rounded-2xl space-y-4 text-left border border-border">
      <div className="bg-muted w-16 h-16 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
