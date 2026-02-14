import React from 'react'
import { notFound } from "next/navigation";
import { IEvent } from "@/database";
import { getSimilarEventsBySlug } from "@/lib/actions/event.action";
import Image from "next/image";
import BookEvent from "@/components/BookEvent";
import EventCard from "@/components/EventCard";
import { cacheLife } from "next/cache";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

const EventDetailItem = ({ icon, alt, label }: { icon: string; alt: string; label: string; }) => (
    <div className="flex-row-gap-2 items-center text-white">
        <Image src={icon} alt={alt} width={17} height={17} />
        <p className="text-sm md:text-base">{label}</p>
    </div>
)

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
    <div className="agenda mt-6">
        <h2 className="text-white text-xl font-bold mb-3">Agenda</h2>
        <ul className="list-disc ml-5 space-y-2">
            {agendaItems.map((item, index) => (
                <li key={index} className="text-gray-300">{item}</li>
            ))}
        </ul>
    </div>
)

const EventTags = ({ tags }: { tags: string[] }) => (
    <div className="flex flex-row gap-2 flex-wrap mt-4">
        {tags.map((tag) => (
            <div className="bg-gray-800 text-xs text-white px-3 py-1 rounded-full border border-gray-700" key={tag}>
                {tag}
            </div>
        ))}
    </div>
)

const EventDetails = async ({ params }: { params: Promise<string> }) => {
    // Next.js 16/15 caching directive
    'use cache'
    cacheLife('hours');
    
    const slug = await params;

    let event: IEvent | null = null;
    let similarEvents: IEvent[] = [];

    try {
        // FIX: Directly connect to DB. This bypasses the need for BASE_URL and internal fetch.
        await connectDB();
        
        // Find the event by slug
        const foundEvent = await Event.findOne({ slug: slug }).lean();
        
        if (!foundEvent) {
            return notFound();
        }

        // Cast to our interface
        event = foundEvent as unknown as IEvent;

        // Use your existing server action for similar events
        const rawSimilar = await getSimilarEventsBySlug(slug);
        similarEvents = rawSimilar as unknown as IEvent[];
        
    } catch (error) {
        console.error("Vercel Runtime Error:", error);
        return notFound();
    }

    const { _id, title, description, image, location, date, time, agenda, tags, bookings } = event;

    return (
        <section className="container mx-auto px-4 py-10 max-w-6xl">
            <div className="details flex flex-col lg:flex-row gap-10">
                <div className="content flex-[2]">
                    <Image 
                        src={image} 
                        alt={title} 
                        width={1200} 
                        height={675} 
                        className="banner rounded-2xl w-full object-cover shadow-2xl mb-8" 
                        priority
                    />

                    <div className="space-y-6">
                        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{title}</h1>
                        
                        <div className="flex flex-wrap gap-5 py-4 border-y border-gray-800">
                            <EventDetailItem icon="/icons/pin.svg" alt="location" label={location} />
                            <EventDetailItem icon="/icons/calendar.svg" alt="date" label={date} />
                            <EventDetailItem icon="/icons/clock.svg" alt="time" label={time} />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-white text-xl font-bold">Description</h2>
                            <p className="text-gray-400 leading-relaxed whitespace-pre-line">{description}</p>
                        </div>

                        <EventAgenda agendaItems={agenda} />
                        
                        <div className="pt-6">
                            <h2 className="text-white text-xl font-bold mb-3">Tags</h2>
                            <EventTags tags={tags} />
                        </div>
                    </div>
                </div>

                <aside className="flex-1">
                    <div className="sticky top-24 bg-[#0d161a] p-8 rounded-2xl border border-gray-800 shadow-xl">
                        <h2 className="text-white text-2xl font-bold mb-2">Book Your Spot</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            {bookings > 0 
                                ? `Join ${bookings} others attending this event!` 
                                : "Be the first one to secure a spot!"}
                        </p>

                        <BookEvent eventId={String(_id)} slug={slug} />
                    </div>
                </aside>
            </div>

            <div className="mt-24 border-t border-gray-800 pt-12">
                <h2 className="text-white text-3xl font-bold mb-8">You might also like</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {similarEvents.length > 0 ? (
                        similarEvents.map((simEvent) => (
                            <EventCard key={simEvent.slug} {...simEvent} />
                        ))
                    ) : (
                        <p className="text-gray-500 italic">No similar events found at the moment.</p>
                    )}
                </div>
            </div>
        </section>
    )
}

export default EventDetails;