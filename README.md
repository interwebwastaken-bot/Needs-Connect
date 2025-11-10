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
