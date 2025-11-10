# Needs Connect  
**Connecting Helpers and Managers Seamlessly**

Needs Connect is a transparent donation management platform built to bridge the gap between **helpers**, **organizations**, and **admins**.  
It allows people to identify, support, and manage community needs with clarity and trust.

---

## 🌐 Overview  
A streamlined platform where:  
- **Helpers** can browse verified needs, donate securely, and track impact.  
- **Admins** can create and manage needs, set priorities, and monitor progress.  
- **Charities** can collaborate with donors and highlight their ongoing campaigns.  

---

## ⚙️ Tech Stack  
| Layer | Technology |
|:------|:------------|
| Frontend | HTML5, CSS3, JavaScript (ES Modules) |
| Backend | Supabase (PostgreSQL + Auth + RPC) |
| Authentication | Custom login/signup with Supabase RPC |
| UI | Fully hand-coded responsive interface |
| Email Service | Node + Resend API (for admin verification) |

DISCLAIMER: WE DID NOT USE MARIADB FOR THIS PROJECT BECAUSE SETTING UP MARIADB WAS TOO COMPLEX TO ACHIEVE WITHIN THE PROJECTS TIME CONSTRAINTS
---

## 🧱 Core Features  

### 👥 Authentication  
- Role-based login for **Helpers** and **Admins**  
- Secure sign-up with **repeat password verification**  
- Admin verification handled via email before access  

### 🎯 Admin Dashboard  
- Create, edit, or pause needs  
- Set priorities, costs, and deadlines  
- Auto-tracks donation progress in real time  

### 💛 Helper Portal  
- Browse active and paused needs  
- Filter by **status**, **category**, and **charity**  
- Add donations to basket and checkout  
- “Target Met” and “Unavailable” states for completed/cancelled needs  

### 📄 Additional Pages  
- **Testimonials** — stories of impact  
- **Privacy Policy** — simple, aesthetic standalone page  
- **About Us** and **Contact Us** modals on every page  

---
## 🚶 How to Use Needs Connect

This guide walks through the core flows for **Helpers** and **Admins**.

---

### 1) Getting Started (Both Roles)

1. Open `auth.html`.
2. Choose **Login** or **Sign Up**.
3. If signing up:
   - Fill **Full Name**, **Email**, **Password**, **Repeat Password**.
   - Pick **Role** (Helper or Admin).
   - Submit.  
     - If **Admin**, you’ll see a note to email verification details to the team. You can’t manage needs until verified.
4. If logging in:
   - Select **Role**.
   - Enter **Email** and **Password**.
   - **Admins** must also enter a valid **Charity Code** (provided after verification).

> After login: Helpers go to `helper.html`. Admins go to `admin.html`.

---

### 2) Helper Workflow (Donor Experience)

**Page:** `helper.html`

#### A. Find a need
1. Use the **search bar** to find by name, category, or description.
2. Use **Sort** to reorder:
   - Newest, Oldest, Highest Priority, Most Expensive, Earliest Deadline.
3. Use **Status filter**:
   - Ongoing, Paused, Completed, Cancelled (Completed/Cancelled show as **not donateable**).
4. Use **Charity filter** to see needs from a specific organization.

#### B. Read a need
- Each card shows: image, status pill, optional **Urgent** and **Time Sensitive** badges, title, description, category, deadline, charity, admin, and a **progress bar** with amounts.

#### C. Donate
1. Click **Donate** on an eligible card.
2. In the modal, enter **Donation Amount (AED)** and optional **Note**.
3. Click **Add to Basket**.
4. Open **Basket** (top right) to:
   - Review items
   - Remove an item
   - See **Total**
   - Click **Proceed to Checkout** (goes to `payment.html` placeholder).

> If a need is **Completed**, the button shows **Target Met**.  
> If **Cancelled**, it shows **Unavailable** and appears in grayscale.

#### D. Footer tools
- **About Us** and **Contact Us** open as modals.
- **Privacy Policy** opens `privacy.html`.

#### E. Logout
- Top-right **Logout** button ends your session and returns to `auth.html`.

---

### 3) Admin Workflow (Manager Experience)

**Page:** `admin.html`

#### A. Add a new need
1. Click **Add Need**.
2. Fill:
   - **Name**, **Description**, **Cost**, **Deadline**
   - **Status**: `ongoing` or `paused` (you **don’t** add completed/cancelled at creation)
   - **Priority** (1 = highest, 5 = lowest)
   - **Category**
   - **Time Sensitive** (toggle)
   - **Image URL** (optional)
3. Save. The card appears immediately for Helpers.

#### B. Edit an existing need
1. Click **Edit** on a card.
2. Update any fields. You can also change **Status** to:
   - `ongoing`, `paused`, `completed`, or `cancelled`
3. Save.  
   - **Completed** needs show **Target Met** for Helpers and disable donations.
   - **Cancelled** needs show **Unavailable** and appear grayscale.

#### C. Track progress
- The **progress bar** updates automatically based on **amount_collected** (managed via your payment flow/backoffice or Supabase updates).

---

### 4) Common UI Behaviors

- **Modals**: Close with the circular ✕, click outside on the dark overlay, or press **Esc**.
- **Filters & Sort**: Combine freely; they update instantly.
- **Badges**:
  - **Urgent** = red badge (high attention)
  - **Time Sensitive** = gold badge with clock (deadline pressure)
- **Status pill colors**:
  - Ongoing = slate gray
  - Paused = gold
  - Completed = green
  - Cancelled = red

---

### 5) Admin Verification (One-time)

For **Admin** accounts:
1. Sign up with role **Admin**.
2. Send verification details to the team email shown in the form.
3. Receive a **Charity Code**.
4. At login, enter **Email**, **Password**, **Charity Code** to access the admin dashboard.

---

### 6) Troubleshooting

- **Can’t log in as Admin**: You must have a valid **Charity Code**.
- **Buttons disabled**: The need may be **Completed** or **Cancelled**.
- **No needs showing**: Clear filters or check your Supabase data.
- **Email not sending** (admin verification): Ensure the local email proxy (`server/server.js`) is running if you’re testing locally.

---

### 7) Keyboard & Accessibility

- **Esc** closes modals.
- Labels are associated with inputs for screen readers.
- Buttons have clear focus styles and states.

---

## 🗄️ Database Structure  

### Table: `needs`
```sql
id BIGSERIAL PRIMARY KEY,
need_name TEXT NOT NULL,
description TEXT,
cost NUMERIC(10,2) DEFAULT 0.00,
deadline DATE,
status need_status_enum DEFAULT 'ongoing',
priority INTEGER DEFAULT 3,
category TEXT,
time_sensitive BOOLEAN DEFAULT FALSE,
image_url TEXT,
created_by UUID REFERENCES app_users(id) ON DELETE CASCADE,
created_at TIMESTAMPTZ DEFAULT NOW(),
amount_collected NUMERIC(10,2) DEFAULT 0

