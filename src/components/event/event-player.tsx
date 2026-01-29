"use client";

import { useEffect, useRef, useState } from "react";
import type { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { useAgora } from "@/context/agora-provider";
import { Loader2 } from "lucide-react";

export const EventPlayer = ({ channelName }: { channelName: string }) => {
  const { client } = useAgora();
  const [isConnected, setIsConnected] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!client) return;

    const init = async () => {
      client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
        try {
            await client.subscribe(user, mediaType);
            if (mediaType === "video") {
              user.videoTrack?.play(videoRef.current!);
            }
            if (mediaType === "audio") {
              user.audioTrack?.play();
            }
        } catch (error) {
            console.error("Failed to subscribe:", error);
        }
      });

      client.on("user-unpublished", (user) => {
        if (user.videoTrack) user.videoTrack.stop();
      });

      try {
        const resp = await fetch(`/api/token?channelName=${channelName}&role=subscriber`);
        const data = await resp.json();
        
        if (!data.token) throw new Error("Failed to get token");

        await client.setClientRole("audience"); 
        await client.join(process.env.NEXT_PUBLIC_APP_ID!, channelName, data.token, data.uid);
        setIsConnected(true);

      } catch (error) {
        console.error("EventPlayer Init Error:", error);
      }
    };

    init();

    return () => {
      if (client) {
        client.leave().catch(console.error);
        client.removeAllListeners();
      }
    };
  }, [client, channelName]);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div 
        ref={videoRef} 
        className="w-full h-full bg-black rounded-lg overflow-hidden flex items-center justify-center text-white relative group"
      >
        {!isConnected && (
            <div className="z-10 flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-purple-500 w-8 h-8" />
                <p className="font-bold text-sm tracking-wide animate-pulse">Connecting to Event...</p>
            </div>
        )}
      </div>
    </div>
  );
};
