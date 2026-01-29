"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";

export default function CreateEventPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: 19.99,
        date: "",
        
    });

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to create event");
            
            const data = await res.json();
            router.push(`/events/${data.event._id}`);
        } catch (error) {
            console.error(error);
            alert("Failed to create event");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create PPV Event</h1>
            
            <form onSubmit={onSubmit} className="space-y-6 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <div>
                    <label className="block text-sm font-medium mb-2">Event Title</label>
                    <input 
                        type="text" 
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:outline-hidden focus:border-purple-500"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. Exclusive Masterclass"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea 
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 min-h-[120px] focus:outline-hidden focus:border-purple-500"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="What will viewers learn?"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Price ($)</label>
                        <input 
                            type="number" 
                            required
                            min="0"
                            step="0.01"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:outline-hidden focus:border-purple-500"
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Event Date & Time</label>
                        <input 
                            type="datetime-local" 
                            required
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:outline-hidden focus:border-purple-500 [color-scheme:dark]"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? "Creating..." : (
                            <>
                                <Calendar size={20} />
                                Schedule Event
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
