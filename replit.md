# DivyanshiSolar - Partner Management Platform

## Overview

DivyanshiSolar is a partner management platform for PM Surya Ghar Yojana, India's rooftop solar installation program. The platform enables Business Development Partners (BDPs) to onboard and manage District Development Partners (DDPs), who in turn manage customer applications for solar panel installations.

The application follows a multi-role hierarchy:
- **Admin** - System administrators
- **BDP (Business Development Partner)** - Manages DDPs and oversees customer portfolio
- **DDP (District Development Partner)** - Handles customer onboarding and application tracking

## User Preferences

Preferred communication style: Simple, everyday language.

## Security Notes

**Password Security**: Passwords are now hashed using bcrypt (10 salt rounds). The system supports legacy plain-text passwords for backwards compatibility - when a user with a plain-text password logs in successfully, their password is automatically upgraded to a bcrypt hash.

## Business Rules

### Panel Types & Capacity Options
- **DCR Panels (Domestic Content Requirement)**: 1-100 kW (government subsidy eligible up to 3 kW)
- **Non-DCR Panels**: 1-100 kW capacity options (no subsidy)

### System Pricing
- **DCR Panels with 3-in-1 Hybrid Inverter**: Rs 75/Watt (Rs 75,000/kW)
- **DCR Panels with Ongrid Inverter**: Rs 66/Watt (Rs 66,000/kW)
- **Non-DCR Panels**: Rs 55/Watt (Rs 55,000/kW)

### State Subsidies
- Odisha: +Rs 20,000/kW additional subsidy
- Uttar Pradesh: +Rs 10,000/kW additional subsidy
- (Subsidies are additive to central subsidy for DCR panels only)

### Commission Structure
**DCR Panels:**
- 3 kW: DDP Rs 20,000 | BDP Rs 10,000
- 5 kW: DDP Rs 35,000 | BDP Rs 15,000
- 6-10 kW: DDP Rs 6,000/kW | BDP Rs 3,000/kW

**Non-DCR Panels:**
- All capacities: DDP Rs 4,000/kW | BDP Rs 2,000/kW

**SunPunch 3-in-1 Inverters (per unit sold):**
- DDP: Rs 4,000 | BDP: Rs 1,000
- Commissions auto-generated when inverter order payment is verified

### Razorpay Integration
The platform uses Razorpay for two distinct payment flows:

**1. RazorpayX Payouts (Partner Commissions)**
Commission payouts are processed via RazorpayX Payout API. Partners must add their bank account details to receive payments.

**2. Razorpay Checkout (Customer Payments)**
DDPs can collect payments from customers for solar products and services via the Store page.

**Required Environment Variables:**
- `RAZORPAY_KEY_ID` - Razorpay API Key ID
- `RAZORPAY_KEY_SECRET` - Razorpay API Secret Key
- `RAZORPAYX_ACCOUNT_NUMBER` - Your RazorpayX account number (for payouts)

**Payout Flow:**
1. Commissions are auto-generated when customer installations are completed
2. Admin approves commissions (pending → approved)
3. Admin processes payout via Razorpay (uses Composite API)
4. Payment is transferred to partner's registered bank account

**Customer Payment Flow:**
1. DDP adds products to cart and enters customer details
2. Order is created with server-validated pricing
3. Razorpay Checkout opens for payment
4. Payment signature is verified server-side before capture

**Payment Security:**
- Server-side price validation (client prices ignored)
- Razorpay signature verification required before payment status update
- Order ownership checks prevent unauthorized access
- Idempotent verification handling

### E-commerce System
**Product Categories:**
- `solar_package` - Solar panel installation packages
- `marketing_material` - Brochures, banners, etc.
- `accessory` - Additional solar equipment

**Admin Features:**
- Product management (CRUD)
- Order tracking and status management
- Payment monitoring dashboard

**DDP Store Features:**
- Browse products by category
- Shopping cart with quantity management
- Secure checkout via Razorpay
- Order history and status tracking

### Partner Engagement Features (New)

