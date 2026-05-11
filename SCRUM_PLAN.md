# Scrum Plan — opensense-dining MVP

Derived from [CRITICAL_MISSING_FEATURES.md](./CRITICAL_MISSING_FEATURES.md).

**Team velocity assumption:** 40 story points per 2-week sprint  
**Definition of Done:** Feature branch merged, API tested, UI smoke-tested, relevant unit tests passing.

---

## Backlog Summary

| # | Feature | Points | Sprint |
|---|---------|--------|--------|
| 1 | Database Schema Gaps | 3 | 1 |
| 2 | Settings Page | 8 | 1 |
| 3 | Per-Table QR Code Generation | 8 | 1 |
| 4 | Real-Time Order Updates (SSE) | 8 | 1 |
| 5 | Kitchen Display System (KDS) | 13 | 2 |
| 6 | Analytics / Stats Dashboard | 13 | 2 |
| 7 | WhatsApp / SMS Bill Delivery | 8 | 3 |
| 8 | Staff Management & RBAC | 13 | 3 |
| 9 | Onboarding Wizard | 8 | 4 |
| 10 | Subscription / Billing | 21 | 4–5 |

---

## Sprint 1 — Foundation (2 weeks)

**Goal:** Every restaurant can configure their profile, get QR codes for tables, and the system has live order streaming ready for KDS.

### Stories

#### DB-1 · Database Schema Gaps · 3 pts ✅
_As a developer, I need the correct schema in place so no migrations break live data later._

- [x] Add `allergens`, `ingredients`, `meal_time`, `tags`, `is_jain`, `is_halal`, `nutrition`, `nutrition_source` to `menu_items`
- [x] Add `tax`, `payment_status`, `whatsapp_sent` to `orders`
- [x] Write and run migration; update TypeScript types / Drizzle schema

---

#### SET-1 · Settings Page · 8 pts ✅
_As a restaurant owner, I want to configure my restaurant profile so customers see correct branding and info._

**API**
- [x] `PUT /api/admin/restaurant` — update name, logo, address, phone, hours, brand color, slug, KDS PIN, daily summary toggle

**Admin UI**
- [x] Settings route and navigation item
- [x] Form sections: Profile · Branding · Hours · KDS PIN · Notifications
- [x] Optimistic save with loading/error states

---

#### QR-1 · Per-Table QR Code Generation · 8 pts ✅
_As a restaurant owner, I want a scannable QR code per table so customers can reach the menu without staff intervention._

**API**
- [x] Attach QR data URL on `POST /api/admin/tables` (table creation)
- [x] `POST /api/admin/tables/:id/qr` — regenerate QR

**Admin UI**
- [x] Display QR per table in Tables page
- [x] Download button (branded PNG with restaurant logo/color)

---

#### SSE-1 · Real-Time Order Updates · 8 pts ✅
_As a developer, I need an SSE infrastructure so admin and KDS get live order events without polling._

**API**
- [x] SSE manager service (connection registry, broadcast on order create/status change)
- [x] `GET /api/admin/orders/stream` — SSE feed for admin
- [x] `GET /api/kds/orders/stream` — SSE feed for KDS (guarded by JWT)

**Admin UI**
- [x] `EventSource` hook (`useOrderStream`)
- [x] Wire into existing admin Orders page (live append + status badge update)

---

**Sprint 1 total: 27 pts** _(buffer for testing & bug fixes)_

---

## Sprint 2 — Kitchen Operations & Analytics (2 weeks)

**Goal:** Kitchen staff can operate entirely from the KDS screen; owners can see daily revenue and order performance.

### Stories

#### KDS-1 · Kitchen Display System · 13 pts
_As a kitchen worker, I want a large-format PIN-authenticated order queue so I can see and complete orders in real time._

**API**
- [ ] `POST /api/kds/auth` — validate KDS PIN, return short-lived session token
- [ ] Order bump endpoint: `PATCH /api/admin/orders/:id/status` (reuse or extend)

**KDS UI (new app or route)**
- [ ] PIN entry screen
- [ ] Full-screen order card grid (order number, items, timestamp)
- [ ] Auto-refresh via `useOrderStream` SSE hook (from SSE-1)
- [ ] "Bump" button marks order as `preparing` → `ready`
- [ ] Audio/visual alert on new order arrival

---

#### ANA-1 · Analytics / Stats Dashboard · 13 pts
_As a restaurant owner, I want KPI cards and a revenue trend chart so I can make data-driven daily decisions._

**API**
- [ ] `GET /api/admin/stats` — today's revenue, order count, avg order value, top-5 dishes
- [ ] Support `?range=7d|30d` query param for trend endpoint

**Admin UI**
- [ ] Dashboard KPI cards: Revenue · Orders · Avg Value · Top Dish
- [ ] 7-day / 30-day revenue trend chart (recharts or similar)
- [ ] Top-selling items list
- [ ] Skeleton loaders while fetching

---

**Sprint 2 total: 26 pts**

---

## Sprint 3 — Communication & Multi-User (2 weeks)

**Goal:** Bills can be sent via WhatsApp; multiple staff members can log in with appropriate roles.

