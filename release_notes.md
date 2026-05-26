# Release Notes — ACHARIYA Online Examination & Assessment System

**Version**: `1.0.0 (Initial Release)`  
**Release Date**: May 26, 2026  
**Lead Developer**: **Sabari Shanmuga Priyan K**

---

## 📌 Executive Summary
Welcome to the inaugural release of the **ACHARIYA Online Examination and Assessment System**. This platform serves as a modern, high-integrity educational testing and recruitment screening infrastructure. Leveraging Google Gemini AI models, locked-down browser proctoring, and comprehensive analytics, the portal allows educators and recruiters to securely onboard users, generate smart question banks, and review live candidate session metrics.

---

## 🚀 Key Features

### 👤 1. Super Admin Console
* **Staff Registries**: Manage lists, designation metadata, and permissions for educators and recruiters.
* **Bulk Teacher Onboarding**: Upload excel spreadsheets (`.xlsx`) to onboard hundreds of faculty profiles simultaneously.
* **System Metrics Audits**: Monitor platform-wide stats, including total tests created, active rooms, and turnout metrics.
* **Educator Account Verification**: Manually activate profiles or reset passwords.

### 🎓 2. Educator Hub (Teacher Portal)
* **Secure OTP Verification**: Hashed verification token emails for activation and password resets.
* **AI Question Bank Generator**: Input text or upload course documents (PDF, DOCX, TXT) and align settings (grade level, syllabus board, difficulty, standard vs. HOTS styles). The Google Gemini AI model automatically parses details to draft custom MCQs, short answers, and True/False questions.
* **Assessment Management**: Draft, modify, rearrange questions via drag-and-drop, toggle public/private pool settings, and export questions as custom PDFs.
* **Live Proctoring Sessions**: Launch live student assessment classrooms, generate unique access keys, and monitor candidate screens in real-time.

### 👔 3. Recruiter Console
* **Applicant Screening Tests**: Custom hiring assessments tailored to teaching vs. non-teaching departments and job positions.
* **Supervisor Control Center**: Launch live proctored recruitment assessments, track active applicant lists, and inspect individual progress.
* **Real-time Anti-Cheat Intercepts**: Enable automatic disqualification flags that terminate candidate sessions if they switch tabs.
* **Deduplicated Registries**: Track candidate stats, timeline charts, and score percentages across multiple attempts.

### ✍️ 4. Student & Candidate Examination Terminal
* **Secure Proctor Room**: Fullscreen check enforcement and live event logging.
* **Real-time SSE Proctored Sync**: Real-time communication via Server-Sent Events (SSE) that logs tab switches or focus changes back to the educator/recruiter dashboards.
* **Dynamic Timer controls**: Automatically submits assessments once duration is exceeded.

---

## 🛠️ Technical Architecture

### Core Tech Stack
* **Framework**: Next.js `16.2.6` (built and optimized using Turbopack)
* **Runtime**: React `19.2.4` and TypeScript `5`
* **Database**: PostgreSQL with Prisma ORM `7.8.0` for structured schemas
* **Styles**: TailwindCSS `4` with a premium zero-border-radius flat aesthetic

### Platform Integrations & Libraries
* **AI Engine**: `@google/generative-ai` for custom Gemini model calls
* **Document Parsers**: `pdf-parse` (PDF) and `mammoth` (DOCX) for file uploading
* **Data Processing**: `xlsx` for parsing bulk Excel onboardings
* **Authentication**: `bcryptjs` and `jsonwebtoken`
* **Mailer**: `nodemailer` for OTP verification codes
* **PDF Exporter**: `@react-pdf/renderer` for high-fidelity PDF exports
* **Animations**: `framer-motion` for smooth UI transitions and sidebars

---

## 📱 Mobile Responsiveness Update (v1.0.0 Refinements)
* **Slide-out Drawer Navigation**: Left-to-right drawer sidebar toggles for mobile viewports using high-fidelity animations.
* **Top Header Top-Bar**: Renders branding elements and hamburger toggle controls on small devices.
* **Dynamic Padding Scales**: Media queries scoped to portal content to scale padding down on small screens, preventing scroll overflow.
* **Table Responsiveness**: Wrapped data registries in horizontal scrolls.
