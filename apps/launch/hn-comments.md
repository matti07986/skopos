# Skopos — Show HN Launch Kit

> **Status**: WIP — sezioni TODO da riempire prima del go-live.
> **Last updated**: 2026-06-25
> **Target window**: Tue/Wed/Thu, 17:00–19:00 Italian time = 11:00–13:00 EST
>   (when US devs are starting the day and EU is still active)

---

## 0. Pre-flight (T-24h)

- [ ] HN account warmed up with 2-3 substantive comments in unrelated threads
  (avoids "first post = Show HN" red flag)
- [ ] All embedded screenshots tested in incognito mode
- [ ] `skopos.ink` landing page tested on mobile + desktop
- [ ] Signup flow tested end-to-end (incognito → demo project → first log)
- [ ] Rate limits verified one more time (load test passed 2026-06-25)
- [ ] Server monitoring set up so you can watch CPU/errors live during launch
- [ ] Personal API key rotated (the one exposed in chat history)

---

## 1. Title

> **DECIDED** (2026-06-25)
Char count: 72 / 80. OK.

Frame: "AI-first vs AI bolted-on". The "not just docs" phrase
sets up the differentiation in the title itself — readers who scroll
past it without clicking have already absorbed the positioning.

Rejected alternatives:
- *Claude monitors my prod logs and tells me what broke* — too result-y,
  reads like marketing copy
- *AI-first log monitoring (not an LLM on top of Datadog)* — picks a
  fight with named competitor in the title; bad form
- *I gave Claude access to my production logs* — sober but loses the
  differentiation hook

---

## 2. Body

> **DRAFT v1** (2026-06-25) — pending final review before submit
**Design notes:**
- Char count: ~2,200 / 360 words — well under typical Show HN length
- Zero marketing fluff terms ("AI-powered", "revolutionary", "next-gen")
- Concrete technical signal: percentile_cont, cache_control:ephemeral,
  Redis streams — proves real building, not just LLM wrapping
- The "doesn't do" paragraph is the credibility anchor: pre-empts
  the "yet another AI wrapper" criticism by naming limits first
- Closing question is honest, not defensive — gives critics a polite
  way in instead of a target to attack

---

## 3. Seed comments

Purpose: pre-empt the most common objections by surfacing them yourself
in a top-level comment. Looks confident, not defensive.

Post timing:
- T+90s: Seed #1 (cost breakdown) — economic skeptics comment fast
- T+5min: Seed #2 (50-logs rationale) — first wave of technical readers

### Seed #1 — Cost breakdown

Drop ~90s after submission. Pre-empts "how do the unit economics work?"
Why this works: concedes the natural question, gives specific numbers
(signal of real building), uses API-specific terms (cache_control:
ephemeral) that aren't fakeable without hands-on experience.

### Seed #2 — Why 50 logs not 500

