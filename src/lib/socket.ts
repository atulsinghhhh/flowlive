import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

// console.log("Loading .env...");
// dotenv.config({ path: ".env.local" });
// console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Found" : "Missing");

import { chatMessageSchema } from "./schema/chat.schema";
import { Chat } from "../model/chat.model";
import { Stream } from "../model/stream.model";
import { User } from "../model/user.model";
import dbConnect from "./db";

// console.log("Imports done. Creating server...");
const httpServer = http.createServer();

export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware for auth
io.use(async (socket, next) => {
  try {
    await dbConnect();
    const userId = socket.handshake.auth.userId || socket.handshake.query.userId;
    
    if (!userId) {
      return next(new Error("Authentication error: User ID not found"));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.data.user = {
      id: user._id.toString(),
      username: user.username,
      image: user.avatar
    };
    next();
  } catch (error) {
    next(new Error("Internal Server Error"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id, socket.data.user?.username);

  socket.on("join:stream", ({ streamId }) => {
    socket.join(streamId);
  });

  socket.on("chat:send", async (payload) => {
    try {
        const payloadSchema = chatMessageSchema.pick({ streamId: true, message: true });
        const parsed = payloadSchema.safeParse(payload);
        
        if (!parsed.success) {
            console.error("Invalid payload", parsed.error);
            return;
        }

        const { streamId, message } = parsed.data;
        const user = socket.data.user;

        // Check if stream exists and if user is streamer
        const stream = await Stream.findById(streamId);
        if (!stream) {
            console.error("Stream not found");
            return;
        }

        // Check if user is blocked
        if (stream.blockedUsers.includes(user.id)) {
             socket.emit("chat:error", { message: "You are blocked from this stream." });
             return;
        }

        const chat = await Chat.create({
            streamId,
            userId: user.id,
            message,
            username: user.username
        });

        io.to(streamId).emit("chat:new", {
            id: chat._id,
            message,
            userId: {
                username: user.username,
                image: user.image
            },
            createdAt: chat.createdAt
        });
    } catch (error) {
        console.error("Chat error:", error);
    }
  });

  socket.on("user:block", async ({ streamId, userIdToBlock }) => {
      try {
          const stream = await Stream.findById(streamId);
          if (stream && stream.streamerId.toString() === socket.data.user.id) {
              if (!stream.blockedUsers.includes(userIdToBlock)) {
                  stream.blockedUsers.push(userIdToBlock);
                  await stream.save();
                  io.to(streamId).emit("user:blocked", { userId: userIdToBlock }); // Notify clients to update UI
              }
          }
      } catch (e) {
          console.error("Block error", e);
      }
  });

  socket.on("stream:end", async ({ streamId }) => {
      try {
          const stream = await Stream.findById(streamId);
          if (stream && stream.streamerId.toString() === socket.data.user.id) {
              // 1. Delete all chats for this stream
              await Chat.deleteMany({ streamId });
              
              // 2. Notify all clients in the room
              io.to(streamId).emit("stream:ended");

              // 3. Optional: Clear the room?
              io.in(streamId).disconnectSockets();
          }
      } catch (e) {
          console.error("End stream error", e);
      }
  });


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(3001, () => {
  console.log("Socket.IO server running on port 3001");
});
