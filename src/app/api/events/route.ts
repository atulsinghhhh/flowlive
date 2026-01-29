import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Event } from "@/model/event.model";
import { Follow } from "@/model/follow.model";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const { title, description, price, date } = data;

        if (!title || !description || price === undefined || !date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const event = await Event.create({
            streamerId: session.user.id,
            title,
            description,
            price,
            date: new Date(date),
            agoraChannel: `ppv_${uuidv4()}`
        });

        return NextResponse.json({ event }, { status: 201 });

    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        await dbConnect();
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const follows = await Follow.find({ followerId: session.user.id });
        const followingIds = follows.map(f => f.followingId);

        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 24);

        const events = await Event.find({
            streamerId: { $in: [...followingIds, session.user.id] },
            date: { $gte: cutoffDate } 
        })
        .sort({ date: 1 })
        .populate("streamerId", "username avatar");

        return NextResponse.json({ events });

    } catch (error) {
        console.error("Error listing events:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
