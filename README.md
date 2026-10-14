# AttendEase Enterprise – Employee Attendance Management System

[![Database](https://img.shields.io/badge/Database-Live_MongoDB_Atlas-47A248?logo=mongodb)](https://mongodb.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?logo=react)](https://react.dev/)
[![Design](https://img.shields.io/badge/Design-Quiet_Luxury_Executive_UI-0F172A)](https://tailwindcss.com/)
[![Backend](https://img.shields.io/badge/Backend-Node.js_%2B_Express-339933?logo=node.js)](https://expressjs.com/)

An institutional-grade, full-stack Workforce Attendance Management System engineered for daily shift timekeeping, attendance tracking, overtime duty, compliance monitoring, and formal institutional PDF reporting.

Built in strict compliance with the **Final Project Evaluation Rubric (100 Points)** and styled with an executive **Quiet Luxury UI** (`#2D2630` Aubergine and `#DFC090` Gold).

---

## 👥 Project Team Members & Roles

| No. | Member Name | Institutional Role | System Username | Default Password | Linked Profile |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Ellica Chris Onggoco** | **Group Leader & System Admin** | `ellica` | `admin123` | Project Director & System Administrator |
| **2** | **John Herzsel Datul** | Lead Systems Architect | `herzsel` | `employee123` | Senior Full-Stack Software Engineer |
| **3** | **John Rafael Corpuz** | Systems Analyst | `rafael` | `employee123` | Database Administrator & Systems Analyst |
| **4** | **Neil Chester Mari Garcia** | UI/UX Specialist | `neil` | `employee123` | Frontend & User Experience Engineer |
| **5** | **John Michael Nolasco** | QA & Operations Lead | `michael` | `employee123` | Operations & Quality Assurance Lead |
| **6** | **Diether Baculpo** | HR Compliance Officer | `diether` | `employee123` | Human Resources & Personnel Specialist |
| **7** | **Clark Manlapaz** | Financial Analyst | `clark` | `employee123` | Financial Operations & Analytics Specialist |

---

## 🚀 Quickstart Guide for Team Members

### 1. Clone the Repository
```bash
git clone https://github.com/ellicaonggoco/advancewebprogramming.git
cd advancewebprogramming
```

### 2. Run the Backend API
```bash
cd backend
npm install
node server.js
```
* Backend runs at `http://localhost:5000`
* Health Check: `http://localhost:5000/api/health`
* Live Database: Automatically connects to MongoDB Atlas cluster (`attendance_db`).

### 3. Run the Frontend (in a second terminal)
```bash
cd frontend
npm install
npm run dev
```
* Frontend runs at `http://127.0.0.1:5173`
* Open your browser and log in with any of the team accounts above.

---

## 🌟 Key System Features

1. **Workforce Shift Timekeeping & Overtime (OT):**
   - **Record Time-In & Record Time-Out:** 2nd verification confirmation modals to prevent accidental punches.
   - **Shift Preservation:** Completed shifts are permanently committed to the timeline upon Time-Out and are never deleted.
   - **Overtime (OT) Duty:** Allows clocking in for Overtime/Extended Duty after a regular shift, tracking and crediting OT hours separately.
   - **DOLE Working Hours Compliance:**
     - `< 1 hour` worked $\rightarrow$ **Incomplete Shift** (Below threshold, not credited)
     - `1 to 3.99 hours` worked $\rightarrow$ **Undertime**
     - `4 to 7.49 hours` worked $\rightarrow$ **Half-Day**
     - `7.5+ hours` worked $\rightarrow$ **Present (Whole Day)**
     - Late calculation with a 15-minute grace period (standard shift starts at 9:00 AM).

2. **1-Click Direct PDF Document Generation:**
   - **Attendance Timesheet Audit:** Filter by date, month, department, or status $\rightarrow$ Download landscape PDF audit report.
   - **Time Corrections & Adjustments Audit:** Download official PDF audit trail of filed adjustment disputes and supervisor review notes.
   - **Workforce Directory:** Export institutional roster as PDF with salary, position, and department breakdown.
   - **Leave Applications:** Audit report of filed vacation, sick, and emergency leaves.
   - **Institutional Reports & Compliance:**
     - Report 1: Monthly Attendance Summary & DOLE Compliance Audit Report.
     - Report 2: Department Cross-Analytics & Punctuality Audit Report (with academic evaluation signature lines).

3. **Complete Testing & Walkthrough Guide (PDF):**
   - Pre-generated 719 KB full-color testing document located at [`SYSTEM_TESTING_GUIDE.pdf`](./SYSTEM_TESTING_GUIDE.pdf).
   - Also directly downloadable from the Dashboard top banner via the **Testing Guide (PDF)** button.

4. **Dual Data Resilience:**
   - Primary: Live cloud **MongoDB Atlas** database cluster.
   - Secondary: High-performance, zero-crash In-Memory Data Store fallback.

5. **MySQL Script for Academic Submission:**
   - Complete MySQL DDL & DML script containing 6 relational tables, primary keys, foreign keys, constraints, and sample data is available at:
     [`backend/database/attendance_system.sql`](./backend/database/attendance_system.sql).
