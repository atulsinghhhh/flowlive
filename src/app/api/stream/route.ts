import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Stream } from "@/model/stream.model";
import { StreamParticipant } from "@/model/streamParticipant.model";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const channelName = searchParams.get('channelName');

    await dbConnect();

    if (!channelName) {
        try {
            const streams = await Stream.find({ isLive: true })
                .populate("streamerId", "username")
                .sort({ createdAt: -1 })
                .lean();

            console.log("Fetched streams:", streams); // Debug log

            const streamsWithStats = await Promise.all(streams.map(async (s) => {
                const viewerCount = await StreamParticipant.countDocuments({
                    streamId: s._id,
                    leftAt: null
                });
                return { ...s, viewerCount };
            }));

            return NextResponse.json({ streams: streamsWithStats });
        } catch(err) {
             console.error("Error fetching streams:", err);
             return NextResponse.json({ error: "Failed to fetch streams" }, { status: 500 });
        }
    }

    const stream = await Stream.findOne({ agoraChannel: channelName, isLive: true }).lean();

    if (!stream) {
        return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    const viewerCount = await StreamParticipant.countDocuments({
        streamId: stream._id,
        leftAt: null
    });

    return NextResponse.json({ stream: { ...stream, viewerCount } });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, category, agoraChannel, thumbnailUrl } = await request.json();

    if (!title || !category || !agoraChannel) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    console.log("Agora channel: ",agoraChannel);

    await dbConnect();

    // Use findOneAndUpdate with upsert to reuse the existing document
    // distinct index on agoraChannel ensures we match the correct one
    const updateData: any = {
        streamerId: session.user.id,
        title,
        category,
        isLive: true,
    };

    if (thumbnailUrl) {
        updateData.thumbnailUrl = thumbnailUrl;
    }

    // 1. Mark any existing live streams by this user as ended
    await Stream.updateMany(
        { streamerId: session.user.id, isLive: true },
        { isLive: false }
    );

    // 2. Create a NEW stream record
    const stream = await Stream.create({
        streamerId: session.user.id,
        title,
        category,
        agoraChannel,
        thumbnailUrl,
        isLive: true
    });

    return NextResponse.json({ stream }, { status: 201 });
  } catch (error) {
    console.error("Error creating stream:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { streamId, isLive } = await request.json();

        if (!streamId || typeof isLive !== "boolean") {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        await dbConnect();

        const stream = await Stream.findOneAndUpdate(
            { _id: streamId, streamerId: session.user.id },
            { isLive },
            { new: true }
        );

        if(!stream) {
            return NextResponse.json({ error: "Stream not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ stream });

    } catch (error) {
        console.error("Error updating stream:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
