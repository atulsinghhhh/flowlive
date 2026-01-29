"use client";

import { useEffect, useRef, useState } from "react";
import type { ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users } from "lucide-react";

export const StreamBroadcaster = ({ channelName }: { channelName: string }) => {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [published, setPublished] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  
  const videoRef = useRef<HTMLDivElement>(null);

  // Poll for viewer count
  useEffect(() => {
      if (!published) return;
      
      const interval = setInterval(async () => {
             try {
                 const resp = await fetch(`/api/stream?channelName=${channelName}`);
                 const data = await resp.json();
                 if (data.stream) {
                     setViewerCount(data.stream.viewerCount || 0);
                 }
             } catch (e) {
                 console.error("Failed to fetch viewer count", e);
             }
      }, 5000);
      
      return () => clearInterval(interval);
  }, [published, channelName]);

  // Initialize and Auto-Join with Local Client
  useEffect(() => {
    let mounted = true;
    let agoraClient: IAgoraRTCClient | null = null;
    let audioTrack: IMicrophoneAudioTrack | null = null;
    let videoTrack: ICameraVideoTrack | null = null;

    const init = async () => {
      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        setClient(agoraClient);

        const resp = await fetch(`/api/token?channelName=${channelName}&role=publisher`);
        const data = await resp.json();
        
        if (!data.token) throw new Error("Failed to get token");

        if (!mounted) return;

        // Join first
        await agoraClient.join(process.env.NEXT_PUBLIC_APP_ID!, channelName, data.token, data.uid);
        
        if (!mounted) {
            await agoraClient.leave();
            return;
        }

        // Create tracks
        [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        
        if (!mounted) {
            audioTrack.close();
            videoTrack.close();
            await agoraClient.leave();
            return;
        }

        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        
        // Publish
        await agoraClient.setClientRole("host");
        await agoraClient.publish([audioTrack, videoTrack]);
        
        if (mounted) {
            setPublished(true);
            // Play video locally
            if (videoRef.current) {
                videoTrack.play(videoRef.current);
            }
        }
            } catch (error) {
                const errorCode =
                        typeof error === "object" && error !== null && "code" in error
                                ? (error as { code?: string }).code
                                : undefined;
                if (errorCode === "OPERATION_ABORTED") {
                        // This is expected when the component unmounts during initialization
                        return;
                }
                console.error("Failed to initialize stream:", error);
                if (mounted && agoraClient) {
                         // Attempt cleanup on error
                         agoraClient.leave().catch(console.error);
                }
      }
    };

    init();

    return () => {
      mounted = false;
      audioTrack?.close();
      videoTrack?.close();
      setPublished(false);
      if (agoraClient) {
          agoraClient.leave().catch(err => {
              if (err.code === "OPERATION_ABORTED") return;
              console.error("Failed to leave channel", err)
          });
      }
    };
  }, [channelName]);

  const toggleMic = async () => {
      if (localAudioTrack) {
          await localAudioTrack.setEnabled(!micOn);
          setMicOn(!micOn);
      }
  };

  const toggleCamera = async () => {
      if (localVideoTrack) {
          await localVideoTrack.setEnabled(!cameraOn);
          setCameraOn(!cameraOn);
      }
  };

  // Socket for Stream End notification
  const [socket, setSocket] = useState<{ on: (event: string, callback: (data: unknown) => void) => void; emit: (event: string, data: unknown) => void } | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    
    let socketInstance: { on: (event: string, callback: (data: unknown) => void) => void; emit: (event: string, data: unknown) => void; disconnect: () => void };
    const initSocket = async () => {
        const { io } = await import("socket.io-client");
        socketInstance = io("http://localhost:3001", {
            auth: { userId }
        });
        setSocket(socketInstance);
    };

    initSocket();

    return () => { 
        if (socketInstance) socketInstance.disconnect(); 
    }
  }, [session?.user?.id]);

  const endStream = async () => {
      try {
          // Get stream ID first to update DB
          const resp = await fetch(`/api/stream?channelName=${channelName}`);
          const data = await resp.json();
          
          if (data.stream?._id) {
               // 1. Notify server via socket to delete chats and notify viewers
               if (socket) {
                   socket.emit("stream:end", { streamId: data.stream._id });
               }

               // 2. Update DB status
               await fetch("/api/stream", {
                  method: "PUT",
                  body: JSON.stringify({ streamId: data.stream._id, isLive: false })
              });
          }
      } catch (e) {
          console.error("Failed to update stream status", e);
      } finally {
          // Cleanup tracks explicitly before navigating (optional, since unmount handles it)
          localAudioTrack?.close();
          localVideoTrack?.close();
          client?.leave();
          router.push("/dashboard");
      }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-border/50 group ring-1 ring-white/5 mx-auto">
        <div ref={videoRef} className="w-full h-full" />
        
        {/* Overlays */}
        <div className="absolute top-6 left-6 flex items-center gap-3">
            <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded-lg text-xs font-bold animate-pulse shadow-sm shadow-destructive/20">
                LIVE
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/5 px-3 py-1 rounded-lg text-white text-xs font-medium flex items-center gap-2">
                <Users size={14} className="text-primary" /> {viewerCount}
            </div>
        </div>

        {/* Controls Bar - Floating Island */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <button 
                onClick={toggleMic}
                className={`p-3 rounded-xl transition-all duration-200 ${micOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-destructive/20 text-destructive hover:bg-destructive/30'}`}
                title={micOn ? "Mute Mic" : "Unmute Mic"}
            >
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button 
                onClick={toggleCamera}
                className={`p-3 rounded-xl transition-all duration-200 ${cameraOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-destructive/20 text-destructive hover:bg-destructive/30'}`}
                title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
            >
                {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            <button 
                onClick={endStream}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-destructive/20"
            >
                <PhoneOff size={16} /> End Stream
            </button>
        </div>
    </div>
  );
};
