# DivyanshiSolar - Partner Management Platform

## Overview
DivyanshiSolar is a partner management platform designed for India's PM Surya Ghar Yojana rooftop solar installation program. It facilitates the onboarding and management of Business Development Partners (BDPs) and District Development Partners (DDPs), who manage customer applications. The platform supports a multi-role hierarchy (Admin, BDP, DDP) and aims to streamline the solar panel installation process from customer acquisition to commission payouts, incorporating features for lead management, financial calculations, and partner engagement.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React and TypeScript, utilizing Wouter for routing, TanStack React Query for server state management, and shadcn/ui (based on Radix UI) for UI components. Styling is managed with Tailwind CSS, and forms are handled using React Hook Form with Zod validation. It adheres to Material Design 3 principles and features a sidebar-based layout with role-based navigation and protected routes. The application is also a Progressive Web App (PWA) with mobile optimization, offline capabilities, and a service worker for caching.

### Backend Architecture
The backend uses Node.js with Express and TypeScript (ESM modules). It provides a RESTful JSON API. Session management is handled by Express-session with a PostgreSQL store. Vite is used for frontend development, and esbuild for server bundling. The server serves both API routes and the static frontend in production.

### Data Storage
PostgreSQL is the primary database, with Drizzle ORM and drizzle-zod for schema validation. Key tables include `users` (for BDPs/DDPs with `parentId` for hierarchy) and `customers` (for solar installation applicants).

### Authentication
The system uses session-based authentication stored in PostgreSQL, with role-based middleware (`requireBDP`, `requireDDP`) for route protection. User context is managed via a React context (`useAuth` hook).

### Core Features
- **Multi-Role Hierarchy**: Admin, BDP, DDP.
- **Customer Management**: Tracking residential, commercial, and industrial customers with varying capacity options, electricity rates, and subsidy eligibility. Includes DCR/Non-DCR panel differentiation and associated pricing.
- **Financial Calculations**: EMI options with power savings deduction, state subsidies, and a dynamic commission structure for DDPs and BDPs based on panel type and installation size.
- **Automated Payouts & Expenses**: Vendor payment milestones and site expenses are automatically populated and triggered by customer journey progress and commission payouts.
- **E-commerce System**: Product catalog (solar packages, marketing material, accessories), shopping cart, order management, and secure checkout via Razorpay.
- **Partner Engagement**: News & Updates section, Panel Comparison Tool, Partner Leaderboard, Referral Program with unique codes and reward structures, and an Installation Map View.
- **Public Customer Registration**: Self-service registration form with real-time subsidy and savings estimates, supporting both independent and referred customers.
- **AI-Powered Lead Scoring**: Uses OpenAI to analyze customer conversion potential based on various factors, assigning lead tiers (Hot, Warm, Cold) and providing recommendations.
- **Notification System**: Multi-channel notifications (WhatsApp, SMS, Email, In-App) for status changes and milestones, with user-configurable preferences.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store.
- **connect-pg-simple**: For PostgreSQL session storage.

### Payment Gateways
- **RazorpayX Payouts**: For processing partner commission payouts.
- **Razorpay Checkout**: For collecting customer payments for products and services.

### Communication Services
- **Twilio**: For WhatsApp Business API (primary) and SMS (fallback) notifications.
- **Resend**: For professional HTML email notifications.

### AI Integration
- **OpenAI (via Replit AI Integrations)**: For AI-powered lead scoring.

### UI/Frontend Libraries
- **Radix UI**: For accessible UI primitives.
- **Embla Carousel**: For carousel functionalities.
- **Recharts**: For data visualization.
- **date-fns**: For date manipulation and formatting.