# broo.email

A real, self-hosted email service — built from scratch, not a wrapper around an existing provider. Custom SMTP server receives live internet mail on a real domain, with a full auth system, React frontend, and outbound delivery via Resend.

Live : www.broo.email

## Why This Project

Building a real email service means implementing the actual SMTP protocol — not calling an API, but writing the server that receives raw internet traffic on port 25, parses it, and stores it. It touches DNS (MX records), networking (cloud security groups, reverse proxying), and the practical trade-offs of running mail infrastructure (why outbound sending goes through a relay instead of the raw server, for instance).

It's tested against real mail — Gmail sends to this domain, and it works.
## Architecture

**Inbound flow:** Gmail (or any mail server) → SMTP (port 25) → AWS EC2 → Custom SMTP server (smtp-server + mailparser) → MongoDB Atlas

**Backend (on EC2):**
- Custom SMTP server — receives real internet email
- Express REST API — auth, email CRUD, storage limits
- Nginx + Let's Encrypt — HTTPS reverse proxy
- PM2 — keeps everything running, auto-restarts on crash or reboot

**Outbound flow:** Backend → Resend API (SPF/DKIM verified) → recipient's mail server

**Frontend:** React app on Vercel (HTTPS) → talks to backend over `api.broo.email` → Socket.io for real-time inbox updates

## Features

- **Real SMTP receiving** — own mail server on a custom domain (`broo.email`), verified reachable from the public internet (MXToolbox, live Gmail delivery)
- **Auth** — email/password (bcrypt + JWT) and Google OAuth
- **Email client UI** — inbox, sent, starred, trash, search, compose, reply/forward, attachments
- **Storage limits** — 100MB per user, enforced server-side
- **Real-time updates** — Socket.io pushes new mail to the inbox without refresh
- **Outbound sending** — via Resend API with domain-verified SPF/DKIM/DMARC

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), smtp-server, mailparser, Passport (Google OAuth), JWT, Socket.io, PM2
**Frontend:** React, Tailwind CSS, Axios, Socket.io-client
**Infra:** AWS EC2, Nginx, Let's Encrypt (Certbot), MongoDB Atlas, Vercel, Resend

## Key Engineering Decisions & Trade-offs

- **Outbound relay instead of self-hosted sending**: a brand-new domain has zero sender reputation — mail sent directly from a fresh IP is likely to be marked spam or bounced. Outbound delivery goes through Resend (with SPF/DKIM configured), while inbound receiving is fully self-hosted.
- **Nginx as HTTPS reverse proxy**: the Node process listens on plain HTTP internally; Nginx terminates TLS and forwards to it, avoiding the complexity of handling certificates inside the app itself.
- **PM2 over a raw process**: ensures the backend survives crashes and server reboots without manual intervention.

## Local Setup

```bash
# Backend
cd backend
npm install
# create .env with MONGO_URI, JWT_SECRET, RESEND_API_KEY,
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL,
# FRONTEND_URL, PORT, SMTP_PORT, ATTACHMENT_STORAGE_PATH
npm start

# Frontend
cd frontend
npm install
# create .env with VITE_API_URL
npm run dev
```
