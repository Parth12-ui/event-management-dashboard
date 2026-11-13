# Priority Event Management System

**DASS Assignment 1**
Built by: 2024101127 | IIIT Hyderabad

---

## 🚀 Live Deployment

| Service | URL |
|---------|-----|
| **Frontend** (Vercel) | https://dass-a1-green.vercel.app/ |
| **Backend API** (Render) | https://dass-a1-q9gh.onrender.com |

> ⚠️ **Note:** The backend is on Render's free tier and may cold-start in ~30 seconds after inactivity.

---

## Table of Contents

1. [Libraries & Frameworks](#libraries--frameworks)
2. [Advanced Features](#advanced-features)
3. [Database Structure](#database-structure)
4. [Setup & Installation](#setup--installation)

---

## 1. Libraries & Frameworks

### Frontend

| Library | Version | Justification |
|---------|---------|---------------|
| **React 19** | `^19.0.0` | Component-based UI architecture enables reusable, modular code. React's virtual DOM ensures efficient, minimal re-renders across complex event listing and dashboard pages. |
| **Vite** | `^6.0.0` | Chosen over Create React App for dramatically faster development server startup (via native ES modules) and optimised production builds with tree-shaking. |
| **React Router DOM** | `^7.0.0` | Enables client-side routing for a smooth SPA experience (no full-page reloads). Supports nested routes for role-specific portals (participant/organizer/admin). |
| **Axios** | `^1.7.0` | Preferred over `fetch` for automatic JSON serialisation, built-in request/response interceptors (used to attach JWT headers globally), and cleaner error handling. |
| **Socket.IO Client** | `^4.8.3` | Provides the real-time bidirectional communication layer for Discussion Forums and Team Chat. Pairs with the backend Socket.IO server and includes automatic reconnection. |
| **React Google reCAPTCHA** | `^3.1.0` | Adds bot protection to password reset flows by integrating Google's reCAPTCHA v2 challenge, preventing automated abuse of the reset endpoint. |
| **Vanilla CSS** | — | Chosen deliberately over Tailwind/Bootstrap to maintain complete design control. Implements a custom glassmorphism design system with CSS variables, enabling premium aesthetics without external stylesheet bloat. |

### Backend

| Library | Version | Justification |
|---------|---------|---------------|
| **Express.js** | `^5.2.1` | Minimal, unopinionated Node.js web framework. Chosen for its flexible middleware pipeline (auth, uploads, routing) and broad ecosystem. |
| **Mongoose** | `^9.2.1` | ODM for MongoDB, providing schema validation, virtuals, and query helpers. Essential for managing complex relational data (events, registrations, teams) with a NoSQL backend. |
| **Socket.IO** | `^4.8.3` | Server-side WebSocket management. Handles room-based isolation (per-event and per-team chat rooms) and scales to concurrent connections efficiently. |
| **Multer** | `^2.0.2` | Middleware for handling `multipart/form-data`. Used for payment proof uploads and chat file attachments. Configured with `diskStorage` and file-size limits. |
| **bcryptjs** | `^3.0.3` | Industry-standard password hashing library. Chosen for its pure-JS implementation (no native bindings required) and adaptive cost factor for future-proofing security. |
| **jsonwebtoken** | `^9.0.3` | Stateless JWT-based authentication. Encodes user `id` and `role`, enabling role-based access control across participant, organizer, and admin portals without server-side sessions. |
| **Nodemailer** | `^8.0.1` | Handles transactional email delivery—QR ticket confirmations, merchandise approvals/rejections, and password reset links. |
| **QRCode** | `^1.5.4` | Generates QR codes as base64 Data URLs for embedding directly in confirmation emails and ticket displays, without requiring a file system write. |
| **dotenv** | `^16+` | Loads environment variables from `.env` files, separating secrets (DB URI, JWT secret, email credentials) from source code. |
| **cors** | `^2.8.6` | Configures Cross-Origin Resource Sharing headers, essential because the frontend (Vercel) and backend (Render) are on different domains. |
| **csv-writer** | `^1.6.0` | Used to export event registration data as CSV files for organizer analytics and reporting. |
| **ejs** | `^4.0.1` | Template engine for generating dynamic HTML email bodies (ticket emails, password reset emails). |
| **nodemon** | `^3.1.11` | Development utility that automatically restarts the Node.js server on file changes, accelerating development iteration. |

---

## 2. Advanced Features

### Tier A: Event Customization & Moderation (20 Marks)
**1. Dynamic Form Builder for Events**
- *Feature*: Organizers can define custom registration templates (text fields, single-choice, multi-choice) with validation.
- *Justification*: Normal registrations lack flexibility. Clubs need diverse data (e.g., T-shirt size, dietary needs, GitHub link).
- *Implementation*: The `Event` model stores an array of form descriptors (`customForm`). The frontend renders these dynamically. The `Registration` model stores answers in a flexible `formResponses` Map.

**2. Rule-Based Matchmaking & Teaming**
- *Feature*: Participants can form teams adhering strictly to event-defined rules (`isTeamEvent`, `teamSize.min`, `teamSize.max`, `eligibility`).
- *Justification*: Prevents invalid teams from entering events.
- *Implementation*: A separate `Team` model tracks `status` (forming/closed). Registrations are only minted (via `generateTeamTickets`) when a leader finalises a team that passes all bounds and eligibility checks.

**3. Real-Time Discussion Forums (Socket.IO)**
- *Feature*: Real-time, event-scoped discussion threads.
- *Justification*: Participants need a platform to ask queries directly to organizers or peers without leaving the application.
- *Implementation*: Utilises `Socket.IO` rooms. When joining an event page, the client joins `forum-{eventId}`. Messages are broadcast to room members and concurrently persisted to MongoDB (`ForumMessage`) for historical access.

### Tier B: Automated Workflows & Notifications (15 Marks)
**4. Real-Time Team Chat with File Uploads**
- *Feature*: Isolated, real-time communication channels for formed teams, supporting image/document sharing.
- *Justification*: Essential for team collaboration (e.g., sharing hackathon assets or strategies) directly within the dashboard.
- *Implementation*: Uses `Socket.IO` mapped to `team-{teamId}` rooms. File uploads are intercepted via REST (Multer), saved to the server, and the resulting URL is emitted as a `ChatMessage` payload. 

**5. Payment Processing & Approval Workflow**
- *Feature*: Two-step verification for paid/merchandise events. Participants upload proof; organizers approve/reject.
- *Justification*: Ensures financial integrity and prevents ticket issuance before funds are verified. 
- *Implementation*: Registrations halt at a `pending_approval` state. Tickets and QR codes are conditionally suppressed on the frontend until the organizer invokes the backend approval route, which also decrements merchandise stock.

**6. Automated Ticket Delivery & QR Generation**
- *Feature*: Asynchronous delivery of rich HTML confirmation emails containing a generated QR ticket.
- *Justification*: Professionalises the event experience and provides participants with offline gating.
- *Implementation*: Integrates `Nodemailer` with `EJS` templates. `qrcode` generates base64 images injected directly into the HTML body. Triggered automatically post-registration or post-payment approval.

### Tier C: Review Systems & Security (10 Marks)
**7. Double-Blind Feedback System**
- *Feature*: Post-event sentiment collection allowing participants to rate/review anonymously or publicly.
- *Justification*: Organizers need candid analytics to improve future events, which anonymity encourages.
- *Implementation*: The `Feedback` model includes an `isAnonymous` flag. The backend sanitization layer (`getEventFeedback`) explicitly `null`s the participant name in outgoing JSON if the flag is true, ensuring anonymity is cryptographically guaranteed at the API level, not just visually hidden.

**8. Secure Password Recovery & Bot Prevention**
- *Feature*: Time-limited email recovery links protected by Google reCAPTCHA.
- *Justification*: Prevents brute-forcing of the reset endpoint and secures user accounts against hijacking.
- *Implementation*: Implements a short-TTL `PasswordResetRequest` model. The frontend enforces a reCAPTCHA v2 challenge, verified via Google's API on the backend, before issuing the cryptographically hashed reset token via email.

## 3. Database Structure

All data is stored in **MongoDB** using **Mongoose** schemas.

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | Participants | `email`, `password` (hashed), `participantType` (iiit/non-iiit), `interests`, `followedOrganizers` |
| `Organizer` | Event clubs/committees | `name`, `category`, `loginEmail`, `password` (hashed), `isActive` |
| `Admin` | Platform superusers | `email`, `password` (hashed) |
| `Event` | Core event entity | `type`, `status`, `isTeamEvent`, `teamSize`, `eligibility`, `customForm`, `merchandiseItems`, `registrationFee` |
| `Registration` | Participant ↔ Event link | `status`, `paymentStatus`, `ticketId`, `qrCode`, `merchandiseSelections`, `formResponses`, `paymentProofUrl` |
| `Team` | Team management | `leader`, `members`, `maxSize`, `status`, `inviteCode`, `memberFormResponses` |
| `Feedback` | Post-event reviews | `rating`, `comment`, `isAnonymous` |
| `ForumMessage` | Event discussion threads | `event`, `sender`, `content` |
| `PasswordResetRequest` | Token-based password recovery | `user`, `userType`, `token` (hashed), `expiresAt` |

---

## 4. Setup & Installation

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** (local) or a **MongoDB Atlas** URI
- A Gmail account with an App Password (for email features) *(optional)*

### Step 1 — Extract the Repository
```bash
unzip dass_a1.zip
cd dass_a1
```

### Step 2 — Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/dassDB
JWT_SECRET=your_jwt_secret_here

# Optional: Email features (tickets, password reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Optional: reCAPTCHA
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
```

Start the dev server:
```bash
npm run devStart
```
> Server runs at `http://localhost:5000` (REST API + WebSocket).

### Step 3 — Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file inside `frontend/`:
```env
VITE_API_URL=http://localhost:5000/api

# Optional: reCAPTCHA site key (public)
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

Start the dev server:
```bash
npm run dev
```
> Frontend runs at `http://localhost:5173`.

### Step 4 — First Access
- **Participants**: Register at `/register` with any email.
- **Organizers**: Must be created by an Admin from the `/admin` portal.
- **Admin**: Seed the initial admin by running in the backend directory:
  
---

*For deployment, the frontend is configured for **Vercel** and the backend for **Render**. Set the same environment variables in each platform's dashboard.*
