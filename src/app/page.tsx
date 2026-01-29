"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { StreamCard } from "@/components/stream-card";
import { EventCard } from "@/components/event/event-card";
import { RecommendedSidebar } from "@/components/recommended-sidebar";
import { HeroCarousel } from "@/components/hero-carousel";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

interface StreamType {
    _id: string;
    title: string;
    category: string;
    agoraChannel: string;
    viewerCount: number;
    streamerId: {
        username: string;
        avatar?: string;
    };
}

interface EventType {
    _id: string;
    title: string;
    description: string;
    price: number;
    date: string;
    streamerId: {
        username: string;
        avatar?: string;
    };
    thumbnailUrl?: string;
}

export default function HomePage() {
    const { data: session, status } = useSession();
    const [streams, setStreams] = useState<StreamType[]>([]);
    const [events, setEvents] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (status === 'authenticated') {
            console.log("Session Username:", session?.user?.email);
        } else if (status === 'loading') {
            console.log("Session Loading...");
        } else {
            console.log("Session Unauthenticated");
        }
    }, [session, status]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [streamRes, eventRes] = await Promise.all([
                    fetch("/api/stream", { cache: 'no-store' }),
                    fetch("/api/events", { cache: 'no-store' })
                ]);
                
                if (streamRes.ok) {
                    const data = await streamRes.json();
                    if (data.streams) setStreams(data.streams);
                }

                if (eventRes.ok) {
                    const data = await eventRes.json();
                    if (data.events) setEvents(data.events);
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); 
        return () => clearInterval(interval);
    }, []);

    const featuredStream = streams.length > 0 ? streams[0] : null;

    return (
        <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/30">
            {/* Sidebar (Recommended) */}
            <RecommendedSidebar streams={streams} />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
                {/* Navbar - Glassmorphic & Minimal */}
                <nav className="h-16 border-b border-border/40 flex items-center px-6 justify-between bg-background/80 backdrop-blur-md sticky top-0 z-50">
                    <Link href="/" className="text-2xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent transition-opacity hover:opacity-80">
                        goLive
                    </Link>
                    
                    <div className="flex gap-4 items-center flex-1 justify-center max-w-2xl mx-auto px-4">
                        <div className="hidden md:block relative w-full max-w-md">
                            <form action="/search">
                                <input 
                                    name="q"
                                    type="text" 
                                    placeholder="Search channels..." 
                                    className="w-full bg-input/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground/70"
                                />
                            </form>
                        </div>
                    </div>

                    <div className="flex gap-3 items-center">
                        {session ? (
                            <>
                                <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 rounded-xl hover:bg-primary/5">
                                    <LayoutDashboard size={18} />
                                    <span className="hidden sm:inline">Dashboard</span>
                                </Link>
                                <button 
                                    onClick={() => signOut()}
                                    className="px-4 py-2 text-sm font-medium bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors flex items-center gap-2"
                                >
                                    <LogOut size={18} />
                                    <span className="hidden sm:inline">Log Out</span>
                                </button>
                                <Link href={`/u/${session.user?.username}`} className="w-9 h-9 rounded-full bg-primary/20 overflow-hidden border border-border/50 relative hover:ring-2 hover:ring-primary/50 transition-all">
                                    {session.user?.image ? (
                                        <Image src={session.user.image} alt="User" width={36} height={36} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full font-bold text-primary text-sm">
                                            {session.user?.username?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:bg-white/5 rounded-xl">
                                    Log In
                                </Link>
                                <Link href="/signup" className="px-5 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/25">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Main Content */}
                <main className="p-6 md:p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                        <HeroCarousel stream={featuredStream} />
                    </div>

                    {/* Events Section */}
                    {events.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                                <span className="text-purple-500">Upcoming</span> Events
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {events.map(event => (
                                    <EventCard key={event._id} event={event} />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="text-primary animate-pulse">Live</span> Channels
                        </h2>
                        <div className="flex gap-2">
                             <button className="px-4 py-1.5 bg-card border border-border/50 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all">Categories</button>
                             <button className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary hover:bg-primary/20 transition-all shadow-sm shadow-primary/5">Live Channels</button>
                        </div>
                    </div>

                    {loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="animate-pulse flex flex-col gap-3">
                                    <div className="aspect-video bg-zinc-900/50 rounded-xl"></div>
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-900/50 shrink-0"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-zinc-900/50 rounded w-3/4"></div>
                                            <div className="h-3 bg-zinc-900/50 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!loading && streams.length === 0 && (
                        <p className="text-center text-muted-foreground">No live streams available at the moment. Please check back later!</p>
                    )}
                    {!loading && streams.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {streams.map(stream => (
                                <StreamCard key={stream._id} stream={stream} />
                            ))}
                        </div>
                    )}
                    
                </main>
            </div>
        </div>
    );
}
