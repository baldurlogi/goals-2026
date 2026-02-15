import type { GoalDefinition } from "../../goalTypes";


export const freelanceGoal: GoalDefinition = {
    id: "freelance-saas",
    title: "Freelancing & SaaS Launch",
    subtitle: "Earn side income + build portfolio + launch product",
    emoji: "💼",
    priority: "medium",
    steps: [
        {
            id: "update-portfolio-site",
            label: "Update baldurlogi.com with 'Hire Me' section",
            notes: "Add services, hourly rate (350-500 DKK), past projects, testimonials placeholder, contact form.",
            idealFinish: "2026-02-25",
            estimatedTime: "3 hours",
            links: ["https://baldurlogi.com"]
        },
        {
            id: "create-spec-projects",
            label: "Build 2 spec projects for portfolio",
            notes: "Fake client websites to show range: 1) SaaS landing page, 2) E-commerce store. Use React + TypeScript + Tailwind.",
            idealFinish: "2026-03-10",
            estimatedTime: "16 hours"
        },
        {
            id: "upwork-profile",
            label: "Create and optimize Upwork profile",
            notes: "Professional photo, detailed bio, skills (React, TypeScript, Tailwind), portfolio links. Set rate at 350-400 DKK/hr to start.",
            idealFinish: "2026-03-05",
            estimatedTime: "2 hours",
            links: ["https://upwork.com"]
        },
        {
            id: "fiverr-profile",
            label: "Create Fiverr gigs",
            notes: "3 gigs: 1) Landing page (3,000 DKK), 2) React component (1,500 DKK), 3) Website redesign (5,000 DKK). Good photos + descriptions.",
            idealFinish: "2026-03-05",
            estimatedTime: "2 hours",
            links: ["https://fiverr.com"]
        },
        {
            id: "apply-40-jobs",
            label: "Apply to 40 Upwork jobs (10/week for 4 weeks)",
            notes: "Filter: entry-level, fixed-price $500-1,500. Write custom proposals. Track in spreadsheet.",
            idealFinish: "2026-03-31",
            estimatedTime: "1 hr/day"
        },
        {
            id: "first-client",
            label: "Land first paying client",
            notes: "Deliver excellent work. Ask for testimonial. Under-promise, over-deliver.",
            idealFinish: "2026-04-15",
            estimatedTime: "varies"
        },
        {
            id: "complete-3-projects",
            label: "Complete 3 freelance projects",
            notes: "Build reputation. Get 5-star reviews. Ask for referrals. Total earnings target: 10,000-15,000 DKK.",
            idealFinish: "2026-05-31",
            estimatedTime: "30-40 hrs total"
        },
        {
            id: "saas-idea-validation",
            label: "Identify and validate SaaS idea",
            notes: "Talk to 10 potential users. What do they struggle with? Look for recurring problems from freelance work.",
            idealFinish: "2026-05-31",
            estimatedTime: "8 hours"
        },
        {
            id: "saas-mvp-design",
            label: "Design SaaS MVP (Figma)",
            notes: "Simple, focused on ONE core feature. Max 5 screens. Get feedback from 3 people.",
            idealFinish: "2026-06-15",
            estimatedTime: "10 hours",
            links: ["https://figma.com"]
        },
        {
            id: "saas-mvp-build",
            label: "Build SaaS MVP",
            notes: "Use Next.js, TypeScript, Tailwind, Supabase. 2-week sprint. Ship fast, iterate later.",
            idealFinish: "2026-07-15",
            estimatedTime: "40-60 hours"
        },
        {
            id: "beta-users-10",
            label: "Get 10 beta users",
            notes: "Offer free lifetime access. Get feedback. Iterate quickly. Use ProductHunt 'Ship' page.",
            idealFinish: "2026-08-01",
            estimatedTime: "10 hours",
            links: ["https://producthunt.com/ship"]
        },
        {
            id: "stripe-setup",
            label: "Set up Stripe payments",
            notes: "Create pricing tiers: $10, $20, $30/month. Simple checkout flow.",
            idealFinish: "2026-08-15",
            estimatedTime: "4 hours",
            links: ["https://stripe.com"]
        },
        {
            id: "producthunt-launch",
            label: "Launch on Product Hunt",
            notes: "Schedule for Tuesday 12:01am PST. Prepare social posts, screenshots, demo video. Engage in comments all day.",
            idealFinish: "2026-10-15",
            estimatedTime: "full day",
            links: ["https://producthunt.com"]
        },
        {
            id: "first-paying-customer",
            label: "Get first paying customer",
            notes: "Celebrate! Ask for testimonial. Send personal thank you.",
            idealFinish: "2026-11-01",
            estimatedTime: "ongoing"
        },
        {
            id: "register-business",
            label: "Register Enkeltmandsvirksomhed if earning >50k DKK/year",
            notes: "Do this through Virk.dk when you hit threshold. Takes 10 min. Free registration.",
            idealFinish: "when needed",
            estimatedTime: "30 min",
            links: ["https://virk.dk"]
        }
    ]
}