Drop ~5min after submission. Pre-empts the "context window" question.
Why this works: shows you experimented (didn't pick 50 at random),
proves product-thinking (not just slapping LLM on logs), and closes
with an invitation to discuss — generates conversation, which is the
signal HN's ranking algorithm rewards.

---

## 4. Ready-to-paste responses

### 4.1 "Why not just Claude.ai + copy-paste?"

**This is THE objection.** Will land in the first 3 comments.
Stay calm, honest, and short — long-winded answers look defensive.
Alternative candidates to consider:
- *Show HN: Skopos – Claude monitors my prod logs and tells me what broke*
- *Show HN: Skopos – AI-first log monitoring (not an LLM on top of Datadog)*
- *Show HN: Skopos – I gave Claude access to my production logs*

Rules to apply:
- Max 80 chars
- "Show HN:" prefix mandatory
- One concrete claim, no marketing fluff
- Avoid "AI-powered" / "revolutionary" / "next-gen"

---

## 2. Body

> **DRAFT v1** (2026-06-25) — pending final review before submit
**Design notes:**
- Char count: ~2,200 / 360 words — well under typical Show HN length
- Zero marketing fluff terms ("AI-powered", "revolutionary", "next-gen")
- Concrete technical signal: percentile_cont, cache_control:ephemeral,
  Redis streams — proves real building, not just LLM wrapping
- The "doesn't do" paragraph is the credibility anchor: pre-empts
  the "yet another AI wrapper" criticism by naming limits first
- Closing question is honest, not defensive — gives critics a polite
  way in instead of a target to attack

---

## 3. Seed comments

Purpose: pre-empt the most common objections by surfacing them yourself
in a top-level comment. Looks confident, not defensive.

Candidates to write:
- [ ] "Why only 50 logs at a time?" + cost breakdown (~$0.038/msg)
- [ ] Something else? (decide in session)

---

## 4. Ready-to-paste responses

### 4.1 "Why not just Claude.ai + copy-paste?"

**This is THE objection.** Will land in the first 3 comments.
Stay calm, honest, and short — long-winded answers look defensive.
Why this works:
- Concedes the obvious ("if you have 30 lines, Claude.ai is fine")
- Pivots to 3 categorical differences (volume, baseline, proactivity)
- Pre-empts the "wrapper" accusation explicitly
- Closes with framing, not features

### 4.2 "How is this different from Sentry/Datadog?"
Why this works: "Different category" disarms the head-to-head frame.
"You'd reasonably run both" removes the zero-sum pressure.

### 4.3 "Where are my logs stored? GDPR? Training data?"
Why this works: admitting the missing piece (DPA template) before
they notice is the strongest credibility signal. EU residency +
Anthropic commercial terms are the two concrete facts.

### 4.4 "Is this open source?"
Why this works: OSS SDK is an honest middle ground. The last sentence
is sharp but HN-aligned — they appreciate clarity over please-everyone.

### 4.5 "What happens when the AI is wrong?"
Why this works: "LLM not in alert path" is the strongest categorical
reassurance. Difference between "AI is the critical system" and "AI
is the explanation layer on a critical system that already works".

### 4.6 "Pricing seems steep for a hobby project"
Why this works: "you can DIY if my price doesn't work" removes the
"you're gouging me" frame. HN appreciates founders who don't defend
pricing through clenched teeth.

---

## 5. Posture notes

**Print these and tape them to the monitor during launch.** When
adrenaline is high, the default reaction is the wrong one.

### Tone rules

1. **Concede before pivoting.** Every reply starts with "fair question"
   or "honest answer". If you skip this, you sound defensive even when
   you're right.
2. **Use "I", not "we".** You're a solo founder. "We" sounds like you're
   hiding behind a fake team. "I" is more credible on HN.
3. **Specific over abstract.** "Each chat costs $0.038" beats "very
   affordable" every single time.
4. **Admit unknowns immediately.** "I don't know yet" is a better
   answer than vague hand-waving. HN respects intellectual honesty
   more than confident wrongness.

### Response speed

- **First 2 hours**: reply to every top-level comment within 15 minutes.
  HN ranking weighs early engagement heavily — silence kills momentum.
- **Hours 2–6**: reply within 30 minutes. Mostly batch-replies now.
- **After 6 hours**: when you can, but the engagement curve has settled.

### Things to never do

- ❌ Argue with downvotes. Move on. Community will defend you if the
  point was good; if not, you wouldn't have won anyway.
- ❌ Edit a comment to "win" an argument after the fact. Visible edits
  look weak.
- ❌ Reply to trolls in their tone. Stay neutral or use dry humor;
  never match aggression.
- ❌ Use marketing language: "disrupting", "next-gen", "AI-powered",
  "10x", "revolutionary", "game-changing", "leverage".
- ❌ Compare yourself favorably to named competitors unprompted. If
  someone brings up Datadog, fine. Don't preemptively trash them.
- ❌ Talk about "your journey" or "the mission". Talk about the
  product and the technical decisions.

### When you don't know an answer

Use this template — works whether the question is hostile or curious:
This turns a weakness (you don't know) into a strength (you're
genuinely curious and willing to learn from the asker).

---

## 6. Day-of-launch runbook

### T-24h (the day before)

- [ ] All pre-flight items from section 0 are checked
- [ ] Sleep early — you'll want full focus tomorrow
- [ ] Phone on silent except for HN notifications

### T-2h

- [ ] Final infrastructure smoke test (`curl https://api.skopos.ink/health`)
- [ ] Confirm Anthropic API key has budget (~$50 buffer minimum)
- [ ] Open these tabs and keep them open:
  - HN submit page (don't submit yet)
  - Skopos dashboard (live monitoring)
  - `tail -f` on production logs in a terminal
  - `htop` or `docker stats --no-stream` for resource monitoring
- [ ] Open this file (`hn-comments.md`) in a separate window for
  copy-paste access to seed comments and responses

### T-30min

- [ ] Re-read the title and body draft one final time
- [ ] Refresh the HN submit page (avoid stale CSRF tokens)
- [ ] Make coffee/tea, water bottle on desk

### T-0 — Submit

- [ ] Paste title and body, hit submit
- [ ] Open the submission URL immediately in a second tab
- [ ] Start a stopwatch (literally — you need to track post-submission
  timing for the seed comments)

### T+90s — Seed #1 (cost breakdown)

- [ ] Copy seed #1 from section 3.1 above, paste as top-level comment
- [ ] Do NOT preface with "Hi everyone!" or similar — straight in

### T+5min — Seed #2 (50-logs rationale)

- [ ] Copy seed #2 from section 3.2 above, paste as top-level comment

### T+10min to T+2h — The critical window

- [ ] Refresh the post page every 60s
- [ ] Reply to every top-level comment within 15 minutes
- [ ] Use ready-to-paste responses from section 4 when they fit;
  customize the opening sentence to the specific commenter's wording
  (avoid looking copy-pasted)
- [ ] If you get a question NOT covered in section 4, take 60 seconds
  to think before replying — first instinct under pressure is usually
  too defensive

### T+2h checkpoint

- [ ] Check rank: is the post on the front page? On /show?
- [ ] Server health check (errors, CPU, DB pool)
- [ ] If signups are happening, monitor onboarding funnel for breakage
- [ ] Stretch, eat something, drink water

### T+6h checkpoint

- [ ] Engagement curve usually flattens here
- [ ] Switch to batch-replying every 30-60 minutes
- [ ] Note any unexpected user behaviors / bugs surfaced

### T+24h — Post-mortem

- [ ] Final ranking and time on front page
- [ ] Total signups, total active users, conversion to trial
- [ ] Best and worst comments (save them — useful for future content)
- [ ] One-paragraph self-review: what worked, what bombed, what to
  change for Product Hunt launch
- [ ] Sleep

