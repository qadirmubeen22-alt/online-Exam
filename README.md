# 🛡️ Online Quiz & Exam Proctoring System (ProctorGuard)

> **1-Year Web Development Course — Final Project Specification**  
> Complete full-stack architecture featuring AI Anti-Cheating & Proctoring, server-validated countdown timers, role-based JWT authentication, interactive Monaco/CodeMirror coding runner, and real-time Teacher Audit Reports.

---

## 🌟 Live Demo & Quick Launch

Both the frontend and backend are pre-configured, tested, and running:

| Service | URL | Role |
| :--- | :--- | :--- |
| **Full-Stack Application** | [http://localhost:5000](http://localhost:5000) | Standalone Server + Production React App |
| **Vite Dev Server (HMR)** | [http://localhost:5173](http://localhost:5173) | Hot Module Reloading for Development |
| **Backend REST API** | [http://localhost:5000/api](http://localhost:5000/api) | Express + JWT + Timer + Proctor Telemetry |

### 🔑 Pre-Seeded Demo Accounts (One-Click Login available on UI)

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Teacher** | `teacher@exam.com` | `teacher123` | Create exams, add MCQs & coding questions, view live audit logs |
| **Student** | `student@exam.com` | `student123` | Take exams, test 3-strike violations, instant auto-graded results |
| **Demo Exam Code** | `DEV101` | — | Pre-loaded exam with MCQs and Coding challenges |

---

## 🚀 Key Features by Architecture Phase

### **Phase 1: Project Setup & Role-Based Authentication**
- **JWT + Bcrypt Security**: Password hashing with salt rounds and 7-day signed JWT tokens.
- **RBAC**: Middleware enforces `teacher` vs `student` access permissions on both frontend and backend.
- **Dual Persistence Architecture**: Fully supports MongoDB via Mongoose, with an automatic zero-config local JSON engine so the application works 100% offline without requiring local MongoDB daemon installation.

### **Phase 2: Teacher Exam & Question Builder**
- **Unique Exam Access Code**: Automatically generates unique, uppercase 6-character access codes (e.g. `DEV101`).
- **Question Bank Manager**:
  - **MCQs**: 4 custom options, radio selection of correct answer, custom marks.
  - **Coding Challenges**: Problem statement, starter code template, sample input/output, marks.
- **Configurable Integrity Limits**: Custom duration (minutes), passing score (%), and max warnings allowed (default: 3 strikes).

### **Phase 3: Student Exam Interface & Countdown Timer**
- **Server-Side Validated Timing**: Timers are tied to server `startedAt` timestamps; manipulating client clocks or DevTools will not bypass expiry.
- **Question Palette**: Live visual grid tracking *Answered* (green), *Marked for Review* (amber), and *Unanswered* (slate).
- **Interactive Code Editor**: Syntax formatting, line numbers, Tab indentation support, and a built-in browser test runner with console output capture.
- **Server-Side Auto-Grading**: MCQs and coding responses are graded on the server when submitted or upon timeout.

### **Phase 4: Anti-Cheating & Proctoring Engine (`useProctoring`)**
- **Tab-Switch & Blur Detection**: Intercepts `document.visibilitychange` and `window.onblur`.
- **Compulsory Fullscreen Mode**: Forces `document.documentElement.requestFullscreen()`; exiting or pressing ESC triggers an immediate warning.
- **Copy-Paste & Context Menu Lock**: Disables `Ctrl+C`, `Ctrl+V`, `Ctrl+X`, and right-click context menu.
- **3-Strike Auto-Termination Policy**: Every violation is logged with a timestamp to `POST /api/proctor/log`. Upon the 3rd strike, the exam auto-terminates and locks the student out immediately!
- **AI Camera Feed HUD**: Biometric tracking viewport simulation with face bounding boxes and gaze telemetry.

### **Phase 5: Results & Proctoring Audit Report**
- **Student Review**: Percentage score, Pass/Fail badge, confetti animations, and question-by-question breakdown.
- **Teacher Audit Ledger**: Displays all student attempts, scores, `Completed` vs `Terminated due to cheating` status, and an expandable timeline showing the exact timestamp and violation type of every strike.
- **Live Monitoring Mode**: Auto-polls every 4 seconds so teachers can watch student strikes happen live during presentations.

---

## 🎓 Viva & Presentation Walkthrough ("Live Dual-Window Demo")

As specified in the blueprint instructions:
1. Open a normal browser window to [http://localhost:5000](http://localhost:5000) and click **"Teacher Demo"** (`teacher@exam.com`).
2. Go to the **Audit Report** for exam `DEV101`. Ensure **"Live Monitoring Active"** is toggled on.
3. Open an **Incognito / Private Window** to [http://localhost:5000](http://localhost:5000) and click **"Student Demo"** (`student@exam.com`).
4. In the Student window, enter code **`DEV101`**, accept the proctoring rules, and click **"Launch Full-Screen & Start Assessment"**.
5. Switch tabs or minimize the student window **3 times**:
   - Strike 1: Amber warning banner displays with audio tone.
   - Strike 2: Strike count updates to 2/3.
   - Strike 3: Exam auto-submits, status flags as **"TERMINATED (CHEATING)"**, and student is locked out.
6. Look back at the Teacher window: The student's attempt immediately updates to **Terminated (0% Trust)** with the exact violation timeline!

---

## 📂 Project Directory Structure

```text
Mubeen1/
├── package.json                   # Root orchestrator scripts
├── server/
│   ├── package.json
│   ├── server.js                  # Express API + Static frontend server
│   ├── test-e2e.js                # Full-pipeline E2E test suite
│   ├── config/
│   │   ├── db.js                  # Hybrid Mongoose + Zero-Config DB connector
│   │   └── seed.js                # Default teacher, student, and DEV101 exam seeder
│   ├── models/
│   │   ├── User.js                # User schema (teacher / student)
│   │   ├── Exam.js                # Exam schema (title, code, duration, maxWarnings)
│   │   ├── Question.js            # MCQ & Coding question schema
│   │   ├── Submission.js          # Answers, scores, status (in-progress/completed/terminated)
│   │   ├── ProctorLog.js          # Timestamped violation records
│   │   └── fileStore.js           # Atomic JSON persistence engine
│   ├── routes/
│   │   ├── authRoutes.js          # Register, Login, JWT verification
│   │   ├── examRoutes.js          # Exam CRUD, code lookup, audit report
│   │   ├── questionRoutes.js      # Add/edit/delete MCQs and coding problems
│   │   ├── submissionRoutes.js    # Start attempt, auto-save answers, server auto-grading
│   │   └── proctorRoutes.js       # Violation logging & 3-strike termination engine
│   └── middleware/
│       └── authMiddleware.js      # JWT verification & Role guards
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx                # Route declarations & role guards
        ├── main.jsx
        ├── context/
        │   └── AuthContext.jsx    # User session, JWT token cache, apiFetch helper
        ├── hooks/
        │   └── useProctoring.js   # Anti-cheating hook (visibility, blur, fullscreen, copy-paste)
        ├── components/
        │   ├── Navbar.jsx         # Navigation bar with user status
        │   ├── QuestionPalette.jsx# Green/Amber/Gray question status grid
        │   ├── CodeEditor.jsx     # Coding sandbox with line numbers & live runner
        │   ├── WarningModal.jsx   # Red pulsing alert dialog for strikes
        │   ├── TrustScoreBadge.jsx# Dynamic integrity trust meter
        │   └── WebcamProctorPreview.jsx # Biometric HUD camera feed
        └── pages/
            ├── Home.jsx           # Landing page with architecture tour & fast login
            ├── Login.jsx          # Login card with demo buttons
            ├── Register.jsx       # Teacher / Student registration
            ├── TeacherDashboard.jsx# Exam cards & KPI metrics
            ├── ExamBuilder.jsx    # Exam creation form with 6-char code generation
            ├── QuestionManager.jsx# MCQ & Coding challenge bank
            ├── StudentLobby.jsx   # Access code validation & proctoring checklist
            ├── StudentExamRoom.jsx# Locked full-screen testing room with live timer
            ├── StudentResult.jsx  # Score, confetti, and question review
            └── ResultReport.jsx   # Phase 5 Teacher Audit Ledger & Timeline
```

---

## 🛠️ CLI Commands

```bash
# Run backend + frontend concurrently in development mode
npm run dev

# Or run backend alone
npm run server

# Or run frontend Vite alone
npm run client

# Run the automated End-to-End Test Suite
node server/test-e2e.js
```
