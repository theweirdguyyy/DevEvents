import {NextRequest, NextResponse} from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import connectDB from "@/lib/mongodb";
import Event from '@/database/event.model';

// FIX: Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const formData = await req.formData();
        
        let eventData;
        try {
            // Renamed to eventData to avoid conflict with 'Event' model
            eventData = Object.fromEntries(formData.entries());
        } catch (e) {
            return NextResponse.json({ message: 'Invalid form data'}, { status: 400 })
        }

        const file = formData.get('image') as File;
        if(!file) return NextResponse.json({ message: 'Image file is required'}, { status: 400 });

        // Parse tags and agenda safely
        const tags = JSON.parse(formData.get('tags') as string || "[]");
        const agenda = JSON.parse(formData.get('agenda') as string || "[]");

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' }, (error, results) => {
                if(error) return reject(error);
                resolve(results);
            }).end(buffer);
        });

        const imageUrl = (uploadResult as { secure_url: string }).secure_url;

        const createdEvent = await Event.create({
            ...eventData,
            image: imageUrl,
            tags,
            agenda,
        });

        return NextResponse.json({ message: 'Event created', event: createdEvent }, { status: 201 });
    } catch (e) {
        console.error("POST ERROR:", e);
        return NextResponse.json({ message: 'Creation Failed', error: e instanceof Error ? e.message : 'Unknown'}, { status: 500 })
    }
}

export async function GET() {
    try {
        await connectDB();
        const events = await Event.find().sort({ createdAt: -1 }).lean();
        return NextResponse.json({ events }, { status: 200 });
    } catch (e) {
        return NextResponse.json({ message: 'Fetch failed' }, { status: 500 });
    }
}