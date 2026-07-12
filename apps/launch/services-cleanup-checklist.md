# Skopos — Services Cleanup Checklist

**Purpose:** Prevent surprise charges from services that were configured
when Skopos was a commercial product but no longer need to be active
now that it's a portfolio-only project.

**Priority:** Check auto-renewal on every service. Cancel or downgrade
services with zero real usage.

---

## Service audit — in order of financial risk

### 1. Hetzner (server) — ~€6/month or ~€72/year

**URL:** https://accounts.hetzner.com/
**Section:** Cloud → Servers → your instance → Billing

**Check:**
- [ ] Is the server on monthly or annual billing?
- [ ] If annual: when does it renew?
- [ ] Is auto-renewal enabled?

**Decision matrix:**
- If already paid annually and 6+ months remain: keep it running for now, decide at renewal
- If monthly: consider spegning it. Landing page can move to Vercel free tier
- If auto-renewal is on and I want to spegning: disable auto-renewal now

---

### 2. Domain skopos.ink — ~€20-30/year (registrar varies)

**Where:** whatever registrar you bought from (probably Cloudflare, Namecheap, or Porkbun based on your setup)

**Check:**
- [ ] Which registrar hosts the domain?
- [ ] When does it renew?
- [ ] Is auto-renewal enabled?

**Decision matrix:**
- If already paid this year: keep it, decide at next renewal (~€25 is nothing for portfolio value)
- If auto-renewal is on: verify billing method is valid (avoid nasty surprise)
- If I want to spegning: disable auto-renewal, let it expire naturally next year

**Note:** If domain expires, the portfolio landing moves to `github.com/matti07986/skopos` or a Vercel free URL. Not a disaster.

---

### 3. Vercel (landing hosting) — free tier

**URL:** https://vercel.com/dashboard → Settings → Billing

**Check:**
- [ ] Am I on Hobby (free) or Pro?
- [ ] Are there any pending upgrades or paid add-ons?

**Decision matrix:**
- If Hobby free: nothing to do, portfolio traffic will never hit paid limits
- If Pro (unlikely): downgrade to Hobby

---

### 4. Resend (email service) — free tier (3,000/mo), then paid

**URL:** https://resend.com/settings/billing

**Check:**
- [ ] Am I on free tier?
- [ ] Are there webhooks/API keys still active that could accidentally trigger email volume?
- [ ] Is my domain (skopos.ink) still verified?

**Decision matrix:**
- If free tier + zero email in last 30 days: safe. Can delete account for peace of mind.
- If any paid plan: downgrade to free
- If I don't need email anymore: delete account and revoke API key

---

### 5. Lemon Squeezy (payment processor) — usually free until you sell

**URL:** https://app.lemonsqueezy.com/settings/billing

**Check:**
- [ ] Am I on the free tier?
- [ ] Are there active products/subscriptions with customers?
- [ ] Any monthly fees currently charged?

**Decision matrix:**
- If free tier, no sales, no customers: safe. Can delete for peace of mind.
- If subscribed to paid plan without active sales: downgrade
- If any customer subscriptions exist (shouldn't, but check): handle carefully — email customers first

---

### 6. Anthropic API (Claude) — pay-per-use, zero if no calls

**URL:** https://console.anthropic.com/settings/billing

**Check:**
- [ ] Current month usage: should be ~zero
- [ ] Is auto-refill of credits enabled? (potential surprise if code accidentally calls API)
- [ ] Are billing limits set?

**Decision matrix:**
- If usage is zero and API key rotated: safe as is
- If auto-refill is on: set a low monthly cap (e.g. $10) as safety net
- Consider disabling auto-refill entirely — API will just fail if credits run out, no surprise charge

---

### 7. npm + PyPI (published SDKs) — free

**Check:**
- [ ] Packages still published?
- [ ] Any beta/pre-release tags to clean up?

**Decision matrix:**
- Both are free, packages can stay published forever
- Consider adding a "portfolio project - unmaintained" note in the package README

---

### 8. GitHub — free for public repos

**Nothing to do.** Public repos are free. Only cost would be GitHub Pro
(~$4/mo) which I'm probably not on.

---

### 9. Cloudflare (email routing, DNS) — free

**URL:** https://dash.cloudflare.com/

**Check:**
- [ ] Email routing for support@skopos.ink still active? (forwards to skopos.support@gmail.com)
- [ ] Any paid add-ons?

**Decision matrix:**
- Everything I use on Cloudflare is free tier. Safe.
- If email forwarding is no longer needed, disable it (one less thing to worry about)

---

## Recommended action plan (in order)

**Today (15 minutes):**
1. Log into each service above
2. Note billing status + renewal dates in this file
3. **Disable auto-renewal everywhere I don't consciously want to renew**
4. Set calendar reminder 30 days before each renewal date

**Tomorrow (30 minutes):**
5. Delete accounts I actively don't need (Resend, Lemon Squeezy if unused)
6. Rotate any API keys that are still hot
7. Add "portfolio project" note to package READMEs

**Long term (as renewals approach):**
- Domain skopos.ink: decide at renewal if value ≥ €25/year
- Hetzner: decide at renewal if I still want a live backend

---

## Emergency: if a surprise charge appears

If I see an unexpected charge on my bank statement:

1. Don't panic — most services can refund within 30 days
2. Contact support of the service that charged
3. Explain: "portfolio project, no active usage, wasn't aware of auto-renewal"
4. Cancel service immediately after refund is confirmed

Services usually refund without argument for small amounts (< €50) if
usage data confirms zero activity.
