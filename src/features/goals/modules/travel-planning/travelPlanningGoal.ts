import type { GoalDefinition } from "../../goalTypes";

export const travelPlanningGoal: GoalDefinition = {
  id: "travel-planning-2026",
  title: "Travel Planning",
  subtitle: "Trips, budgets, booking rules, PTO, and execution",
  emoji: "✈️",
  priority: "high",

  /**
   * FX NOTE (planning only):
   * - Use approx conversion: 1 USD ≈ 6.34 DKK (update later if needed).
   */

  steps: [
    // =========================
    // SYSTEM SETUP (reused for all trips)
    // =========================

    {
      id: "travel-docs-passport-check",
      label: "System: Check passport validity + travel documents",
      notes:
        "Check passport expiry date. Rule of thumb: many trips require 3–6 months validity beyond travel dates.\nDone when you’ve confirmed expiry and either (a) you're good for all 2026 trips or (b) you initiated renewal.",
      idealFinish: "2026-02-28",
      estimatedTime: "10 min",
    },
    {
      id: "travel-esta-check",
      label: "System: Check ESTA/US entry requirements (if needed) + renew/reapply",
      notes:
        "Check if you need ESTA for US trips and whether your ESTA is still valid for April/June/Fall travel windows.\nDone when: ESTA is confirmed valid OR you’ve submitted a renewal/reapplication (and saved confirmation).",
      idealFinish: "2026-03-05",
      estimatedTime: "20 min",
      links: ["https://esta.cbp.dhs.gov/"],
    },
    {
      id: "travel-insurance-plan",
      label: "System: Decide travel insurance strategy (annual vs per-trip)",
      notes:
        "Decide: annual travel insurance or per-trip coverage. Ensure it covers medical + cancellation + baggage.\nDone when: you have a policy chosen + where it lives (PDF in shared folder).",
      idealFinish: "2026-03-10",
      estimatedTime: "30 min",
    },
    {
      id: "travel-master-checklist",
      label: "System: Create master travel checklist (packing + payments + eSIM)",
      notes:
        "Reusable checklist:\n- Docs: passport/ID, ESTA/visas, insurance\n- Payments: 2 cards + Apple Pay + emergency cash\n- Connectivity: roaming/eSIM plan\n- Health: meds, basics\n- Tech: chargers, adapters\n- Shared folder for tickets/receipts\nDone when: checklist exists in your app/Notion and can be copied per trip.",
      idealFinish: "2026-03-10",
      estimatedTime: "30 min",
    },
    {
      id: "flight-price-trackers",
      label: "System: Set flight price trackers for all 2026 routes",
      notes:
        "Set Google Flights alerts for:\n- CPH ↔ NYC (April)\n- Boyfriend home airport ↔ NYC and ↔ CPH (April)\n- CPH ↔ UK (LON/MAN) and UK ↔ AEY (Akureyri)\n- CPH ↔ MKE/ORD (Wisconsin)\n- CPH ↔ KEF (Iceland August)\n- CPH ↔ LAX (Fall LA optional)\nCheck 2–3x/week. Book when price hits cap OR when you reach book-by date.",
      idealFinish: "2026-03-01",
      estimatedTime: "30 min",
      links: [
        "https://www.google.com/travel/flights",
        "https://www.google.com/travel/flights/saves",
        "https://support.google.com/travel/answer/6235879",
      ],
    },
    {
      id: "ig-template",
      label: "System: Create IG post template (caption + shot list)",
      notes:
        "Make a reusable template:\n- 1 carousel caption formula\n- 5 story prompts\n- Shot list (food, street, portrait, skyline/nature, moment)\nDone when: template exists and can be reused for every trip.",
      idealFinish: "2026-03-15",
      estimatedTime: "20 min",
    },

    // =========================
    // TRIP TEMPLATE (applied per trip)
    // For each trip you should have:
    // 1) lock dates 2) PTO plan 3) budget estimate 4) book travel 5) anchor itinerary 6) IG post
    // =========================

    // =========================
    // TRIP 1: EASTER — AKUREYRI (family)
    // =========================

    {
      id: "akureyri-lock-dates",
      label: "Akureyri: lock exact dates + routing (CPH → UK → AEY)",
      notes:
        "Pick exact dates around Easter.\nRouting concept: CPH → (London or Manchester) → Akureyri (AEY).\nDone when: you have confirmed dates and the best routing option saved.",
      idealFinish: "2026-03-05",
      estimatedTime: "30 min",
      links: ["https://www.google.com/travel/flights", "https://www.skyscanner.net"],
    },
    {
      id: "akureyri-pto-plan",
      label: "Akureyri: PTO/work-off plan + request time off",
      notes:
        "Count workdays affected. Decide PTO vs remote vs unpaid.\nDone when: your time off is requested/approved (or pending).",
      idealFinish: "2026-03-07",
      estimatedTime: "20 min",
    },
    {
      id: "akureyri-budget",
      label: "Akureyri: budget estimate (DKK + USD) + spend cap",
      notes:
        "Per person budget target:\n- Flights cap: 3,500–5,000 DKK (≈ $552–$789)\n- Local buffer: 1,000–1,500 DKK (≈ $158–$237)\nTotal cap: 4,500–6,500 DKK (≈ $710–$1,025)\nDone when: cap is agreed + saved.",
      idealFinish: "2026-03-07",
      estimatedTime: "15 min",
    },
    {
      id: "akureyri-book-flights",
      label: "Akureyri: book flights (rule-based)",
      notes:
        "Booking rule:\n- Book no later than 6 weeks before departure\n- OR earlier if you see flights under 4,000 DKK (~$630)\nSave PDFs to shared folder.",
      idealFinish: "2026-03-15",
      estimatedTime: "45 min",
    },
    {
      id: "akureyri-anchor-itinerary",
      label: "Akureyri: create anchor itinerary (3 anchors)",
      notes:
        "Create 3 anchors:\n1) One family day plan\n2) One nature/outdoor moment\n3) One food/cafe/ritual\nDone when: you have anchors + rough times.",
      idealFinish: "2026-03-20",
      estimatedTime: "20 min",
    },
    {
      id: "akureyri-ig-post",
      label: "Akureyri: IG post within 72 hours after trip",
      notes:
        "Minimum content: 6 photos + 2 short videos.\nPost: 1 carousel + 3–5 stories.\nDone when posted within 72h of returning.",
      idealFinish: "2026-04-12",
      estimatedTime: "45 min",
    },

    // =========================
    // TRIP 2: APRIL — NYC (Gaga Apr 13) + CPH birthday (Apr 16)
    // =========================

    {
      id: "april-lock-itinerary",
      label: "April: lock NYC + CPH date blocks + travel days",
      notes:
        "Confirm the exact window (e.g. Apr 10–22) and split days:\n- NYC days (centered around Apr 13 show)\n- CPH days (centered around Apr 16 birthday)\nDone when: exact dates are locked for both of you.",
      idealFinish: "2026-03-02",
      estimatedTime: "45 min",
    },
    {
      id: "april-pto-plan",
      label: "April: PTO/work-off plan (both of you) + request time off",
      notes:
        "Make a PTO table:\n- Workdays missed\n- PTO available\n- Remote days possible\n- Unpaid days (if any)\nDone when: requests submitted/approved (or pending).",
      idealFinish: "2026-03-05",
      estimatedTime: "45 min",
    },
    {
      id: "april-budget",
      label: "April: budget estimate (DKK + USD) + spend cap",
      notes:
        "Two-person total cap (NYC + CPH combined):\n- Low: 26,000 DKK (≈ $4,101)\n- High: 38,000 DKK (≈ $5,993)\nBuckets: flights (both), NYC hotel, tickets, transport, food, CPH going-out.\nDone when: cap + split method is agreed (50/50 or per-item).",
      idealFinish: "2026-03-08",
      estimatedTime: "45 min",
    },
    {
      id: "gaga-ticket-plan",
      label: "NYC: Gaga tickets strategy + max price",
      notes:
        "Set rules:\n- Target per ticket: 1,600–2,200 DKK (≈ $252–$347)\n- Absolute max per ticket: 2,500 DKK (≈ $394)\nCheck 2–3x/week; daily in final 10 days.\nDone when: max price is agreed + who buys is decided.",
      idealFinish: "2026-03-02",
      estimatedTime: "15 min",
      links: ["https://www.ticketmaster.com/lady-gaga-the-mayhem-ball-new-york-new-york-04-13-2026/event/3B006323A18E103B"],
    },
    {
      id: "april-book-flights",
      label: "April: book flights (NYC + CPH routing)",
      notes:
        "Booking rule:\n- Book by Mar 20\n- OR earlier if prices are under your caps\nSave PDFs + add to calendar.",
      idealFinish: "2026-03-20",
      estimatedTime: "60–90 min",
      links: ["https://www.google.com/travel/flights", "https://www.skyscanner.net"],
    },
    {
      id: "nyc-book-hotel",
      label: "NYC: book hotel (cheap-but-nice rule)",
      notes:
        "Hotel rules:\n- Private room\n- Review target: 7.5+ (or 8.0+)\n- Near subway\nBudget cap (NYC hotel total): 9,000–13,000 DKK (≈ $1,420–$2,051)\nBooking rule: book by Mar 22, prefer free cancellation if close in price.",
      idealFinish: "2026-03-22",
      estimatedTime: "45 min",
      links: ["https://www.booking.com", "https://www.airbnb.com"],
    },
    {
      id: "april-anchor-itinerary",
      label: "April: create anchor itinerary (NYC + CPH)",
      notes:
        "NYC anchors (3):\n1) Gaga show day plan\n2) One iconic first-time NYC day (Central Park/Times Square/etc.)\n3) One 'food + neighborhood' day\n\nCPH anchors (3):\n1) Birthday dinner\n2) One night out with friends\n3) One cozy day activity\nDone when: anchors are chosen + rough schedule exists.",
      idealFinish: "2026-03-28",
      estimatedTime: "45 min",
    },
    {
      id: "april-ig-post",
      label: "April: IG posts within 72 hours after trip",
      notes:
        "Minimum content:\n- NYC: 8 photos + 3 videos\n- CPH: 6 photos + 2 videos\nPost: 1 NYC carousel + 1 birthday carousel + 5–10 stories across the week.",
      idealFinish: "2026-04-30",
      estimatedTime: "60–90 min",
    },

    // =========================
    // TRIP 3: JUNE — WISCONSIN (maybe)
    // =========================

    {
      id: "wisconsin-lock-window",
      label: "Wisconsin: lock tentative window + routing (CPH ↔ MKE/ORD)",
      notes:
        "Pick 1–2 windows in June. Done when you have a tentative window and route saved.",
      idealFinish: "2026-04-20",
      estimatedTime: "20 min",
      links: ["https://www.google.com/travel/flights"],
    },
    {
      id: "wisconsin-pto-plan",
      label: "Wisconsin: PTO/work-off plan",
      notes:
        "Estimate workdays missed and whether remote days are possible.\nDone when: you know how many PTO days it costs.",
      idealFinish: "2026-04-25",
      estimatedTime: "15 min",
    },
    {
      id: "wisconsin-budget",
      label: "Wisconsin: budget estimate (DKK + USD) + spend cap",
      notes:
        "Per person placeholder cap:\n- Flights: 4,500–7,000 DKK (≈ $710–$1,104)\n- Total: 6,000–9,000 DKK (≈ $946–$1,420)\nDone when: go/no-go is decided based on April spend + PTO.",
      idealFinish: "2026-04-25",
      estimatedTime: "15 min",
    },
    {
      id: "wisconsin-booking",
      label: "Wisconsin: book flights + stay (if go)",
      notes:
        "Booking rule:\n- Book by May 5\n- Or earlier if flights hit cap\nDone when flights + accommodation are booked.",
      idealFinish: "2026-05-05",
      estimatedTime: "60 min",
      links: ["https://www.google.com/travel/flights", "https://www.booking.com"],
    },
    {
      id: "wisconsin-anchor-itinerary",
      label: "Wisconsin: create anchor itinerary (3 anchors)",
      notes:
        "3 anchors:\n1) One family/social anchor\n2) One local experience/outing\n3) One rest/slow day\nDone when: anchors exist.",
      idealFinish: "2026-05-20",
      estimatedTime: "20 min",
    },
    {
      id: "wisconsin-ig-post",
      label: "Wisconsin: IG post within 72 hours after trip",
      notes:
        "Minimum: 6 photos + 2 videos.\nPost: 1 carousel + stories.",
      idealFinish: "2026-06-30",
      estimatedTime: "45 min",
    },

    // =========================
    // AUGUST — Iceland trip + Copenhagen trip
    // =========================

    {
      id: "august-iceland-lock",
      label: "August Iceland: lock dates + routing",
      notes:
        "Confirm exact dates and routing.\nDone when: dates are locked.",
      idealFinish: "2026-05-30",
      estimatedTime: "20 min",
      links: ["https://www.google.com/travel/flights"],
    },
    {
      id: "august-iceland-pto-plan",
      label: "August Iceland: PTO/work-off plan",
      notes:
        "Plan PTO early. Done when request is submitted.",
      idealFinish: "2026-06-05",
      estimatedTime: "15 min",
    },
    {
      id: "august-iceland-budget",
      label: "August Iceland: budget estimate (DKK + USD) + spend cap",
      notes:
        "Per person placeholder cap:\n- Total: 6,000–10,000 DKK (≈ $946–$1,577)\nBuckets: flights, lodging, food, activities, transport.\nDone when: cap is set.",
      idealFinish: "2026-06-05",
      estimatedTime: "20 min",
    },
    {
      id: "august-iceland-bookings",
      label: "August Iceland: book flights + lodging",
      notes:
        "Booking rules:\n- Flights by Jun 15\n- Lodging by Jun 30\nDone when booked + saved to shared folder.",
      idealFinish: "2026-06-30",
      estimatedTime: "2 hours",
      links: ["https://www.google.com/travel/flights", "https://www.booking.com"],
    },
    {
      id: "august-iceland-anchor-itinerary",
      label: "August Iceland: create anchor itinerary (3 anchors)",
      notes:
        "3 anchors:\n1) One must-do nature day\n2) One city/food day\n3) One flexible/rest day\nDone when: anchors exist.",
      idealFinish: "2026-07-10",
      estimatedTime: "30 min",
    },
    {
      id: "august-iceland-ig-post",
      label: "August Iceland: IG post within 72 hours after trip",
      notes:
        "Minimum: 8 photos + 3 videos.\nPost: 1 carousel + stories.",
      idealFinish: "2026-08-31",
      estimatedTime: "60 min",
    },

    {
      id: "august-cph-lock",
      label: "August Copenhagen: lock dates + plan",
      notes:
        "Confirm what this trip is (visitors/events/weekend plans) and lock dates.",
      idealFinish: "2026-06-20",
      estimatedTime: "20 min",
    },
    {
      id: "august-cph-pto-plan",
      label: "August Copenhagen: PTO/work-off plan (if needed)",
      notes:
        "If this involves taking days off, plan and request PTO.",
      idealFinish: "2026-06-25",
      estimatedTime: "15 min",
    },
    {
      id: "august-cph-budget",
      label: "August Copenhagen: budget estimate (DKK + USD)",
      notes:
        "Budget placeholder:\n- Total: 3,000–6,000 DKK (≈ $473–$946)\nBuckets: going out, restaurants, activities, transport.\nDone when: cap is set.",
      idealFinish: "2026-07-15",
      estimatedTime: "20 min",
    },
    {
      id: "august-cph-anchor-itinerary",
      label: "August Copenhagen: create anchor itinerary (3 anchors)",
      notes:
        "3 anchors:\n1) One special dinner\n2) One social night\n3) One daytime activity\nDone when: anchors exist.",
      idealFinish: "2026-07-20",
      estimatedTime: "20 min",
    },
    {
      id: "august-cph-ig-post",
      label: "August Copenhagen: IG post within 72 hours",
      notes:
        "Minimum: 6 photos + 2 videos.\nPost: 1 carousel + stories.",
      idealFinish: "2026-08-31",
      estimatedTime: "45 min",
    },

    // =========================
    // FALL — LA (optional)
    // =========================

    {
      id: "fall-la-lock-window",
      label: "Fall LA: pick a travel window + routing",
      notes:
        "Pick a 2–3 week window in Sep/Oct/Nov.\nDone when: window is chosen and trackers are set.",
      idealFinish: "2026-08-15",
      estimatedTime: "30 min",
      links: ["https://www.google.com/travel/flights", "https://www.google.com/travel/flights/saves"],
    },
    {
      id: "fall-la-pto-plan",
      label: "Fall LA: PTO/work-off plan",
      notes:
        "Estimate PTO requirement and request time off early if needed.",
      idealFinish: "2026-08-25",
      estimatedTime: "20 min",
    },
    {
      id: "fall-la-budget",
      label: "Fall LA: budget estimate (DKK + USD) + spend cap",
      notes:
        "Per person placeholder cap:\n- Flights: 5,000–8,000 DKK (≈ $789–$1,262)\n- Total: 10,000–16,000 DKK (≈ $1,577–$2,524)\nDone when: cap is set.",
      idealFinish: "2026-08-25",
      estimatedTime: "20 min",
    },
    {
      id: "fall-la-booking",
      label: "Fall LA: book flights + stay (if go)",
      notes:
        "Booking rule:\n- Book when under cap OR 8 weeks out.\nDone when booked + saved.",
      idealFinish: "2026-09-15",
      estimatedTime: "60–90 min",
      links: ["https://www.google.com/travel/flights", "https://www.booking.com"],
    },
    {
      id: "fall-la-anchor-itinerary",
      label: "Fall LA: create anchor itinerary (3 anchors)",
      notes:
        "3 anchors:\n1) One beach/sunset day\n2) One food/neighborhood day\n3) One hike/outdoor day\nDone when: anchors exist.",
      idealFinish: "2026-09-25",
      estimatedTime: "30 min",
    },
    {
      id: "fall-la-ig-post",
      label: "Fall LA: IG post within 72 hours after trip",
      notes:
        "Minimum: 8 photos + 3 videos.\nPost: 1 carousel + stories.",
      idealFinish: "2026-11-30",
      estimatedTime: "60 min",
    },
  ],
};