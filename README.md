# SocietyOS
<img src="https://raw.githubusercontent.com/Yagya-Jha/SocietyOS/refs/heads/main/public/logo.png">
<b>Intelligent Residential Maintenance Platform</b>

SocietyOS is a modern, AI-powered platform designed to streamline residential society management, maintenance requests, and incident tracking. It replaces traditional WhatsApp groups and paper registers with an automated system that intelligently triages complaints, assigns them to the right teams, and tracks service-level agreements (SLAs).

## 🚀 Features

*   **Smart AI Triage:** Residents simply type their complaint in plain English. SocietyOS uses AI to automatically extract the category (e.g., plumbing, electrical), assess the priority (low, medium, high, critical), and identify the exact location.
*   **Automated Routing:** Administrators can set up routing rules so that specific categories (like elevator issues) are automatically assigned to the designated maintenance team.
*   **Role-Based Access Control:** 
    *   **Admins:** Have a bird's-eye view of all society complaints, can manage members, view analytics, update incident statuses, and configure routing rules.
    *   **Residents:** Can easily log new complaints, track their status in real-time, and communicate via timeline comments.
*   **Live Analytics Dashboard:** Track open vs. resolved incidents, monitor SLA breaches, and view category breakdowns.
*   **Progressive Web App (PWA):** Installable on mobile devices for a native app-like experience without needing an app store download.

## 🛠 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Database:** [PostgreSQL](https://postgresql.org/) (Hosted on [Neon](https://neon.tech/))
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Authentication:** [NextAuth.js (Auth.js v5)](https://authjs.dev/)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **AI Integration:** [OpenRouter](https://openrouter.ai/) for LLM inference & `@xenova/transformers` for embeddings.
*   **Deployment:** [Vercel](https://vercel.com/)

---

## 🧪 Testing Guide for Judges

To experience the full functionality of the platform across different roles, a demo society (**Gokuldham Society**) has been pre-configured. 

Please use the following credentials to test the application:

### 1. Administrator Account
Use this account to view analytics, see all society complaints, update incident statuses, and view the member directory.
*   **Email:** `atmaram@gmail.com`
*   **Password:** `abc123`

### 2. Resident Accounts
Use these accounts to test creating new complaints, commenting on timelines, and viewing resident-specific dashboards.
*   **Resident 1:** `jethalal@gmail.com`
*   **Resident 2:** `sodhi@gmail.com`
*   **Resident 3:** `iyer@gmail.com`
*   **Password (for all):** `abc123`

### 3. Testing New User Registration
To test the onboarding flow for a brand new resident joining an existing society:
1. Go to the Registration page.
2. Enter a new email and password.
3. When prompted for the **Society Join Code**, use: `SLHLKG` (This links the new user to the test Gokuldham Society).

---
