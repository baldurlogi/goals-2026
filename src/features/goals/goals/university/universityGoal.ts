import type { GoalDefinition } from "../../goalTypes";


export const universityGoal: GoalDefinition = {
    id: "university-applications",
    title: "US University Applications",
    subtitle: "Apply to 14 top MS programs for Fall 2027",
    emoji: "🎓",
    priority: "high",
    steps: [
        {
            id: "research-programs",
            label: "Research 20 programs, narrow to 14",
            notes: "Focus: CS, AI, Robotics. Check funding, research labs, alumni outcomes. Mix reaches, targets, safeties.",
            idealFinish: "2026-03-15",
            estimatedTime: "10 hours"
        },
        {
            id: "create-application-tracker",
            label: "Create application tracker spreadsheet",
            notes: "Columns: School, Program, Deadline, Fee, TOEFL/GRE required, LOR contacts, Status. Use Google Sheets.",
            idealFinish: "2026-03-20",
            estimatedTime: "1 hour"
        },
        {
            id: "toefl-prep",
            label: "Complete 3 weeks of TOEFL prep",
            notes: "Use ETS official materials + Magoosh. 1 hour/day. Focus on speaking/writing (hardest sections).",
            idealFinish: "2026-04-30",
            estimatedTime: "21 hours",
            links: ["https://ets.org/toefl", "https://magoosh.com"]
        },
        {
            id: "toefl-register",
            label: "Register for TOEFL exam",
            notes: "Book test center in Copenhagen for mid-May. Cost: ~$250 USD. Book 6 weeks in advance.",
            idealFinish: "2026-04-05",
            estimatedTime: "30 min",
            links: ["https://ets.org/toefl"]
        },
        {
            id: "toefl-exam",
            label: "Take TOEFL exam (target 100+)",
            notes: "Arrive early, bring passport, eat breakfast. Reading → Listening → Break → Speaking → Writing. 3.5 hours.",
            idealFinish: "2026-05-20",
            estimatedTime: "4 hours"
        },
        {
            id: "contact-recommenders",
            label: "Email 3 recommenders with materials",
            notes: "1) Mars rover guide (MIT), 2) TA supervisor prof, 3) Current manager. Send: CV, school list, draft SOP, deadline sheet.",
            idealFinish: "2026-04-15",
            estimatedTime: "2 hours"
        },
        {
            id: "gre-prep",
            label: "Complete 6 weeks of GRE prep",
            notes: "Use Gregmat+ ($5/month). 1.5 hrs/day. Focus on Quant (aim 165+). Verbal 155+ is fine for CS programs.",
            idealFinish: "2026-07-01",
            estimatedTime: "63 hours",
            links: ["https://gregmat.com"]
        },
        {
            id: "gre-register",
            label: "Register for GRE exam",
            notes: "Book Copenhagen test center for mid-July. Cost: ~$220 USD. Book 4 weeks in advance.",
            idealFinish: "2026-06-15",
            estimatedTime: "30 min",
            links: ["https://ets.org/gre"]
        },
        {
            id: "gre-exam",
            label: "Take GRE exam (target 165+ Quant, 155+ Verbal)",
            notes: "Bring passport, eat protein breakfast. AWA → Verbal → Quant → Verbal → Quant → Verbal. 4 hours.",
            idealFinish: "2026-07-20",
            estimatedTime: "4.5 hours"
        },
        {
            id: "sop-outline",
            label: "Write SOP outline (all schools)",
            notes: "Structure: Hook → Background → Why grad school → Why this program → Research interests → Career goals → Conclusion.",
            idealFinish: "2026-08-01",
            estimatedTime: "3 hours"
        },
        {
            id: "sop-draft-1",
            label: "Write first complete SOP draft",
            notes: "2 pages, 500-800 words. Tell YOUR story. Highlight Mars rover project, dual degrees, TA experience.",
            idealFinish: "2026-08-15",
            estimatedTime: "8 hours"
        },
        {
            id: "sop-feedback",
            label: "Get feedback on SOP from 3 people",
            notes: "1) Professor, 2) Peer in grad school, 3) r/gradadmissions. Incorporate feedback.",
            idealFinish: "2026-08-31",
            estimatedTime: "4 hours",
            links: ["https://reddit.com/r/gradadmissions"]
        },
        {
            id: "cv-update",
            label: "Update CV to academic format",
            notes: "1-2 pages. Sections: Education, Research, Work, Teaching, Skills, Publications (if any). Use LaTeX or Overleaf.",
            idealFinish: "2026-07-31",
            estimatedTime: "3 hours",
            links: ["https://overleaf.com"]
        },
        {
            id: "request-transcripts",
            label: "Request official transcripts from Reykjavík University",
            notes: "Email registrar. Request 15 copies (1 per school + extras). May take 2-3 weeks. Cost: ~$20 per copy.",
            idealFinish: "2026-09-01",
            estimatedTime: "30 min"
        },
        {
            id: "tailor-sops",
            label: "Tailor SOP for each school (14 versions)",
            notes: "Research specific labs, professors, courses. Customize 1-2 paragraphs per school. Keep authentic.",
            idealFinish: "2026-10-15",
            estimatedTime: "20 hours"
        },
        {
            id: "submit-early-apps",
            label: "Submit 3 early deadline applications",
            notes: "Some schools have Oct 15 - Nov 1 deadlines. Do these first. Double-check everything before submit.",
            idealFinish: "2026-10-31",
            estimatedTime: "6 hours"
        },
        {
            id: "follow-up-recommenders",
            label: "Follow up with recommenders (2 weeks before deadline)",
            notes: "Gentle reminder email. Confirm they've submitted. Thank them profusely.",
            idealFinish: "2026-11-01",
            estimatedTime: "1 hour"
        },
        {
            id: "submit-main-apps",
            label: "Submit 8 main applications",
            notes: "Most deadlines Dec 1 - Dec 15. Upload all materials, pay fees ($75-125 each), submit. Save confirmation emails.",
            idealFinish: "2026-12-01",
            estimatedTime: "10 hours"
        },
        {
            id: "submit-final-apps",
            label: "Submit final 3 applications",
            notes: "Late Dec deadlines. Complete all 14 schools. DONE!",
            idealFinish: "2026-12-15",
            estimatedTime: "4 hours"
        },
        {
            id: "scholarship-apps",
            label: "Apply to 5 external scholarships",
            notes: "Fulbright, AAUW, school-specific fellowships. Research early, tailor applications.",
            idealFinish: "2026-12-31",
            estimatedTime: "15 hours"
        },
        {
            id: "application-budget",
            label: "Budget tracking: ~12,000-18,000 DKK total",
            notes: "TOEFL $250, GRE $220, Apps $1,050-1,750, Transcripts $300. From savings.",
            idealFinish: "ongoing",
            estimatedTime: "ongoing"
        }
    ]
}