**1. News & Updates Section**
- Public news feed with categories (news, update, announcement, policy)
- View count tracking and tags support
- Admin management for creating/editing/publishing posts
- Route: `/news`

**2. Panel Comparison Tool**
- Compare DCR vs Non-DCR solar panels
- View specifications: capacity, efficiency, technology, warranty
- Subsidy eligibility indicator
- Route: `/panels`

**3. Partner Leaderboard**
- Monthly, quarterly, and yearly rankings
- Points system: 10 pts/installation, 20 pts/referral, 5 pts/kW
- Badges: Gold, Silver, Bronze, Rising Star
- Route: `/leaderboard`

**4. Referral Program**
- Unique referral codes per partner
- Reward structure: Rs 1,000 for customer referrals, Rs 2,000 for partner referrals
- Referral tracking and status management
- Route: `/referrals` (protected, partner dashboard)

**5. Installation Map View**
- Geographic visualization of completed installations
- State/district grouping with count statistics
- Admin can update customer coordinates

**6. Notification Templates**
- Admin-managed SMS/Email/WhatsApp templates
- Trigger-based automation (status changes, milestones)
- Variable placeholders for personalization

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation
- **Design System**: Material Design 3 principles with Inter/Roboto fonts

The frontend uses a sidebar-based layout with role-based navigation. Protected routes check user authentication and role before rendering.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API under `/api` prefix
- **Session Management**: Express-session with PostgreSQL session store (connect-pg-simple)
- **Build Tool**: Vite for frontend, esbuild for server bundling

The server handles both API routes and serves the static frontend in production. In development, Vite middleware provides hot module replacement.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Generated via `drizzle-kit push`

Key tables:
- `users` - Partners (BDP/DDP) with role-based hierarchy via `parentId`
- `customers` - Solar installation applicants with application status tracking

### Authentication
- Session-based authentication stored in PostgreSQL
- Role-based middleware (`requireBDP`, `requireDDP`) for protected routes
- User context provided via React context (`useAuth` hook)

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components (shadcn + custom)
│   ├── pages/           # Route pages (bdp/, ddp/, login, register)
│   ├── lib/             # Utilities (auth, theme, queryClient)
│   └── hooks/           # Custom React hooks
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations interface
│   └── db.ts            # Drizzle database connection
├── shared/              # Shared between client and server
│   └── schema.ts        # Drizzle schema + Zod validation
└── migrations/          # Database migrations
```

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- connect-pg-simple for session storage

### UI/Frontend Libraries
- Radix UI primitives for accessible components
- Embla Carousel for carousel functionality
- Recharts for data visualization
- date-fns for date formatting

### Build and Development
- Vite with React plugin
- Replit-specific plugins for development (error overlay, cartographer, dev banner)
- esbuild for production server bundling

### Validation
- Zod for runtime schema validation
- drizzle-zod for database-to-validation schema generation

### Notification Services
The platform supports multi-channel notifications for application status updates:

**Channels:**
- **WhatsApp** - Primary notification channel via Twilio WhatsApp Business API
- **SMS** - Fallback when WhatsApp unavailable (via Twilio)
- **Email** - Professional HTML email notifications via Resend
- **In-App** - Always sent, stored in `notifications` table

**Required Environment Variables:**
- `TWILIO_ACCOUNT_SID` - Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Twilio WhatsApp-enabled phone number (format: +1234567890)
- `RESEND_API_KEY` - Resend API key for email notifications
- `FROM_EMAIL` - Sender email address (default: notifications@divyanshisolar.com)

**Notification Triggers:**
1. Customer status changes (pending → verified → approved → scheduled → completed)
2. Milestone completions
3. Commission earned notifications

**User Preferences:**
Users can control notifications via `user_preferences` table:
- `emailNotifications` - Enable/disable email
- `smsNotifications` - Enable/disable SMS
- `whatsappNotifications` - Enable/disable WhatsApp

**Files:**
- `server/notification-service.ts` - Core notification service
- API endpoint: `GET /api/admin/notification-config` - Check service status