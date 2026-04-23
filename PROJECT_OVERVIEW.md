# Recruitment Dashboard - Complete Project Overview

## Project Summary
**Name:** Recruitment Dashboard (database-t_t)
**Type:** Next.js Full-Stack Web Application
**Purpose:** Applicant Tracking System (ATS) for recruitment management with AI-powered resume optimization

---

## 🏗️ Technology Stack

### Core Framework
- **Next.js 16.1.6** with App Router
- **React 19.2.3** with Server Components
- **TypeScript 5.x** for type safety
- **Tailwind CSS 4** for styling

### Backend & Database
- **PostgreSQL** database (via Neon/Vercel)
- **Prisma 6.15.0** ORM for database management
- **Next-Auth 5.0** for authentication with JWT sessions

### UI Components
- **Radix UI** primitives (Dialog, Dropdown, Select, Tabs, etc.)
- **Lucide React** for icons
- **Sonner** for toast notifications
- **TanStack Table** for data tables
- **React Hook Form + Zod** for form validation

### External Integrations
- **OpenAI/NVIDIA API** for AI-powered resume analysis
- **Google Calendar API** for interview scheduling
- **Twilio WhatsApp API** for notifications
- **Vercel Blob Storage** for file uploads
- **Inngest** (stub implementation) for background jobs

---

## 📊 Database Schema

### Core Entities

#### 1. **Recruiter** (Users)
- User authentication and management
- Roles: ADMIN or RECRUITER
- Google Calendar OAuth integration
- WhatsApp notification preferences
- Profile photos and contact information

#### 2. **Candidate** (Job Seekers)
- Full profile information (name, email, phone, LinkedIn)
- Skills, experience, location, notice period
- Expected CTC and employment preferences
- Status: ACTIVE, ON_HOLD, PLACED, REJECTED
- Employment types: FULL_TIME, PART_TIME, FREELANCE, CONTRACT, INTERNSHIP
- Work modes: ON_SITE, HYBRID, REMOTE
- Candidate types: OPT, FULL_TIME, C2C
- Resume and profile photo storage
- UV (Undetectable Video) credentials

#### 3. **Application** (Job Applications)
- Links candidates to specific job opportunities
- Job details: title, company, URL, source
- Tech tags for skill matching
- Status tracking: APPLIED → INTERVIEW_SCHEDULED → FEEDBACK_RECEIVED → OFFER_EXTENDED → PLACED/REJECTED/ON_HOLD
- Resume tracking (which version was used)
- Multiple rounds per application

#### 4. **Round** (Interview Rounds)
- Interview scheduling and tracking
- Round type, date, time, timezone, duration
- Interview mode and VC receiver link
- Frontend/Lipsync flags for technical requirements
- Status: PENDING, CLEARED, RESCHEDULED, FAILED
- Google Calendar event integration
- WhatsApp reminder system with job scheduling

#### 5. **OptimizedResume** (AI Resume Studio)
- AI-powered resume optimization feature
- Job description matching
- Compatibility scoring with detailed breakdown
- ATS-friendly formatting
- Multiple resume versions per candidate
- Status: SCORED, OPTIMIZED

---

## 🎯 Key Features

### 1. **Authentication & Authorization**
- Email/password authentication with bcrypt
- JWT-based session management
- Role-based access control (ADMIN vs RECRUITER)
- Secure route protection with middleware
- Session persistence for 30 days

### 2. **Dashboard (Recruiter View)**
**Routes:** `/dashboard`
- Statistics cards showing key metrics
- Candidate overview cards
- Quick access to candidates and applications
- Recent activity tracking

**Sub-pages:**
- `/dashboard/candidates` - Browse all candidates
- `/dashboard/candidates/[id]` - Candidate profile with tabs
- `/dashboard/candidates/[id]/add-application` - Create new application
- `/dashboard/applications` - View all applications
- `/dashboard/resume-studio` - AI resume optimizer

### 3. **Admin Panel**
**Routes:** `/admin`
- Complete system overview
- User management capabilities

