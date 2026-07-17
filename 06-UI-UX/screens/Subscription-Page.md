---
title: "Subscription Page"
description: "Pricing and subscription flow — honest, premium, parent-friendly."
tags:
  - ui-ux
  - screens
  - subscription
  - pricing
  - payments
  - studed
aliases:
  - "Pricing Page"
  - "Paywall"
date: 2026-07-17
---

# Subscription Page

> [!info] Goal
> Convert with dignity. Pricing must feel trustworthy to Sri Lankan parents and global learners — clear value, LKR-first pricing, zero dark patterns. Implements the plans from [[Monetization-Strategy]] and checkout via [[Payment-Integration]].

## Layout

### 1. Header
- Overline `PRICING`, serif display-lg: "Invest in understanding."
- Sub-line: "Start free for 7 days. Cancel anytime. Sinhala, Tamil, and English included in every plan."
- Billing toggle: Monthly / **Annual (save 25%)** — annual pre-selected with a green "save" chip.

### 2. Plan cards
Three 24px-radius cards, equal height, generous 32px padding:

| | **Free** | **Premium** (highlighted) | **Schools** |
|---|----------|---------------------------|-------------|
| Price | LKR 0 | LKR 1,500/mo (annual: LKR 1,125) | "Talk to us" |
| Includes | 1 course, daily wave limit, community leaderboard | All courses, unlimited waves, AI tutor, offline mode, exam-prep tracks | Bulk licenses, admin dashboard, teacher tools |
| CTA | Start free | **Start free trial** (primary) | Contact sales (secondary) |

- Premium card: 2px blue border, soft Dawn gradient header, "Most chosen" pill — the only elevated card.
- Feature lists use 16px green tick icons, one line each, max 6 items. No feature is listed that Free lacks *and* the row can't explain in 6 words.

### 3. Paywall variant (contextual)
- When triggered from locked content, the page morphs: header names the specific thing unlocked — "Premium unlocks *all of Combined Maths* — and everything else." — with the same three cards below. The student always sees the value context, not a bare gate.

### 4. Trust band
- Below cards, a muted row: PayHere-secured payment badge, "Cancel in two taps", refund policy link, parent/guardian checkout note (a parent can pay for a child's account — per [[User-Journeys]] pain point).

### 5. Checkout sheet
- Selecting a plan opens a focused sheet (glass, centered): plan summary, PayHere card fields, total in LKR with tax line, **Subscribe** primary button.
- Success: full-screen calm confirmation — green Growth gradient, serif "Welcome to Premium.", what-happens-next list, **Start learning** button. `playSuccessSound()`.

## States

| State | Design |
|-------|--------|
| Payment failed | Inline error in sheet, no scary red page: "Payment didn't go through — try another card." |
| Already subscribed | Page becomes manage view: current plan card, renewal date, switch-plan and cancel (destructive, two-step confirm) |
| Trial ending (3 days) | Dashboard banner deep-links here with days remaining prefilled |

## Motion & Tone

- Annual toggle slides card prices with count-up.
- No countdown timers, no "only 3 seats left", no exit-intent modals — urgency is never manufactured.

## Mobile

- Cards stack vertically with Premium first; billing toggle sticks to the top on scroll; checkout sheet becomes full-screen.

## Accessibility

- Pricing table also available as a screen-reader-friendly comparison list. All prices in text, never images. Currency always explicit ("LKR 1,500", never bare numerals).
