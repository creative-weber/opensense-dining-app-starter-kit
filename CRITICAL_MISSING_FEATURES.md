# Critical Missing Features (MVP Blockers)

These features are required before opensense-dining can be used in production by real restaurants.

---

## 1. Kitchen Display System (KDS)

**Why critical:** Without it, kitchens have no way to see incoming orders. The current admin orders page is not usable in a real kitchen environment.

**What's needed:**
- KDS view page (large-format, auto-refreshing order queue)
- PIN-based authentication (separate from admin login)
- Real-time SSE order stream (`GET /api/kds/:id/orders/stream`)
- PIN auth endpoint (`POST /api/kds/auth`)
- Order bump/complete actions from KDS screen

---

## 2. Real-Time Order Updates (SSE)

**Why critical:** Admin order list and KDS both require live updates without manual refresh.

**What's needed:**
- `GET /api/admin/orders/stream` — SSE endpoint for admin order feed
- SSE manager service to push events on order creation/status change
- Frontend `EventSource` integration in admin orders page and KDS

---

## 3. Staff Management & Role-Based Access

**Why critical:** Restaurants have owners, managers, and staff. A single-user system is not viable for real operations.

**What's needed:**
- Staff list page in admin
- Invite by email flow (`POST /api/admin/staff/invite`)
- Role assignment: `owner` / `manager` / `staff`
- Role-based middleware on API routes
- Staff deactivation endpoint
- Invite acceptance page (public route, no auth)

---

## 4. Subscription / Billing

**Why critical:** There is no revenue model without it. Also gates feature access.

**What's needed:**
- Razorpay (or equivalent) integration
- Plan tiers: Free / Gold / Platinum
- Trial period tracking (start date, expiry)
- Billing page in admin (plan overview, upgrade CTA, trial countdown)
- Subscription status middleware to gate premium features
- Razorpay webhook handler (`POST /api/payments/webhook`)
- Endpoints: `POST /api/admin/billing/checkout`, `GET /api/admin/billing/status`

---

## 5. Settings Page

**Why critical:** Restaurants need to configure their profile, branding, and operational parameters before going live.

**What's needed:**
- Restaurant name, logo, address, phone, open/close hours
- Brand color (used on customer-facing menu)
- KDS PIN configuration
- Daily summary report toggle (email/WhatsApp)
- Custom slug for customer-facing URL
- Endpoint: `PUT /api/admin/restaurant`

---

## 6. WhatsApp / SMS Bill Delivery

**Why critical:** In the target market (India), digital bill delivery via WhatsApp is a baseline customer expectation.

**What's needed:**
- WhatsApp service integration (Twilio / Meta Cloud API)
- "Send Bill" action per order in admin orders view
- `POST /api/admin/orders/:id/send-bill` endpoint
- Order model: `whatsapp_sent` field to track delivery status

---

## 7. Analytics / Stats Dashboard

**Why critical:** Restaurant owners make daily decisions based on revenue and order data. A blank dashboard is not acceptable past day 1.

**What's needed:**
- `GET /api/admin/stats` endpoint (today's revenue, order count, top dishes)
- Dashboard KPI cards (revenue, orders, avg order value)
- Revenue trend chart (7-day / 30-day)
- Top-selling items list

---

## 8. Onboarding Wizard

**Why critical:** New restaurants cannot self-serve without a guided setup flow. Without it, every signup requires manual support.

**What's needed:**
- Step-by-step onboarding page (shown on first login)
- Steps: Restaurant profile → Add category → Add first item → Set table → Go live
- Completion state persisted per restaurant
- Skip/resume capability

---

## 9. Per-Table QR Code Generation

**Why critical:** The core customer flow (scan QR → view menu → order) breaks without per-table QR codes.

**What's needed:**
- QR code generated on table creation
- Branded QR download (with restaurant logo/color)
- `POST /api/admin/tables/:id/qr` regeneration endpoint
- QR display in admin tables page

---

## 10. Database Schema Gaps (`menu_items`)

**Why critical:** Missing fields block feature parity and cannot be added later without migrations affecting live data.

**Fields to add:**
```sql
allergens        TEXT[]
ingredients      TEXT[]
meal_time        TEXT[]        -- breakfast / lunch / dinner
tags             TEXT[]
is_jain          BOOLEAN DEFAULT false
is_halal         BOOLEAN DEFAULT false
nutrition        JSONB
nutrition_source TEXT          -- 'database' | 'ai' | 'manual'
```

**Fields to add to `orders`:**
```sql
tax              NUMERIC(10,2)
payment_status   TEXT          -- 'pending' | 'paid' | 'failed'
whatsapp_sent    BOOLEAN DEFAULT false
```
