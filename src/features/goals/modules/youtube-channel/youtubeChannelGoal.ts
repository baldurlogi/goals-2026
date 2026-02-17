import type { GoalDefinition } from "../../goalTypes";


export const youtubeChannelGoal: GoalDefinition = {
    id: "youtube-channel",
    title: "YouTube Channel Launch",
    subtitle: "Post 12-20 videos by end of 2026",
    emoji: "🎥",
    priority: "low",
    steps: [
        {
            id: "youtube-channel-setup",
            label: "Create YouTube channel",
            notes: "Use personal Google account. Channel name: Your name or brand. Professional profile pic.",
            idealFinish: "2026-04-01",
            estimatedTime: "30 min",
            links: ["https://youtube.com"]
        },
        {
            id: "channel-branding",
            label: "Design channel banner + profile",
            notes: "Use Canva. Banner: 2560x1440px. Include: what you do, upload schedule. Consistent colors.",
            idealFinish: "2026-04-05",
            estimatedTime: "2 hours",
            links: ["https://canva.com"]
        },
        {
            id: "brainstorm-20-video-ideas",
            label: "Brainstorm 20 video ideas",
            notes: "Day in life, setup tour, productivity, coding, gym, Copenhagen life, SaaS journey, tips. Write in doc.",
            idealFinish: "2026-04-10",
            estimatedTime: "2 hours"
        },
        {
            id: "study-inspiration-channels",
            label: "Study 3 inspiration channels",
            notes: "Brian Ruiz, Luke Made It, jedcal. Analyze: hooks, pacing, b-roll, storytelling. Take notes.",
            idealFinish: "2026-04-15",
            estimatedTime: "3 hours"
        },
        {
            id: "assess-equipment",
            label: "Assess current equipment",
            notes: "Test roommate's camera, lighting, tripod. Decide what to borrow vs buy. iPhone is fine to start!",
            idealFinish: "2026-04-18",
            estimatedTime: "1 hour"
        },
        {
            id: "buy-microphone",
            label: "Buy RØDE VideoMic GO II",
            notes: "Most important upgrade! Audio > video quality. Budget: 1,000-1,200 DKK.",
            idealFinish: "2026-04-20",
            estimatedTime: "30 min"
        },
        {
            id: "buy-storage-ssd",
            label: "Buy 1TB external SSD",
            notes: "For 4K footage. Samsung T5 or T7. Budget: 1,000-1,500 DKK.",
            idealFinish: "2026-04-22",
            estimatedTime: "30 min"
        },
        {
            id: "learn-davinci-resolve",
            label: "Learn DaVinci Resolve basics",
            notes: "FREE editing software. Watch 2-3 YouTube tutorials. Learn: import, cut, transitions, color, export.",
            idealFinish: "2026-04-25",
            estimatedTime: "4 hours",
            links: ["https://blackmagicdesign.com/products/davinciresolve"]
        },
        {
            id: "script-video-1",
            label: "Script first video: 'Day in My Life as SWE in Copenhagen'",
            notes: "Hook (first 5 sec), intro, morning routine, work, gym, evening. 8-12 min target. Bullet points, not word-for-word.",
            idealFinish: "2026-04-28",
            estimatedTime: "2 hours"
        },
        {
            id: "film-video-1",
            label: "Film first video",
            notes: "Over-film! 3x footage needed. Get b-roll: hands typing, coffee, walking, gym. Speak clearly to camera.",
            idealFinish: "2026-05-05",
            estimatedTime: "8 hours (spread over 2 days)"
        },
        {
            id: "edit-video-1",
            label: "Edit first video",
            notes: "Cut fluff, keep pacing fast. Add music (Epidemic Sound free trial), text overlays, smooth cuts. Export 1080p.",
            idealFinish: "2026-05-12",
            estimatedTime: "6 hours",
            links: ["https://epidemicsound.com"]
        },
        {
            id: "create-thumbnail-1",
            label: "Create thumbnail for video 1",
            notes: "Eye-catching, clear text, expressive face. Use Canva. 1280x720px. Test 3 versions, pick best.",
            idealFinish: "2026-05-14",
            estimatedTime: "1 hour"
        },
        {
            id: "write-video-description-seo",
            label: "Write video description + SEO",
            notes: "150-200 words. Include keywords: software engineer Copenhagen, day in life, tech career. Add timestamps, social links.",
            idealFinish: "2026-05-14",
            estimatedTime: "30 min"
        },
        {
            id: "publish-video-1",
            label: "Publish first video!",
            notes: "Upload, add thumbnail, description, tags. Schedule for Tuesday 3pm CET (good time). Share on LinkedIn, Twitter.",
            idealFinish: "2026-05-15",
            estimatedTime: "1 hour"
        },
        {
            id: "video-2-setup-tour",
            label: "Film & publish video 2: 'My Developer Setup Tour'",
            notes: "Show MacBook, monitor, keyboard, desk, apps. Shorter video (6-8 min). Quick turnaround.",
            idealFinish: "2026-06-01",
            estimatedTime: "8 hours"
        },
        {
            id: "video-3-productivity",
            label: "Film & publish video 3: 'How I Balance Gym + Coding + Side Projects'",
            notes: "Productivity tips, time blocking, tools. Relatable content. Show real calendar.",
            idealFinish: "2026-06-20",
            estimatedTime: "8 hours"
        },
        {
            id: "establish-posting-schedule",
            label: "Establish 1 video every 2-3 weeks schedule",
            notes: "Batch film 2-3 videos in one day. Edit on Sundays. Consistency > perfection.",
            idealFinish: "2026-07-01",
            estimatedTime: "ongoing"
        },
        {
            id: "video-4-to-12",
            label: "Publish videos 4-12",
            notes: "Topics: Iceland vlog, SaaS build log, Copenhagen cafes, What's on my Mac, Half marathon recap, etc. Aim for 12 total by Dec.",
            idealFinish: "2026-12-31",
            estimatedTime: "72 hours total"
        },
        {
            id: "engage-with-comments",
            label: "Reply to all comments within 24 hours",
            notes: "Build community. Ask questions back. Be genuine. This matters more than view count early on.",
            idealFinish: "ongoing",
            estimatedTime: "15 min/day"
        },
        {
            id: "first-100-subscribers",
            label: "Hit 100 subscribers",
            notes: "Share videos on Reddit (r/webdev, r/cscareerquestions), LinkedIn, Twitter. Don't spam, add value.",
            idealFinish: "2026-08-31",
            estimatedTime: "milestone"
        },
        {
            id: "analyze-video-performance",
            label: "Analyze which videos perform best",
            notes: "Check YouTube Analytics. Look at: CTR, avg view duration, traffic sources. Double down on what works.",
            idealFinish: "2026-12-01",
            estimatedTime: "2 hours"
        }
    ]
}