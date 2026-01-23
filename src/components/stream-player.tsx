"use client";

import { useEffect, useRef, useState } from "react";
import type { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { useAgora } from "../context/agora-provider";
import { Loader2 } from "lucide-react";

export const StreamPlayer = ({ channelName }: { channelName: string }) => {
  const { client } = useAgora();
  const [isConnected, setIsConnected] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const videoRef = useRef<HTMLDivElement>(null);
  const streamIdRef = useRef<string | null>(null);

  // Fetch stream info for thumbnail
  useEffect(() => {
      const fetchInfo = async () => {
          try {
              const res = await fetch(`/api/stream?channelName=${channelName}`);
              const data = await res.json();
              if (data.stream?.thumbnailUrl) {
                  setThumbnailUrl(data.stream.thumbnailUrl);
              }
          } catch (e) {
              console.error("Failed to fetch stream info", e);
          }
      };
      fetchInfo();
  }, [channelName]);

  useEffect(() => {
    if (!client) return;

    const init = async () => {
      client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
        console.log("User published:", user.uid, mediaType);
        try {
            await client.subscribe(user, mediaType);
            console.log("Subscribed to:", user.uid, mediaType);
            
            if (mediaType === "video") {
              const track = user.videoTrack;
              if (track && videoRef.current) {
                  console.log("Playing video track for user", user.uid);
                  track.play(videoRef.current);
              }
            }
            
            if (mediaType === "audio") {
              user.audioTrack?.play();
            }
        } catch (error) {
            console.error("Failed to subscribe:", error);
        }
      });

      client.on("user-unpublished", (user) => {
        console.log("User unpublished:", user.uid);
        if (user.videoTrack) user.videoTrack.stop();
      });

      if (!process.env.NEXT_PUBLIC_APP_ID) {
        throw new Error("Agora Env Vars missing");
      }

      try {
        console.log("Fetching token for subscriber...");
        const resp = await fetch(`/api/token?channelName=${channelName}&role=subscriber`);
        const data = await resp.json();
        
        if (!data.token) throw new Error("Failed to get token");

        console.log("Joining channel:", channelName, "with UID:", data.uid);
        await client.setClientRole("audience"); 
        await client.join(process.env.NEXT_PUBLIC_APP_ID, channelName, data.token, data.uid);
        console.log("Joined channel successfully");
        setIsConnected(true);

        // Register Viewer (Backend logic)
        const streamResp = await fetch(`/api/stream?channelName=${channelName}`);
        if (streamResp.ok) {
            const streamData = await streamResp.json();
            if (streamData.stream?._id) {
                const viewerResp = await fetch("/api/stream/viewer", {
                    method: "POST",
                    body: JSON.stringify({ streamId: streamData.stream._id })
                });
                if (viewerResp.ok) {
                    streamIdRef.current = streamData.stream._id;
                }
            }
        }
      } catch (error) {
        console.error("StreamPlayer Init Error:", error);
      }
    };

    init();

    return () => {
      if (client) {
        console.log("Leaving channel");
        client.leave();
        client.removeAllListeners();
      }
      if (streamIdRef.current) {
          fetch("/api/stream/viewer", {
              method: "PUT",
              body: JSON.stringify({ streamId: streamIdRef.current }),
              keepalive: true
          }).catch(console.error);
      }
    };
  }, [client, channelName]);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div 
        ref={videoRef} 
        className="w-full h-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center text-white relative group"
      >
        {!isConnected && (
            <>
                {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="Stream Cover" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-purple-900/20 to-black pointer-events-none" />
                )}
                <div className="z-10 flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-purple-500 w-8 h-8" />
                    <p className="font-bold text-sm tracking-wide animate-pulse">Connecting to Live...</p>
                </div>
            </>
        )}
      </div>
      <div className="text-white font-medium">
        Watching: <span className="text-purple-400">{channelName}</span>
      </div>
    </div>
  );
};