**Sub-pages:**
- `/admin/employees` - Manage recruiters
- `/admin/employees/[id]` - Recruiter profile details
- `/admin/candidates` - View all candidates (all recruiters)
- `/admin/candidates/[id]` - Full candidate details
- `/admin/settings` - System configuration
- `/admin/resume-studio` - Admin view of resume optimization

### 4. **Candidate Management**
**Features:**
- Add new candidates with detailed profiles
- Upload resumes (DOC, DOCX support)
- Track candidate status throughout recruitment lifecycle
- Link candidates to multiple job applications
- Profile photos via blob storage
- Search and filter capabilities
- Edit candidate information

**Components:**
- `AddCandidateForm` - Create new candidates
- `EditCandidateForm` - Update candidate info
- `CandidateProfile` - Display candidate details
- `CandidateTable` - List view with sorting/filtering
- `CandidateDetailModal` - Quick view popup

### 5. **Application Tracking**
**Features:**
- Link candidates to job opportunities
- Track application status through pipeline
- Associate resumes with specific applications
- Tech tag management for skill matching
- Source tracking (LinkedIn, Indeed, referral, etc.)
- Timeline view of application progress

**Components:**
- `AddApplicationForm` - Create new applications
- `ApplicationsList` - View candidate applications
- Status badges and progress indicators

### 6. **Interview Round Management**
**Features:**
- Schedule interview rounds with full details
- Multiple round types (phone screen, technical, HR, etc.)
- Google Calendar integration for automatic event creation
- WhatsApp notifications for:
  - New round creation
  - Pre-interview reminders
  - Status updates
- Track frontend/lipsync requirements
- Record feedback and outcomes
- Reschedule capabilities

**Components:**
- `RoundCard` - Display round information
- `RoundFormBlock` - Create/edit rounds

**Integrations:**
- **Google Calendar OAuth** - Two-way sync with recruiter calendars
- **WhatsApp via Twilio** - Automated notifications with phone validation
- **Reminder System** - Configurable timing (default 60 minutes before)

### 7. **AI Resume Studio** 🤖
**Routes:**
- `/dashboard/resume-studio` (Recruiter)
- `/admin/resume-studio` (Admin)

**Features:**
- Upload candidate resume and job description
- AI-powered compatibility scoring
- Detailed score breakdown by category
- Personalized improvement suggestions
- ATS-optimized resume generation
- Formatted resume generation (professional layout)
- Resume version tracking

**Technical Implementation:**
- Uses NVIDIA/OpenAI API for AI processing
- Extracts text from DOC/DOCX files (mammoth, word-extractor)
- Generates resumes in DOCX format
- Stores all versions in Vercel Blob storage
- Tracks which resume was used for which application

**Components:**
- `ResumeStudioPage` - Main interface
- `AdminResumeStudioPage` - Admin view with all candidates

### 8. **Employee Management** (Admin Only)
**Features:**
- Add/edit/delete recruiters
- Assign roles (ADMIN/RECRUITER)
- View recruiter performance
- Manage permissions
- Password changes

**Components:**
- `EmployeeTable` - List all recruiters
- `AddEmployeeModal` - Create new users
- `EditEmployeeModal` - Update user details
- `ChangePasswordModal` - Password management

### 9. **Settings**
**Routes:**
- `/settings` (Recruiter)
- `/admin/settings` (Admin)

**Features:**
- Profile management
- Google Calendar connection
- WhatsApp notification preferences
- Reminder timing configuration
- Password changes

**Components:**
- `SettingsForm` - Unified settings interface

### 10. **File Upload System**
**API Routes:** `/api/uploads/resume`

**Features:**
- Resume upload via Vercel Blob
- Support for DOC and DOCX files
- Automatic file validation
- Secure URL generation
- File size limits and type checking

### 11. **Phone & WhatsApp Utilities**
**Library:** `/lib/phone-utils.ts`

**Features:**
- Indian phone number validation
- Format normalization (various input formats)
- WhatsApp format conversion
- Display formatting for UI
- Comprehensive error handling
- Test coverage

### 12. **Theme System**
- Dark/Light mode support
- System preference detection
- Persistent theme selection
- Theme toggle component

---

## 🗂️ Project Structure

