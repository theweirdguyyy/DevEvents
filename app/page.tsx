import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import {IEvent} from "@/database";
import {cacheLife} from "next/cache";

// FIX 1: Ensure BASE_URL is an absolute URL for Node.js fetch during build.
const VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_URL;
const BASE_URL = VERCEL_URL 
    ? `https://${VERCEL_URL}` // Prepend protocol for absolute URL
    : 'http://localhost:3000'; // Fallback for local development

const Page = async () => {
    'use cache';
    cacheLife('hours')
    
    let events: IEvent[] = []; // Initialize events array
    
    // FIX 2: Use try/catch to prevent the build from crashing if the API call fails (due to DB error)
    try {
        console.log(`Attempting to fetch from: ${BASE_URL}/api/events`);
        const response = await fetch(`${BASE_URL}/api/events`); 
        
        if (response.ok) {
            // Only try to parse JSON if the response status is 200-299
            const data = await response.json();
            events = data.events || [];
        } else {
            // Log the non-JSON error to Vercel console for debugging
            console.error("API Fetch Failed. Status:", response.status, "Text:", await response.text());
        }
    } catch (error) {
        // Catch network or JSON parsing errors and gracefully continue the build
        console.error("Fetch/JSON Error during build. Continuing with empty data.", error);
    }

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
                    {/* Show a message if no events are loaded */}
                    {events.length === 0 && (
                        <li className="list-none text-center text-gray-500">
                           No events loaded. Please ensure your database connection is active.
                        </li>
                    )}
                </ul>
            </div>
        </section>
        
    )
}

export default Page;