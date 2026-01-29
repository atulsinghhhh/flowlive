"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, CheckCircle, Play, User } from "lucide-react";
import { useSession } from "next-auth/react";

interface EventDetails {
    _id: string;
    title: string;
    description: string;
    price: number;
    date: string;
    agoraChannel: string;
    streamerId: {
        _id: string;
        username: string;
        avatar?: string | null;
        bio?: string | null;
    };
}

interface EventResponse {
    event: EventDetails;
    hasTicket: boolean;
}

export default function EventDetailsPage() {
    const {data: session} = useSession();
    const { id } = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<EventDetails | null>(null);
    const [hasTicket, setHasTicket] = useState(false);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${id}`);
                if (!res.ok) throw new Error("Event not found");
                const data: EventResponse = await res.json();
                setEvent(data.event);
                setHasTicket(data.hasTicket);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchEvent();
    }, [id]);

    const buyTicket = async () => {
        if (!event) return;
        if (!confirm(`Confirm purchase for $${event.price}?`)) return;
        setPurchasing(true);
        try {
            const res = await fetch("/api/tickets/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId: id }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Purchase failed");

            alert("Ticket Purchased! Confirmation email sent.");
            setHasTicket(true);
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert("Purchase failed");
            }
        } finally {
            setPurchasing(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
        setPurchasing(true); 
        try {
            const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/");
                router.refresh();
            } else {
                throw new Error("Failed to delete event");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to delete event");
            setPurchasing(false);
        }
    };

    if (loading) return <div className="p-12 text-center">Loading event...</div>;
    if (!event) return <div className="p-12 text-center">Event not found</div>;

    const isOwner = session?.user?.id === event.streamerId._id;
    const eventDate = new Date(event.date);
    const now = new Date();
    
    // Allow join 15 mins before start
    const canJoin = isOwner || (hasTicket && now.getTime() >= eventDate.getTime() - 15 * 60000);

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="h-96 relative w-full bg-zinc-900 border-b border-zinc-800">
                 {/* Banner / Trailer Placeholder */}
                 <div className="absolute inset-0 flex items-center justify-center bg-linear-to-b from-purple-900/20 to-black/80">
                    <Play size={64} className="text-white/20" />
                 </div>
                 
                 <div className="absolute bottom-0 left-0 w-full p-8 bg-linear-to-t from-black to-transparent">
                     <div className="max-w-7xl mx-auto flex items-end justify-between gap-6">
                         <div>
                            <span className="bg-purple-600 text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block">PPV Event</span>
                            <h1 className="text-5xl font-bold mb-2">{event.title}</h1>
                            <div className="flex items-center gap-4 text-zinc-300">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden">
                                        {event.streamerId.avatar && (
                                            <Image
                                                src={event.streamerId.avatar}
                                                alt={`${event.streamerId.username} avatar`}
                                                width={24}
                                                height={24}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <span className="font-semibold">{event.streamerId.username}</span>
                                </div>
                                <span>•</span>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <span>{eventDate.toLocaleString()}</span>
                                </div>
                            </div>
                         </div>

                         <div className="bg-zinc-900/90 backdrop-blur border border-zinc-700 p-6 rounded-2xl w-80 text-center shadow-2xl">
                             {isOwner ? (
                                 <div className="space-y-4">
                                     <div className="text-sm text-zinc-400">You are the host</div>
                                     <button 
                                        onClick={() => router.push(`/events/${id}/watch`)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-transform hover:scale-105 active:scale-95"
                                     >
                                         Start Event / Go Live
                                     </button>
                                     <button 
                                        onClick={handleDelete}
                                        disabled={purchasing}
                                        className="w-full bg-red-900/50 hover:bg-red-900/80 text-red-200 font-bold py-2 rounded-lg transition-colors text-sm border border-red-900"
                                     >
                                         {purchasing ? "Deleting..." : "Delete Event"}
                                     </button>
                                 </div>
                             ) : hasTicket ? (
                                 <div className="space-y-4">
                                     <div className="flex items-center justify-center gap-2 text-green-400 font-bold bg-green-900/20 py-2 rounded-lg">
                                         <CheckCircle size={20} />
                                         Ticket Confirmed
                                     </div>
                                     {canJoin ? (
                                        <button 
                                            onClick={() => router.push(`/events/${id}/watch`)}
                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-transform hover:scale-105 active:scale-95"
                                        >
                                            Join Event
                                        </button>
                                     ) : (
                                         <div className="text-center">
                                             <p className="text-zinc-400 text-sm mb-2">Event starts in</p>
                                             <div className="font-mono text-xl font-bold">
                                                {/* Simple formatted date diff or just status */}
                                                {eventDate.toLocaleString()}
                                             </div>
                                             <p className="text-xs text-zinc-500 mt-2">Join enabled 15m before start</p>
                                         </div>
                                     )}
                                 </div>
                             ) : (
                                 <div className="space-y-4">
                                     <div className="text-3xl font-bold">${event.price}</div>
                                     <button 
                                        onClick={buyTicket}
                                        disabled={purchasing}
                                        className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3 rounded-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                                     >
                                         {purchasing ? "Processing..." : "Buy Ticket"}
                                     </button>
                                     <p className="text-xs text-zinc-500">Secure payment via Stripe (Mock)</p>
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>
            </div>

            <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                     <section>
                         <h2 className="text-2xl font-bold mb-4">About this Event</h2>
                         <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">
                             {event.description}
                         </p>
                     </section>

                     <section>
                         <h2 className="text-2xl font-bold mb-4">About the Host</h2>
                         <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex items-start gap-4">
                             <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                                {event.streamerId.avatar ? (
                                    <Image
                                        src={event.streamerId.avatar}
                                        alt={`${event.streamerId.username} avatar`}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><User /></div>
                                )}
                             </div>
                             <div>
                                 <h3 className="font-bold text-lg">{event.streamerId.username}</h3>
                                 <p className="text-zinc-400 mt-1">{event.streamerId.bio || "No bio yet."}</p>
                             </div>
                         </div>
                     </section>
                </div>
            </div>
        </div>
    );
}
