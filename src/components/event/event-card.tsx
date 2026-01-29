import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';

interface EventCardProps {
    event: {
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
    };
}

export const EventCard = ({ event }: EventCardProps) => {
    return (
        <Link href={`/events/${event._id}`} className="block group">
            <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                {/* Thumbnail */}
                <div className="aspect-video bg-zinc-800 relative">
                    {event.thumbnailUrl ? (
                        <Image
                            src={event.thumbnailUrl}
                            alt={event.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                             <Calendar size={48} />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 bg-purple-600 text-white font-bold px-2 py-1 rounded text-sm shadow-md">
                        ${event.price}
                    </div>
                </div>
                
                {/* Details */}
                <div className="p-4">
                    <h3 className="font-bold text-lg text-zinc-100 group-hover:text-purple-400 transition-colors truncate">
                        {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm mt-2">
                                <div className="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                                    {event.streamerId.avatar && (
                                          <Image
                                                src={event.streamerId.avatar}
                                                alt={event.streamerId.username}
                                                width={24}
                                                height={24}
                                                className="w-full h-full object-cover"
                                          />
                                    )}
                        </div>
                        <span>{event.streamerId.username}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 text-xs mt-3">
                        <Calendar size={14} />
                        <span>{new Date(event.date).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};
