import { NextRequest, NextResponse } from "next/server";
import { chatMessageSchema } from "@/lib/schema/chat.schema";
import dbConnect from "@/lib/db";
import { Chat } from "@/model/chat.model";
import { auth } from "@/lib/auth";


export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const session = await auth();
        if(!session?.user){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = chatMessageSchema.safeParse(body);
        if(!parsed.success){
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { streamId,message } = parsed.data;
        if(!streamId || !message){
            return NextResponse.json({ error: "Invalid streamId or message" }, { status: 400 });
        }


        const chat = await Chat.create({
            streamId,
            userId: session.user.id,
            message,
            username: session.user.username,
        });

        return NextResponse.json({ chat }, { status: 200 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest){
    try {
        await dbConnect();
        const session = await auth();
        if(!session?.user){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const streamId = searchParams.get("streamId");

        if(!streamId){
             return NextResponse.json({ error: "Missing streamId" }, { status: 400 });
        }

        const chats = await Chat.find({ streamId })
            .sort({ createdAt: 1 })
            .populate("userId", "username image")
            .lean();

        const formattedChats = chats.map((chat: any) => ({
            ...chat,
            id: chat._id.toString(),
            _id: undefined 
        }));

        return NextResponse.json({ chats: formattedChats }, { status: 200 });

    } catch (error) {
        console.log("Error fetching chats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
