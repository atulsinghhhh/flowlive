
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "next-auth";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StreamSetup } from "@/components/dashboard/stream-setup";
import { Loader2, Radio, User as UserIcon, Clock, MessageSquare, Video } from "lucide-react";

interface DashboardClientProps {
  user: User & { id: string; username: string };
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [streamData, setStreamData] = useState({
    title: `${user.username}'s Stream`,
    category: "Just Chatting"
  });

  const [stats, setStats] = useState({
    totalStreams: 0,
    avgViewers: 0,
    totalHours: 0,
    chatCount: 0
  });

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
        try {
            const res = await fetch("/api/dashboard/stats");
            if (res.ok) {
                const data = await res.json();
                if (data.stats) {
                    setStats(data.stats);
                }
            }
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    };
    fetchStats();
  }, []);

  const handleGoLive = async () => {
    setLoading(true);
    try {
      // 1. Create/Update Stream Record
      const res = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: streamData.title,
          category: streamData.category,
          agoraChannel: user.username // Using username as channel ID for simplicity
        }),
      });

      if (!res.ok) throw new Error("Failed to initialize stream");
      
      const data = await res.json();
      
      if (data.stream) {
        // 2. Redirect to Live Page
        router.push(`/stream/${user.username}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to go live. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Variants for Page Transition
  const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, scale: 0.98 }
  };

  return (
    <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="min-h-screen bg-background text-foreground p-4 md:p-8 space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-6 rounded-2xl border border-border shadow-lg gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, <span className="text-primary">{user.username}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Ready to create content today?</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-full bg-muted border border-border flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-500"></div>
                <span className="text-sm font-medium text-muted-foreground">Offline</span>
            </div>
            <div className="text-sm text-muted-foreground font-mono">
                {mounted ? new Date().toLocaleDateString() : 'Loading...'}
            </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
            label="Total Streams" 
            value={stats.totalStreams} 
            icon={<Video size={20} />} 
            delay={0.1} 
        />
        <StatsCard 
            label="Avg. Viewers" 
            value={stats.avgViewers} 
            icon={<UserIcon size={20} />} 
            delay={0.2} 
        />
        <StatsCard 
            label="Total Watch Time (Hrs)" 
            value={stats.totalHours} 
            icon={<Clock size={20} />} 
            delay={0.3} 
        />
        <StatsCard 
            label="Chat Activity" 
            value={stats.chatCount} 
            icon={<MessageSquare size={20} />} 
            delay={0.4} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stream Setup (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
            <StreamSetup 
                initialTitle={streamData.title}
                initialCategory={streamData.category}
                onSave={(title, category) => setStreamData({ title, category })}
            />
            
            {/* Action Bar */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                   <h3 className="text-foreground font-bold text-lg">Ready to start?</h3> 
                   <p className="text-muted-foreground text-sm">Your audience is waiting.</p>
                </div>
                
                {/* Go Live Button with Motion */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ 
                        boxShadow: ["0 0 0px rgba(124, 92, 255, 0)", "0 0 20px rgba(124, 92, 255, 0.3)", "0 0 0px rgba(124, 92, 255, 0)"] 
                    }}
                    transition={{ 
                        boxShadow: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                    onClick={handleGoLive}
                    disabled={loading}
                    className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" /> Starting...
                        </>
                    ) : (
                        <>
                            <Radio className="w-5 h-5 animate-pulse" /> Go Live Now
                        </>
                    )}
                </motion.button>
            </div>
        </div>

        {/* Quick Tips / Connection Info (1/3 width) */}
        <div className="bg-card border border-border rounded-xl p-6 h-fit shadow-md">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-secondary rounded-full"></span>
                Stream Info
            </h3>
            <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Server URL</p>
                    <code className="text-sm font-mono text-secondary break-all">rtmp://live.twitch-clone.com/app</code>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Stream Key</p>
                    <div className="flex items-center justify-between">
                         <code className="text-sm font-mono text-foreground blur-sm hover:blur-none transition-all cursor-pointer">
                             live_{user.id}_key_...
                         </code>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground pt-4 border-t border-border">
                    <p>💡 <strong>Pro Tip:</strong> Check your internet connection before going live to ensure a smooth stream.</p>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
