"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { EventPlayer } from "@/components/event/event-player";
import { StreamBroadcaster } from "@/components/stream-broadcaster"; 
import { StreamChat } from "@/components/stream-chat";

interface WatchEvent {
    _id: string;
    title: string;
    agoraChannel: string;
    streamerId: {
        _id: string;
    };
}

interface EventResponse {
    event: WatchEvent;
    hasTicket: boolean;
}

export default function WatchEventPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [event, setEvent] = useState<WatchEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
             try {
                const res = await fetch(`/api/events/${id}`);
                const data: EventResponse = await res.json();
                
                if (!res.ok || !data.event) { 
                    router.push("/404");
                    return;
                }

                setEvent(data.event);

                // Start time check (optional, skipping for now to allow early join)
                
                if (data.hasTicket || (session?.user?.id && data.event.streamerId._id === session.user.id)) {
                    setAuthorized(true);
                } else {
                    router.push(`/events/${id}`);
                }
             } catch (e) {
                 console.error(e);
                 router.push(`/events/${id}`);
             } finally {
                 setLoading(false);
             }
        };
        checkAccess();
    }, [id, session, router]);

    if (loading || !authorized || !event) return <div className="h-screen bg-black flex items-center justify-center text-white">Verifying Ticket...</div>;

    const isOwner = session?.user?.id === event.streamerId._id;

    return (
        <div className="h-screen bg-black flex flex-col">
            <div className="h-14 border-b border-zinc-800 flex items-center px-4 bg-zinc-900 shrink-0 justify-between">
                <Link href={`/events/${event._id}`} className="text-zinc-400 hover:text-white flex items-center gap-2 font-bold">
                    <ArrowLeft size={16} /> Leave Event
                </Link>
                <div className="font-bold text-white">{event.title}</div>
                <div className="w-20"></div> 
            </div>
            
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative">
                    {isOwner ? (
                        <StreamBroadcaster channelName={event.agoraChannel} />
                    ) : (
                        <EventPlayer channelName={event.agoraChannel} />
                    )}
                </div>
                {/* Chat Sidebar */}
                <div className="w-80 border-l border-zinc-800 bg-zinc-900 hidden md:flex flex-col">
                    <StreamChat streamId={event._id} streamerId={event.streamerId._id} />
                </div>
            </div>
        </div>
    );
}