```
/home/runner/work/database-t_t/database-t_t/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
├── public/                     # Static assets
├── src/
│   ├── actions/               # Server Actions
│   │   ├── applications.ts    # Application CRUD
│   │   ├── candidates.ts      # Candidate CRUD
│   │   ├── employees.ts       # User management
│   │   ├── resume-studio.ts   # AI resume operations
│   │   ├── rounds.ts          # Interview scheduling
│   │   └── settings.ts        # Settings management
│   ├── app/                   # Next.js App Router
│   │   ├── (routes)/          # Page routes
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/                # Reusable UI components
│   │   ├── admin/             # Admin-specific components
│   │   ├── candidates/        # Candidate components
│   │   ├── applications/      # Application components
│   │   ├── rounds/            # Round components
│   │   └── dashboard/         # Dashboard components
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Prisma client
│   │   ├── resume-ai.ts       # AI resume processing
│   │   ├── resume-docx.ts     # DOCX generation
│   │   ├── whatsapp.ts        # WhatsApp integration
│   │   ├── google-calendar.ts # Calendar integration
│   │   ├── phone-utils.ts     # Phone validation
│   │   └── utils.ts           # General utilities
│   ├── types/                 # TypeScript types
│   └── inngest/               # Background jobs (stub)
├── scripts/                    # Utility scripts
├── middleware.ts              # Route protection
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

---

## 🔐 Security Features

1. **Password Security**
   - bcrypt hashing for all passwords
   - Secure password validation
   - Password change functionality

2. **Authentication**
   - JWT-based sessions
   - Secure cookie handling
   - Automatic session refresh
   - NEXTAUTH_SECRET for encryption

3. **Authorization**
   - Role-based access control
   - Middleware route protection
   - Server-side permission checks
   - Admin-only features locked down

4. **Data Protection**
   - Cascade deletes for data integrity
   - Database constraints and indexes
   - Input validation with Zod
   - SQL injection prevention via Prisma

---

## 🔄 Workflow Overview

### Typical Recruitment Flow:

1. **Recruiter logs in** → Authenticated via NextAuth
2. **Adds candidate** → Form with full profile + resume upload
3. **Optimizes resume (optional)** → AI Resume Studio scores and optimizes
4. **Creates application** → Links candidate to job opportunity
5. **Schedules rounds** →
   - Creates interview with all details
   - Google Calendar event auto-created
   - WhatsApp notification sent to recruiter & admin
6. **Before interview** →
   - Inngest (or cron) triggers reminder job
   - WhatsApp reminder sent based on timing preference
7. **After interview** →
   - Updates round status (CLEARED/FAILED/RESCHEDULED)
   - Status notification sent via WhatsApp
8. **Application progresses** →
   - Status updated through pipeline
   - Multiple rounds can be added
9. **Candidate placed** →
   - Status changed to PLACED
   - Admin notified via WhatsApp

---

## 🚀 Development Scripts

```bash
npm run dev              # Start dev server with Prisma setup
npm run build            # Production build with migrations
npm run start            # Start production server
npm run lint             # Run ESLint
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
```

---

## 🔑 Environment Variables Required

```env
# Database
DATABASE_URL=         # PostgreSQL connection string
DIRECT_URL=          # Direct database connection

# Authentication
NEXTAUTH_SECRET=     # JWT encryption secret
NEXTAUTH_URL=        # Application URL

