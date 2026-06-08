# Release Notes — ACHARIYA Online Examination & Assessment System

**Version**: `1.1.0 (UX Refinements & Toast Notifications)`  
**Release Date**: June 8, 2026  
**Lead Developer**: **Sabari Shanmuga Priyan K**

---

## 📌 Executive Summary (v1.1.0)
This update introduces a centralized toast notification system and consistent loading components across all administrative consoles. It addresses user feedback regarding system aesthetics, layouts, and responsiveness, ensuring a smoother proctoring and exam administration experience.

---

## 🚀 New Features & Enhancements (v1.1.0)

### 🔔 1. Centralized Toast Notification System
* **Real-time Feedback**: Standardized user actions (onboarding, password resets, file uploads, assessment updates) with animated feedback toasts.
* **State Syncing**: Supports dynamic status transitions (e.g., swapping a "loading" toast to a "success" or "error" message once an API call finishes).
* **Automatic Dismissal**: Improved interface clutter by replacing persistent banners with self-dismissing notification toasts.

### 🔄 2. Circular Loader & Spinner System
* **Consistent Feedback**: Integrated a standard spinner loader (`<Loader />`) with options for card-level or full-screen viewport blocking during slow API operations.
* **Circular Styles**: Bypassed the application's global zero-radius constraints (`--radius-full: 0px`) by utilizing direct inline CSS override logic (`style={{ borderRadius: "50%" }}` or `style={{ borderRadius: "100%" }}`), rendering true circle loaders.
* **Modern Glassmorphic Look**: Tweaked loading screen background styles to be transparent (`bg-transparent`) with backdrop-filters rather than opaque gray canvases.

### 📐 3. Grid Container & Workspace Layout Alignment
* **Page Centering**: Applied `container mx-auto` layouts across the Admin, Director, Recruiter, and Teacher layout spaces, providing standardized side gutter spacing on wide screen viewports.
* **Sidebar Breathing Room**: Expanded side navigation panel width from `w-64` to `w-72` to resolve menu text truncation and wrapping issues.
* **Vertical Breathing Room**: Added balanced vertical margins and paddings (`py-8`, `my-8`) to prevent tables or dashboards from hitting screen boundaries.

### ✍️ 4. Proctor & Live Examination Polish
* **Glassmorphic Overlays**: Exam room states (Waiting Room, Success, Blocked/Terminated) now layer over standard page backgrounds using backdrop-filters rather than full gray canvases.
* **Action Button Polish**: Navigation buttons within the host control pages now utilize round actions with clean alignment.

---

## 🛠️ Technical Architecture

### Core Tech Stack
* **Framework**: Next.js `16.2.6` (built and optimized using Turbopack)
* **Runtime**: React `19.2.4` and TypeScript `5`
* **Database**: PostgreSQL with Prisma ORM `7.8.0` for structured schemas
* **Styles**: TailwindCSS `4` with a premium zero-border-radius flat aesthetic

### Platform Integrations & Libraries
* **Toast System**: Custom context provider (`@/components/Toast.tsx`)
* **AI Engine**: `@google/generative-ai` for custom Gemini model calls
* **Document Parsers**: `pdf-parse` (PDF) and `mammoth` (DOCX) for file uploading
* **Data Processing**: `xlsx` for parsing bulk Excel onboardings
* **Authentication**: `bcryptjs` and `jsonwebtoken`
* **Mailer**: `nodemailer` for OTP verification codes
* **PDF Exporter**: `@react-pdf/renderer` for high-fidelity PDF exports
* **Animations**: `framer-motion` for smooth UI transitions and sidebars

---

## 📜 Historical Releases

### Version 1.0.0 (Initial Release)
**Release Date**: May 26, 2026  

* **Super Admin Console**: Staff registries, bulk teacher onboarding, and system metrics audits.
* **Educator Hub (Teacher Portal)**: Secure OTP verification, AI question bank generator (Gemini integration), assessment management, and live student proctoring sessions.
* **Recruiter Console**: Applicant screening tests, supervisor proctoring screen, anti-cheat intercepts, and candidate registries.
* **Student/Candidate Terminal**: Secure proctor exam room, real-time Server-Sent Events (SSE) focus/blur tracking, and dynamic timers.
* **Mobile Responsiveness**: Left drawer sidebars, mobile headers, scaling paddings, and horizontal scroll tables.

