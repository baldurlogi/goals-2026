import type { GoalDefinition } from "../../goalTypes";


export const travelPlanningGoal: GoalDefinition = {
    id: "travel-planning",
    title: "Travel Planning 2026",
    subtitle: "LA visits + family trips + Europe exploration",
    emoji: "✈️",
    priority: "low",
    steps: [
        {
            id: "create-travel-budget",
            label: "Create 2026 travel budget spreadsheet",
            notes: "Track: flights, accommodation, food, activities, misc. Total budget: ~51,000 DKK. Use Google Sheets.",
            idealFinish: "2026-02-28",
            estimatedTime: "1 hour"
        },
        {
            id: "book-la-trip-1",
            label: "Book LA Trip #1 flights (May)",
            notes: "CPH → LAX. Book 2-3 months in advance. Use Google Flights or Skyscanner. Budget: 5,000-6,000 DKK roundtrip.",
            idealFinish: "2026-03-15",
            estimatedTime: "2 hours",
            links: ["https://google.com/flights", "https://skyscanner.com"]
        },
        {
            id: "la-trip-1-itinerary",
            label: "Plan LA Trip #1 itinerary (5-7 days)",
            notes: "Balance: boyfriend time, beach, hikes (Runyon Canyon), food spots, maybe Disneyland. Keep flexible.",
            idealFinish: "2026-04-30",
            estimatedTime: "2 hours"
        },
        {
            id: "book-wisconsin-trip",
            label: "Book Wisconsin family trip flights (June/July)",
            notes: "CPH → Chicago or Milwaukee. Meet boyfriend's family + lakehouse time. Budget: 7,000-8,000 DKK.",
            idealFinish: "2026-04-15",
            estimatedTime: "2 hours"
        },
        {
            id: "wisconsin-trip-prep",
            label: "Wisconsin trip prep: gifts + outfit",
            notes: "Bring small gift for family (Icelandic chocolate?). Pack casual lakehouse clothes, swimsuit.",
            idealFinish: "2026-06-15",
            estimatedTime: "2 hours"
        },
        {
            id: "book-iceland-trip",
            label: "Book Iceland family trip flights (July/Aug)",
            notes: "CPH → KEF for you + boyfriend. Visit family, show him Iceland. Budget: 10,000-12,000 DKK for both.",
            idealFinish: "2026-05-01",
            estimatedTime: "2 hours"
        },
        {
            id: "iceland-itinerary",
            label: "Plan Iceland itinerary (7-10 days)",
            notes: "Reykjavík, Golden Circle, South Coast, hot springs. Mix family time + couple exploration.",
            idealFinish: "2026-06-30",
            estimatedTime: "3 hours"
        },
        {
            id: "copenhagen-prep-boyfriend-visit",
            label: "Prepare Copenhagen for boyfriend's visit (August)",
            notes: "Clean apartment, stock fridge, plan 2-3 date spots, book 1 fancy dinner. His flight: ~4,000 DKK.",
            idealFinish: "2026-08-01",
            estimatedTime: "4 hours"
        },
        {
            id: "copenhagen-itinerary",
            label: "Plan Copenhagen activities (2-3 weeks)",
            notes: "Show him: Nyhavn, Tivoli, bike culture, coffee shops, Christiania, beaches. Balance work + quality time.",
            idealFinish: "2026-08-01",
            estimatedTime: "2 hours"
        },
        {
            id: "book-la-trip-2",
            label: "Book LA Trip #2 flights (October)",
            notes: "CPH → LAX. Book by June for better rates. Budget: 5,000-6,000 DKK.",
            idealFinish: "2026-06-30",
            estimatedTime: "2 hours"
        },
        {
            id: "plan-europe-weekend-1",
            label: "Plan Europe weekend trip #1",
            notes: "Amsterdam, Berlin, or Stockholm. 2-3 days. Budget: 3,000 DKK. Book flight + hostel/Airbnb.",
            idealFinish: "2026-05-15",
            estimatedTime: "2 hours"
        },
        {
            id: "plan-europe-weekend-2",
            label: "Plan Europe weekend trip #2",
            notes: "Different city. Solo or with friends. Budget: 3,000 DKK. Cultural exploration + reset.",
            idealFinish: "2026-09-15",
            estimatedTime: "2 hours"
        },
        {
            id: "travel-packing-list",
            label: "Create master travel packing list",
            notes: "Save in Notes app. Include: clothes, toiletries, tech, documents, meds. Reuse for each trip.",
            idealFinish: "2026-04-30",
            estimatedTime: "1 hour"
        },
        {
            id: "travel-photography",
            label: "Capture travel content for YouTube",
            notes: "Bring camera/phone, film b-roll at each destination. Vlogs: LA, Iceland, Copenhagen. Future content!",
            idealFinish: "ongoing",
            estimatedTime: "ongoing"
        }
    ]
}