# OpenAI/NVIDIA
NVIDIA_API_KEY=      # For AI resume processing

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=
```

---

## 📦 Key Dependencies

**Core:**
- next@16.1.6 (React framework)
- react@19.2.3 (UI library)
- typescript@5 (Type safety)

**Database:**
- @prisma/client@6.15.0 (ORM)
- prisma@6.15.0 (CLI)

**Authentication:**
- next-auth@5.0.0-beta.30 (Auth)
- bcryptjs@3.0.3 (Password hashing)

**AI & Document Processing:**
- openai@6.32.0 (AI API)
- docx@9.6.1 (DOCX generation)
- mammoth@1.12.0 (DOCX parsing)
- word-extractor@1.0.4 (DOC parsing)

**Integrations:**
- googleapis@144.0.0 (Google Calendar)
- twilio@5.5.0 (WhatsApp)
- @vercel/blob@2.3.1 (File storage)

**UI:**
- @radix-ui/* (Component primitives)
- @tanstack/react-table@8.21.3 (Tables)
- lucide-react@0.577.0 (Icons)
- tailwindcss@4 (Styling)

**Forms & Validation:**
- react-hook-form@7.71.2 (Forms)
- zod@4.3.6 (Validation)
- @hookform/resolvers@5.2.2 (Form validation bridge)

---

## 🎨 UI/UX Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Mode** - Full theme support with persistence
- **Toast Notifications** - User feedback via Sonner
- **Modal Dialogs** - For quick actions without navigation
- **Data Tables** - Sortable, filterable tables with pagination
- **Form Validation** - Real-time validation with error messages
- **Loading States** - Progress indicators for async operations
- **Admin Sidebar** - Navigation for admin features
- **Recruiter Sidebar** - Navigation for recruiter features
- **Top Bar** - User profile, theme toggle, logout

---

## 🧪 Testing

- Phone utility tests: `phone-utils.test.ts`
- Test framework: Jest (configured in devDependencies)

---

## 🔧 Utility Scripts

Several batch/JS scripts for maintenance:
- `COMPLETE-FIX.bat` - Project setup automation
- `create-google-oauth.js` - Google OAuth configuration
- `create-dirs.js` - Directory structure creation
- `check-prisma.js` - Prisma validation
- `fix-prisma.js` - Prisma troubleshooting
- `debug-login.mjs` - Authentication debugging

---

## 📱 Notification System

### WhatsApp Notifications Include:
1. **Round Created** - Full interview details
2. **Round Reminder** - Pre-interview reminder (configurable timing)
3. **Status Changed** - Round outcome updates
4. **Candidate Placed** - Placement success (admin only)

### Phone Number Validation:
- Supports multiple Indian formats
- Validates 10-digit mobile numbers
- Auto-formats to WhatsApp format (whatsapp:+91XXXXXXXXXX)
- Comprehensive error handling

---

## 🎓 Current Development Status

Based on git history:
- **Latest Commit:** "Initial plan"
- **Previous Commit:** "changes are added like chage the recurter and all"

The project appears to be **fully functional** with all major features implemented:
- ✅ Complete authentication system
- ✅ Full CRUD operations for all entities
- ✅ Google Calendar integration
- ✅ WhatsApp notifications
- ✅ AI Resume Studio
- ✅ Admin and recruiter panels
- ✅ Interview scheduling and tracking
- ✅ File upload system
- ✅ Theme system
- ✅ Comprehensive database schema

---

## 🎯 Use Cases

1. **Recruitment Agencies** - Manage multiple candidates and job applications
2. **Corporate HR Teams** - Track internal recruitment processes
3. **Staffing Companies** - Handle high volume of placements
4. **Contract Recruiters** - Organize client requirements and candidates
5. **Technical Recruiting** - Track multiple interview rounds with tech assessments

---

## 💡 Unique Selling Points

1. **AI-Powered Resume Optimization** - Automatic resume tailoring for job descriptions
2. **Integrated Communications** - WhatsApp notifications built-in
3. **Calendar Automation** - Auto-sync interviews with Google Calendar
4. **Comprehensive Tracking** - From first contact to placement
5. **Multi-role Support** - Admin oversight with recruiter autonomy
6. **Modern Tech Stack** - Latest Next.js, React 19, TypeScript
7. **Indian Market Focus** - Phone validation, timezone support for Indian users

---

## 📈 Future Enhancement Opportunities

Based on the structure, potential additions could include:
- Email notifications (currently WhatsApp only)
- Candidate portal for self-service
- Advanced reporting and analytics
- Interview feedback forms
- Offer letter generation
- Integration with job boards (LinkedIn, Indeed)
- Bulk import/export functionality
- Advanced search with filters
- Document templates
- Interview recording integration

---

## Summary

This is a **production-ready, full-stack Applicant Tracking System** built with modern technologies. It handles the complete recruitment lifecycle from candidate sourcing through placement, with AI-powered resume optimization, automated scheduling, and multi-channel notifications. The system supports both admin and recruiter roles, with comprehensive features for managing candidates, applications, and interview rounds.
