# 🎓 Campus Connect Pro — Premium Placement ERP
> **A State-of-the-Art, Real-time Enterprise Resource Planning (ERP) System for Modern Educational Institutions.**

---

![Banner](https://raw.githubusercontent.com/ChetanSharma820/Campus-Placement-System-/main/banner.png) 
*(Note: User can replace this with a real banner later)*

<div align="center">

[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-Fast-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

</div>

---

## 🌟 Vision & Overview
**Campus Connect Pro** is not just a placement portal; it's a high-performance **ERP Ecosystem** designed to bridge the gap between students, training and placement officers (TPOs), and corporate hiring partners. Built with **Glassmorphism UI** and **Real-time Synchronization**, it provides a seamless, transparent, and automated recruitment experience.

---

## 🚀 Core ERP Modules

### 👨‍🎓 1. Advanced Student Portal
*   **Dynamic Resume Synchronization**: One-click profile updates with real-time academic verification.
*   **Transmission Ledger**: Track every application status (Applied → Shortlisted → Selected) with instant WebSocket feedback.
*   **Eligibility Engine**: Automated filtering based on CGPA, Backlogs, and Branch criteria.
*   **Security First**: Forced password rotation on first login for institutional security.

### 🏢 2. Corporate Pipeline (TPO Suite)
*   **Hiring Partner Management**: Full CRUD for corporate leads, HR contacts, and visit history.
*   **Drive Audit System**: Deep-dive into specific recruitment drives to see participant vectors and success rates.
*   **Active Drives vs. Archive**: Organized view of ongoing vs. completed placement cycles.
*   **Lead Export**: One-click export of corporate leads to CSV/Excel for offline networking.

### 📊 3. Institutional Administration
*   **Batch & Matrix Control**: Manage student lifecycles by Batch (e.g., 2022-2026) and Section units.
*   **Bulk Identity Transmission**: Import 1000+ students in seconds via validated Excel protocols.
*   **Identity Vault**: Secure management of student credentials and profile resets.
*   **Placement Pulse**: Live analytics and statistical tracking of placement percentages across departments.

---

## 🛠️ Technical Architecture

### **The "Glass & Steel" Tech Stack**
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TS | High-fidelity, type-safe interface. |
| **Styling** | Vanilla CSS + Tailwind | Premium Glassmorphism and Micro-animations. |
| **Backend** | Supabase (PostgreSQL) | Real-time database and secure authentication. |
| **Real-time** | WebSocket (Supabase) | Instant data synchronization across all clients. |
| **Auth** | Supabase Auth (JWT) | Secure, role-based access control. |
| **Processing** | Node.js | Automated schema management and data migration. |

---

## 📦 ERP Features & Implementation Details

### ✅ Real-time Synchronization
No more refreshing. Every status change, job posting, and application update is broadcasted instantly via WebSockets.

### ✅ Automated Credentialing
Students login with their **Institutional Roll Number**. The system handles identity creation and initial password enforcement automatically.

### ✅ Defensive Data Logic
Built-in protection against null pointers and mismatched data types. The UI remains stable even with incomplete backend data.

### ✅ High-Performance Data Import
Custom Excel parsing engine with row-level validation and real-time progress indicators.

---

## 🚦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Supabase Account
- PostgreSQL Client (optional)

### 2. Environment Configuration
Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_secret_service_key
```

### 3. Installation & Deployment
```bash
# Install dependencies
npm install

# Initialize Database Schema
node setup_db.mjs

# Run Development Server
npm run dev
```

---

## 📈 Database Schema (ERD Overview)
The system operates on a complex relational schema:
- `profiles`: Central identity table for Auth.
- `student_profiles`: Detailed academic and professional dossiers.
- `jobs`: Corporate recruitment drive manifests.
- `applications`: The "Transaction Ledger" connecting students to corporate entities.
- `academic_config`: Global batch and section matrix.

---

## 🤝 Contributing
Contributions are welcome! Please follow the **Institutional Coding Standards** and ensure all changes are synced with the **Real-time Architecture**.

---

<div align="center">
  <p>Built with ❤️ for Educational Excellence</p>
  <p><strong>Campus Connect Pro © 2026</strong></p>
</div>
