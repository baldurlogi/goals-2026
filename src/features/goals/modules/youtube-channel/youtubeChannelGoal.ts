import type { GoalDefinition } from "../../goalTypes";

export const youtubeChannelGoal: GoalDefinition = {
  id: "youtube-channel",
  title: "Launch YouTube Channel",
  subtitle: "Build a consistent upload system (1 video every 3–4 weeks)",
  emoji: "🎥",
  priority: "medium",

  /**
   * Strategy:
   * - Keep it simple: one repeatable format + pipeline
   * - Publish every ~4 weeks (quality > volume)
   * - Improve 1% per upload with a post-video review
   */

  steps: [
    // =========================
    // PHASE 0: Setup (Week 1–2)
    // =========================
    {
      id: "channel-positioning",
      label: "Define channel positioning + 3 content pillars",
      notes:
        "Pick 3 pillars you can make forever:\n1) Day in my life / Copenhagen + software engineer\n2) Tech setup + productivity (Mac/iPhone/apps)\n3) Self-improvement systems (goals, fitness, reading)\n\nDone when: you have 1–2 sentence channel description + the 3 pillars written.",
      idealFinish: "2026-03-05",
      estimatedTime: "30 min",
    },
    {
      id: "decide-editing-owner",
      label: "Decide: who edits + who does thumbnails (you vs roommates)",
      notes:
        "Decide roles:\n- Option A: you edit + you thumbnail\n- Option B: you edit, roommates help with thumbnails\n- Option C: roommates help with editing + thumbnails\n\nDone when: roles are decided and you know the workflow for file sharing + feedback.",
      idealFinish: "2026-03-07",
      estimatedTime: "20 min",
    },
    {
      id: "gear-and-software-setup",
      label: "Set up gear + editing workflow (minimal, reliable)",
      notes:
        "Confirm:\n- Camera: iPhone is fine\n- Mic: lav mic or small shotgun (optional but huge upgrade)\n- Lighting: desk lamp / ring light (optional)\n- Editing: CapCut / Final Cut / Premiere (pick one)\n- Thumbnails: Canva/Figma/Photoshop (pick one)\n\nDone when: you can import clips, edit, export, and upload a private test video.",
      idealFinish: "2026-03-12",
      estimatedTime: "2 hours",
    },
    {
      id: "brand-kit-lite",
      label: "Create a simple brand kit (so thumbnails look consistent)",
      notes:
        "Define:\n- 1–2 fonts\n- 2 colors\n- Thumbnail layout template (face + 3–5 words max)\n- Title style (short, specific)\n\nDone when: you have 1 thumbnail template ready to reuse.",
      idealFinish: "2026-03-15",
      estimatedTime: "60–90 min",
      links: ["https://www.canva.com"],
    },
    {
      id: "asset-pack",
      label: "Create an asset pack (b-roll + music + sound effects)",
      notes:
        "Make a folder with:\n- 10–20 b-roll clips (street, desk, coffee, keyboard, gym)\n- 3–5 music tracks you’re allowed to use\n- 5–10 sound effects\n\nDone when: folder exists and is easy to reuse for every video.",
      idealFinish: "2026-03-20",
      estimatedTime: "2–3 hours",
    },

    // =========================
    // IDEA SYSTEM (small batches, repeated)
    // =========================
    {
      id: "idea-batch-1",
      label: "Brainstorm 3–4 video ideas (batch 1)",
      notes:
        "Only 3–4 ideas. Keep them aligned with pillars.\nExamples:\n- Day in my life as a software engineer in Copenhagen\n- My Mac/iPhone productivity setup + apps\n- How I track goals (fitness/reading) with my own app\n\nDone when: you have 3–4 ideas + 1 is selected as Video #1.",
      idealFinish: "2026-03-08",
      estimatedTime: "30–45 min",
    },

    // =========================
    // VIDEO PIPELINE TEMPLATE (repeat per upload)
    // =========================
    {
      id: "video-1-outline",
      label: "Video #1: Outline + hook + shot list",
      notes:
        "Create:\n- Hook (first 10 seconds)\n- 5–8 bullet outline\n- Shot list (A-roll + B-roll)\n- Props/locations needed\n\nDone when: you could film from this outline without thinking.",
      idealFinish: "2026-03-16",
      estimatedTime: "45–60 min",
    },
    {
      id: "video-1-film",
      label: "Video #1: Film (A-roll + B-roll)",
      notes:
        "Film in 1–2 sessions.\nRule: capture extra B-roll.\nDone when: all required clips are recorded and backed up.",
      idealFinish: "2026-03-23",
      estimatedTime: "2–4 hours",
    },
    {
      id: "video-1-edit",
      label: "Video #1: Edit (rough cut → final cut)",
      notes:
        "Workflow:\n1) Rough cut (structure)\n2) Tighten pacing\n3) Add b-roll + captions if needed\n4) Audio cleanup\n5) Export\n\nDone when: final export is ready for upload.",
      idealFinish: "2026-03-30",
      estimatedTime: "4–8 hours",
    },
    {
      id: "video-1-thumbnail-title",
      label: "Video #1: Thumbnail + title finalized",
      notes:
        "Make 2 thumbnail versions and pick the best.\nTitle rules: short + specific + promise.\nDone when: thumbnail (1280x720) + final title are ready.",
      idealFinish: "2026-04-01",
      estimatedTime: "60–90 min",
    },
    {
      id: "video-1-publish",
      label: "Video #1: Publish + share",
      notes:
        "Upload with:\n- Description (2–4 lines)\n- Chapters (optional)\n- Tags (minimal)\n- Pinned comment (CTA)\nShare on IG story.\nDone when: video is public.",
      idealFinish: "2026-04-03",
      estimatedTime: "45–60 min",
    },
    {
      id: "video-1-review",
      label: "Video #1: Post-publish review (what to improve next time)",
      notes:
        "48–72 hours after posting:\n- Review retention graph + CTR\n- Note 3 improvements for next video\n- Save top comments ideas\nDone when: 3 improvements are written down.",
      idealFinish: "2026-04-06",
      estimatedTime: "20 min",
    },

    // =========================
    // REPEATABLE CADENCE: 1 video every 3–4 weeks
    // =========================
    {
      id: "idea-batch-2",
      label: "Brainstorm 3–4 video ideas (batch 2)",
      notes:
        "Pick Video #2 from these ideas. Keep it simple and filmable.",
      idealFinish: "2026-04-10",
      estimatedTime: "30 min",
    },
    // =========================
    // VIDEO #2 PIPELINE
    // =========================
    {
    id: "video-2-outline",
    label: "Video #2: Outline + hook + shot list",
    notes:
        "Create:\n- Hook (first 10 seconds)\n- 5–8 bullet outline\n- Shot list (A-roll + B-roll)\n- Props/locations needed\n\nDone when: you could film from this outline without thinking.",
    idealFinish: "2026-04-13",
    estimatedTime: "45–60 min",
    },
    {
    id: "video-2-film",
    label: "Video #2: Film (A-roll + B-roll)",
    notes:
        "Film in 1–2 sessions.\nRule: capture extra B-roll.\nDone when: all required clips are recorded and backed up.",
    idealFinish: "2026-04-20",
    estimatedTime: "2–4 hours",
    },
    {
    id: "video-2-edit",
    label: "Video #2: Edit (rough cut → final cut)",
    notes:
        "Workflow:\n1) Rough cut (structure)\n2) Tighten pacing\n3) Add b-roll + captions if needed\n4) Audio cleanup\n5) Export\n\nDone when: final export is ready for upload.",
    idealFinish: "2026-04-27",
    estimatedTime: "4–8 hours",
    },
    {
    id: "video-2-thumbnail-title",
    label: "Video #2: Thumbnail + title finalized",
    notes:
        "Make 2 thumbnail versions and pick the best.\nTitle rules: short + specific + promise.\nDone when: thumbnail (1280x720) + final title are ready.",
    idealFinish: "2026-04-29",
    estimatedTime: "60–90 min",
    },
    {
    id: "video-2-publish",
    label: "Video #2: Publish + share",
    notes:
        "Upload with:\n- Description (2–4 lines)\n- Chapters (optional)\n- Tags (minimal)\n- Pinned comment (CTA)\nShare on IG story.\nDone when: video is public.",
    idealFinish: "2026-05-01",
    estimatedTime: "45–60 min",
    },
    {
    id: "video-2-review",
    label: "Video #2: Post-publish review (what to improve next time)",
    notes:
        "48–72 hours after posting:\n- Review retention graph + CTR\n- Note 3 improvements for next video\n- Save top comments ideas\nDone when: 3 improvements are written down.",
    idealFinish: "2026-05-04",
    estimatedTime: "20 min",
    },

    // =========================
    // VIDEO #3 PIPELINE
    // =========================
    {
    id: "video-3-outline",
    label: "Video #3: Outline + hook + shot list",
    notes:
        "Same pipeline as Video #1.\nDone when: hook + outline + shot list are ready.",
    idealFinish: "2026-05-11",
    estimatedTime: "45–60 min",
    },
    {
    id: "video-3-film",
    label: "Video #3: Film (A-roll + B-roll)",
    notes:
        "Film in 1–2 sessions and capture extra B-roll.\nDone when: clips are recorded + backed up.",
    idealFinish: "2026-05-18",
    estimatedTime: "2–4 hours",
    },
    {
    id: "video-3-edit",
    label: "Video #3: Edit (rough cut → final cut)",
    notes:
        "Same editing workflow. Prioritize pacing + audio.\nDone when: export is ready.",
    idealFinish: "2026-05-25",
    estimatedTime: "4–8 hours",
    },
    {
    id: "video-3-thumbnail-title",
    label: "Video #3: Thumbnail + title finalized",
    notes:
        "Make 2 versions. Keep style consistent with brand kit.\nDone when: thumbnail + title are final.",
    idealFinish: "2026-05-27",
    estimatedTime: "60–90 min",
    },
    {
    id: "video-3-publish",
    label: "Video #3: Publish + share",
    notes:
        "Upload + share to IG story.\nDone when public.",
    idealFinish: "2026-05-29",
    estimatedTime: "45–60 min",
    },
    {
    id: "video-3-review",
    label: "Video #3: Post-publish review",
    notes:
        "48–72 hours after posting. Write 3 improvements.\nDone when improvements are written.",
    idealFinish: "2026-06-01",
    estimatedTime: "20 min",
    },

    // =========================
    // VIDEO #4 PIPELINE
    // =========================
    {
    id: "video-4-outline",
    label: "Video #4: Outline + hook + shot list",
    notes:
        "Same pipeline as Video #1.\nDone when: hook + outline + shot list are ready.",
    idealFinish: "2026-06-08",
    estimatedTime: "45–60 min",
    },
    {
    id: "video-4-film",
    label: "Video #4: Film (A-roll + B-roll)",
    notes:
        "Film in 1–2 sessions + extra B-roll.\nDone when recorded + backed up.",
    idealFinish: "2026-06-15",
    estimatedTime: "2–4 hours",
    },
    {
    id: "video-4-edit",
    label: "Video #4: Edit (rough cut → final cut)",
    notes:
        "Same editing workflow.\nDone when export is ready.",
    idealFinish: "2026-06-22",
    estimatedTime: "4–8 hours",
    },
    {
    id: "video-4-thumbnail-title",
    label: "Video #4: Thumbnail + title finalized",
    notes:
        "Make 2 versions and choose best.\nDone when final.",
    idealFinish: "2026-06-24",
    estimatedTime: "60–90 min",
    },
    {
    id: "video-4-publish",
    label: "Video #4: Publish + share",
    notes:
        "Upload + share.\nDone when public.",
    idealFinish: "2026-06-26",
    estimatedTime: "45–60 min",
    },
    {
    id: "video-4-review",
    label: "Video #4: Post-publish review",
    notes:
        "48–72 hours after posting. Write 3 improvements.\nDone when improvements are written.",
    idealFinish: "2026-06-29",
    estimatedTime: "20 min",
    },
    {
      id: "midyear-channel-review",
      label: "Mid-year review: evaluate channel direction + double down",
      notes:
        "Review what performed best and why.\nDecide:\n- Keep pillars or adjust\n- One format to repeat\n- What to stop doing\nDone when: you have a clear plan for the next 3 uploads.",
      idealFinish: "2026-07-01",
      estimatedTime: "45 min",
    },
    {
      id: "year-goal-uploads",
      label: "2026 goal: publish 8–10 videos total",
      notes:
        "Success = consistency.\nIf you publish 8 videos, you win.\nOptional stretch: 10 videos.",
      idealFinish: "2026-12-31",
      estimatedTime: "Ongoing",
    },
  ],
};