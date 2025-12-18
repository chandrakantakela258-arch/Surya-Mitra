# DivyanshiSolar - Partner Management Platform

## Overview

DivyanshiSolar is a partner management platform for PM Surya Ghar Yojana, India's rooftop solar installation program. The platform enables Business Development Partners (BDPs) to onboard and manage District Development Partners (DDPs), who in turn manage customer applications for solar panel installations.

The application follows a multi-role hierarchy:
- **Admin** - System administrators
- **BDP (Business Development Partner)** - Manages DDPs and oversees customer portfolio
- **DDP (District Development Partner)** - Handles customer onboarding and application tracking

## User Preferences

Preferred communication style: Simple, everyday language.

## Business Rules

### Panel Types & Capacity Options
- **DCR Panels (Domestic Content Requirement)**: 3 kW and 5 kW (government subsidy eligible)
- **Non-DCR Panels**: 6-10 kW capacity options

### System Pricing
- **DCR Panels**: 3 kW = Rs 2,25,000 | 5 kW = Rs 3,50,000 (includes 3-in-1 Hybrid Inverter)
- **Non-DCR Panels**: Rs 55,000 per kW

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