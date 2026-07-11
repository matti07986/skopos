# Skopos — Video Walkthrough Script

**Target duration:** 60–90 seconds
**Recording tool:** Loom (free tier is enough), OBS, or QuickTime + screen recording
**Style:** Talking head + screen recording combined (Loom does both automatically)
**Tone:** Calm, technical, no marketing voice. You're showing a portfolio project, not selling.

---

## Setup before recording

1. **Login to Skopos** with your admin account so you skip the pre-launch middleware
2. **Have the dashboard open** in a browser tab (Firefox looks cleaner than Chrome for demos)
3. **Prepare 2 browser tabs:** dashboard + GitHub repo
4. **Close notification apps** (mail, slack) so nothing pops up during recording
5. **Quiet room** — background noise kills perceived quality

---

## Script (approximately 90 seconds)

### 00:00–00:10 — Intro (10 sec)

> "Hi, I'm Mattia. This is Skopos — a log monitoring platform I built as a
> portfolio project while finishing university. Let me show you what it does."

**On screen:** Camera on your face + Skopos dashboard in background

---

### 00:10–00:30 — What you see (20 sec)

**Switch to full screen dashboard.**

> "Skopos ingests logs from any application through a small SDK. When errors
> happen, they get grouped into patterns automatically — you don't see 500
> raw log lines, you see one line per unique error."

**On screen:** Show the main dashboard with patterns list. Point at:
- Real-time metrics (errors/warnings counters)
- Recent patterns list
- Uptime chart

---

### 00:30–00:50 — The AI insight (20 sec)

**Click into a pattern to open detail view.**

> "For each pattern, Skopos asks Claude to analyze it once and give a probable
> root cause. It's cached — so if the same error happens a thousand times,
> we only pay for one AI call. And the raw logs are always there to verify."

**On screen:** Show:
- Pattern detail page
- AI insight with confidence score
- Raw logs below the insight (proves AI didn't hallucinate)

---

### 00:50–01:10 — The engineering (20 sec)

**Switch to GitHub repo in the other tab.**

> "The full source is on GitHub. Under the hood it's FastAPI plus Postgres
> plus Redis streams, running on a small Hetzner box. I load-tested it at
> two thousand events per second with zero errors. All the details are in
> the README."

**On screen:**
- github.com/matti07986/skopos
- Scroll to "Engineering highlights" section of README
- Highlight the 2,140 eps number

---

### 01:10–01:30 — Close (20 sec)

**Back to camera on your face.**

> "It's not commercial — I'm not accepting paying users. But the code is
> open, the demo is available on request, and I'd love to hear from you if
> you're building something similar or hiring. Links are in the description.
> Thanks for watching."

**On screen:** Camera + call to action overlay (Loom lets you add clickable buttons at end)

---

## Recording tips

- **Do 3–5 takes**. Your first attempt will feel awkward. By take 3 you sound natural.
- **Speak 15% slower than you think you should.** Nervous people rush.
- **Look at the camera lens**, not at yourself on screen.
- **Don't edit heavily** — Loom's basic trim (start/end) is enough. Over-editing looks amateur.
- **Loom's face bubble** is fine; don't disable it. Face + screen is more engaging than screen alone.

## After recording

1. **Copy the Loom URL** (format: `https://www.loom.com/share/XXXXX`)
2. **Update the video URL in the landing page:**
```bash
   # Edit apps/web/app/page.tsx, line ~15
   # Change:
   const VIDEO_URL: string | null = null;
   # To (using the embed format):
   const VIDEO_URL: string | null = "https://www.loom.com/embed/XXXXX";
```
3. **Commit + push:**
```bash
   git add apps/web/app/page.tsx
   git commit -m "feat(landing): add walkthrough video"
   git push origin main
```

Vercel auto-deploys in ~60 seconds. Your video appears on skopos.ink.

---

## Alternative: static screenshots (if you never record the video)

If a week from now you still haven't recorded, that's a signal you probably
won't. Fall back to a screenshot grid — takes 5 minutes and looks fine:

1. Screenshot 4 key views:
   - Dashboard overview
   - Pattern list
   - AI insight detail
   - Alert rules page
2. Replace the video section in page.tsx with a 2x2 grid of these images
3. Add a caption: "The dashboard, in four screenshots."

Better done than perfect.
