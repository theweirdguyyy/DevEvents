import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import {IEvent} from "@/database";
import {cacheLife} from "next/cache";

// --- START: Updated BASE_URL definition ---
// VERCEL_URL is injected by Vercel and usually does not include the protocol (https://).
// We must prepend it to create a valid absolute URL for Node.js fetch.
const VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_URL;
const BASE_URL = VERCEL_URL 
    ? `https://${VERCEL_URL}` // **FIX:** Explicitly add 'https://'
    : 'http://localhost:3000'; // Fallback for local development
// --- END: Updated BASE_URL definition ---

const Page = async () => {
    'use cache';
    cacheLife('hours')
    // This will now correctly resolve to "https://dev-events-neon.vercel.app/api/events"
    const response = await fetch(`${BASE_URL}/api/events`); 
    const { events } = await response.json();

    return (
        <section>
            <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

            <ExploreBtn />

            <div className="mt-20 space-y-7">
                <h3>Featured Events</h3>

                <ul className="events">
                    {events && events.length > 0 && events.map((event: IEvent) => (
                        <li key={event.title} className="list-none">
                            <EventCard {...event} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
        
    )
}

export default Page;