### Stories

#### WA-1 · WhatsApp / SMS Bill Delivery · 8 pts
_As a restaurant manager, I want to send a digital bill to the customer's WhatsApp so we meet local market expectations._

**API**
- [ ] Integrate Twilio or Meta Cloud API WhatsApp service
- [ ] `POST /api/admin/orders/:id/send-bill` — render bill template, dispatch message, set `whatsapp_sent = true`

**Admin UI**
- [ ] "Send Bill" action button per order row in Orders page
- [ ] Sent status indicator (tick when `whatsapp_sent`)

---

#### STF-1 · Staff Management & RBAC · 13 pts
_As a restaurant owner, I want to invite staff with defined roles so operations don't depend on sharing a single login._

**API**
- [ ] `GET /api/admin/staff` — list staff
- [ ] `POST /api/admin/staff/invite` — send invite email with token
- [ ] `PATCH /api/admin/staff/:id/role` — assign `owner` / `manager` / `staff`
- [ ] `DELETE /api/admin/staff/:id` — deactivate
- [ ] Public route: `POST /api/auth/accept-invite` — accept invite, set password
- [ ] Role-based middleware applied to all admin routes

**Admin UI**
- [ ] Staff list page (name, role, status, actions)
- [ ] Invite modal (email + role selector)
- [ ] Invite acceptance page (public, no auth required)

---

**Sprint 3 total: 21 pts**

---

## Sprint 4 — Onboarding & Billing Core (2 weeks)

**Goal:** New restaurants can self-serve from signup to first live order; billing infrastructure is in place.

### Stories

#### OB-1 · Onboarding Wizard · 8 pts
_As a new restaurant owner, I want a guided setup flow so I can go live without contacting support._

**API**
- [ ] `PUT /api/admin/restaurant/onboarding` — persist step completion state

**Admin UI**
- [ ] Wizard shown on first login (step completion gating nav)
- [ ] Steps: Restaurant Profile → Add Category → Add First Item → Set Table → Go Live
- [ ] Progress indicator; skip + resume capability
- [ ] Redirect to dashboard when all steps complete

---

#### BIL-1 · Subscription / Billing — Core · 13 pts
_As a restaurant owner, I want to see my plan and upgrade so opensense-dining has a revenue model._

**API**
- [ ] `GET /api/admin/billing/status` — current plan, trial expiry, feature flags
- [ ] `POST /api/admin/billing/checkout` — create Razorpay order/session
- [ ] Razorpay webhook: `POST /api/payments/webhook` (signature-verified)
- [ ] Trial period tracking (start date, 14-day default expiry) on restaurant creation
- [ ] Subscription status middleware to gate `gold` / `platinum` features

**Admin UI**
- [ ] Billing page: plan badge, trial countdown, feature comparison table
- [ ] Upgrade CTA → Razorpay checkout
- [ ] Post-payment success/failure redirect handling

---

**Sprint 4 total: 21 pts**

---

## Sprint 5 — Billing Polish & Hardening (2 weeks)

**Goal:** Billing is production-ready; edge cases handled; full regression pass.

### Stories

#### BIL-2 · Billing — Hardening · 8 pts
- [ ] Idempotent webhook handling (deduplicate by Razorpay event ID)
- [ ] Failed payment recovery flow (retry CTA, grace period)
- [ ] Plan downgrade / cancellation endpoint
- [ ] Billing email notifications (receipt, trial expiry warning)

#### REG-1 · Regression & QA · 13 pts
- [ ] End-to-end test: signup → onboarding → place order → KDS bump → send bill
- [ ] Load test SSE endpoint (≥50 concurrent connections)
- [ ] Security review: auth middleware coverage, webhook signature validation, role gates
- [ ] Fix all P1 bugs found during testing

---

**Sprint 5 total: 21 pts**

---

## Milestone Summary

| Sprint | End Date (from now) | Deliverable |
|--------|---------------------|-------------|
| Sprint 1 | Week 2 | Schema, settings, QR codes, SSE ready |
| Sprint 2 | Week 4 | KDS live, analytics dashboard live |
| Sprint 3 | Week 6 | WhatsApp bills, multi-user staff |
| Sprint 4 | Week 8 | Onboarding wizard, billing core |
| Sprint 5 | Week 10 | Billing hardened, full regression — **MVP READY** |

---

## Dependencies Map

```
DB Schema (Sprint 1)
  └── Settings Page
  └── QR Code Generation
  └── SSE Infrastructure
        └── KDS (Sprint 2)
        └── Admin Orders (live)
Settings Page
  └── Onboarding Wizard (Sprint 4)
  └── Billing (Sprint 4)
Staff / RBAC (Sprint 3)
  └── Role gates on all routes
```

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Razorpay India onboarding delay | High | Start KYC process immediately; stub billing in Sprint 4 with feature flag |
| Meta WhatsApp API approval time | Medium | Use Twilio sandbox first; production approval in parallel |
| SSE stability under load | Medium | Test early in Sprint 2; fall back to long-polling if needed |
| Schema migrations on live DB | Low | Run in maintenance window; write rollback script before applying |
