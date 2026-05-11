# Post-MVP Features (After Launch)

These features add significant value but are not required to serve the first paying restaurants.
Prioritize after the critical MVP is stable.

---

## Phase 1 — High Value (implement within first 3 months post-launch)

### 1. Nutrition & Allergen System

**Value:** Differentiator vs. competitors. Required for health-conscious restaurants and regulatory compliance.

**What's needed:**
- Allergen tagging per menu item (8 FSSAI allergens + Jain/Halal flags)
- Curated nutrition database (200+ common dishes, auto-fill on name match)
- AI fallback estimation for unmatched dishes
- Bulk auto-fill endpoint: `POST /api/admin/menu/bulk-autofill`
- Nutrition display on customer menu (calories, macros per item)
- Customer allergen filter controls (presets: Jain, Halal, Gluten-free)
- Services: `dishNutritionData.ts`, `nutritionEstimation.service.ts`, `dishMatcher.service.ts`

---

### 2. Reservations System

**Value:** Lets restaurants take advance table bookings, reducing walk-in uncertainty.

**What's needed:**
- Public reservations page on customer site
- `POST /api/reservations` — create booking (name, phone, party size, date/time)
- `GET /api/admin/reservations` — list + confirmation/cancellation
- Reservations list page in admin
- Date/time availability validation

---

### 3. Loyalty Stamp Program

**Value:** Increases repeat orders. A key retention mechanic for casual dining.

**What's needed:**
- Configurable stamp threshold (e.g., every 10th order is free)
- Stamp awarded on order completion (`loyalty_punches_awarded` field on orders)
- Stamp card display on order confirmation page (customer)
- Loyalty settings in admin settings page
- Endpoint: `GET /api/admin/loyalty/stats`

---

### 4. Menu Search & Filters

**Value:** Essential UX for restaurants with 30+ items. Without it, customers scroll-hunt.

**What's needed:**
- Full-text search bar on customer menu page
- Filter by: veg/non-veg, allergens, meal time, tags
- Fitness presets (High Protein, Low Carb, etc.) tied to nutrition data
- Frontend-only filtering is acceptable initially (no extra API needed)

---

### 5. SEO Restaurant Profile Page

**Value:** Each restaurant gets a public-facing profile page indexed by Google. Drives organic discovery.

**What's needed:**
- Public page: `/profile/:slug` (no auth)
- `GET /api/profile/:slug` endpoint
- JSON-LD structured data (Restaurant schema)
- Open Graph meta tags
- Paid/verified badge display
- `GET /sitemap.xml` covering all restaurant slugs

---

## Phase 2 — Growth Features (3–6 months post-launch)

### 6. Referral Program

**Value:** Viral growth loop. Incentivizes existing restaurants to refer new ones.

**What's needed:**
- Referral code generation per restaurant
- Credit tracking on successful referral (converts to billing discount)
- `GET /api/admin/referral/code`
- `GET /api/admin/referral/list`
- `POST /api/admin/referral/redeem`

---

### 7. Custom Domain (CNAME)

**Value:** Premium plan differentiator. Lets restaurants host their menu on their own domain.

**What's needed:**
- CNAME validation flow in admin settings
- DNS verification endpoint: `POST /api/admin/restaurant/domain`
- Wildcard or per-domain TLS provisioning (ACME / Caddy)
- Gate behind Platinum plan

---

### 8. Multi-Location / Group Dashboard

**Value:** Unlocks restaurant chains as customers (significantly higher ACV).

**What's needed:**
- Group entity linking multiple restaurant accounts
- Group dashboard: aggregate revenue, orders, per-location breakdown
- Location switcher in admin sidebar
- `GET /api/admin/group/stats`
- `GET /api/admin/group/locations`

---

### 9. Reorder Banner

**Value:** Low-effort conversion. Customers who've ordered before convert faster.

**What's needed:**
- Detect returning customer by phone/session on customer menu page
- Display banner: "Order again from your last visit?"
- Pre-fill cart with last order items (with availability check)

---

### 10. Daily Summary Reports

**Value:** Keeps restaurant owners engaged without logging in. Builds product habit.

**What's needed:**
- Scheduled job (daily, configurable time)
- Summary: orders count, revenue, top dish of the day
- Delivery via WhatsApp or email
- Toggle in admin settings

---

## Phase 3 — Polish (6+ months)

| Feature | Description |
|---|---|
| **In-app Help / ChatBot** | Contextual help modal + basic FAQ bot for admin users |
| **Offline Banner** | Show degraded state when API is unreachable |
| **Meal-Time Tags** | Breakfast/Lunch/Dinner tagging with auto-hide on menu by time of day |
| **Payment Status Tracking** | Mark orders as paid/unpaid, payment method selection |
| **Review/Rating Display** | Show aggregated ratings on restaurant profile SEO page |
