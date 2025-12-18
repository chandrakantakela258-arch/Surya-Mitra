# Design Guidelines: Solar Partner Management Platform

## Design Approach
**System Selected:** Material Design 3
**Rationale:** Enterprise productivity application requiring clear information hierarchy, robust form patterns, and data table components. Material Design provides excellent patterns for multi-role dashboards and data-dense interfaces.

## Typography System

**Font Family:** Inter (primary), Roboto (secondary)
- Headings: Inter, weights 600-700
- Body text: Inter, weight 400
- Data/numbers: Roboto Mono, weight 500
- Buttons/CTAs: Inter, weight 500

**Type Scale:**
- H1 (Dashboard titles): text-3xl (30px)
- H2 (Section headers): text-2xl (24px)
- H3 (Card headers): text-xl (20px)
- Body: text-base (16px)
- Small text (labels): text-sm (14px)
- Data tables: text-sm (14px)

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 to p-6
- Section spacing: gap-6, gap-8
- Card spacing: p-6
- Form field spacing: gap-4

**Grid Structure:**
- Dashboard: Sidebar (280px fixed) + Main content area (flex-1)
- Analytics cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Data tables: Full-width with horizontal scroll
- Forms: Single column max-w-2xl for optimal readability

## Component Library

### Navigation
**Sidebar (Persistent):**
- Fixed left sidebar with role-based navigation items
- Logo/branding at top (h-16)
- Icon + label navigation pattern
- Active state with subtle background highlight
- User profile section at bottom with role badge

**Top Bar:**
- Breadcrumb navigation
- Search functionality (global customer/partner search)
- Notification bell icon
- User avatar dropdown

### Dashboard Components

**Stat Cards:**
- Elevated cards (shadow-md) with rounded-lg corners
- Icon circle (w-12 h-12) with relevant icon
- Large number display (text-3xl font-semibold)
- Descriptive label (text-sm)
- Trend indicator (arrow icon + percentage)
- Layout: 4-column grid on desktop, stack on mobile

**Data Tables:**
- Clean, bordered table design
- Sticky header row
- Row hover states
- Action column (right-aligned) with icon buttons
- Pagination controls at bottom
- Search bar and filter dropdowns above table
- Row selection checkboxes for bulk actions
- Export button (top-right)

**Partner Hierarchy Visualization:**
- Tree/org chart view using connected cards
- BDP at top → DDPs in middle tier → Customers at bottom
- Cards show: name, ID, total downstream partners/customers
- Expandable/collapsible branches

### Forms

**Registration Forms (BDP/DDP/Customer):**
- Single-column layout within max-w-2xl container
- Grouped sections with section headers
- Input fields: h-10 with border and focus ring
- Labels above inputs (text-sm font-medium)
- Helper text below fields (text-xs)
- Required field indicators
- Document upload dropzone with drag-and-drop
- Preview thumbnails for uploaded documents
- Primary action button (bottom-right)
- Secondary cancel/back button (bottom-left)

**Form Field Types:**
- Text inputs: Standard height h-10
- Select dropdowns: Custom styled with chevron icon
- File upload: Dashed border dropzone area
- Radio buttons: For status selection
- Checkboxes: For terms/conditions

### Status System
**Status Badges:**
- Pill-shaped badges (rounded-full px-3 py-1)
- Text-xs font-medium
- States: Pending, Verified, Approved, Installation Scheduled, Completed
- Each status has distinct visual treatment (defined via classes, not colors)

### Modals & Overlays
**Modal Dialogs:**
- Centered overlay with backdrop blur
- Max-width based on content (max-w-lg to max-w-2xl)
- Header with title and close button
- Content area with appropriate padding (p-6)
- Footer with action buttons (right-aligned)

## Responsive Behavior

**Breakpoints:**
- Mobile: Stack all columns, collapsible sidebar (drawer)
- Tablet (md): 2-column layouts, persistent sidebar
- Desktop (lg): Full multi-column layouts

**Mobile Adaptations:**
- Sidebar becomes bottom sheet/drawer
- Data tables scroll horizontally
- Stat cards stack vertically
- Forms maintain single column

## Key Interaction Patterns

**Loading States:**
- Skeleton screens for data tables and cards
- Spinner for form submissions
- Progress indicators for file uploads

**Empty States:**
- Centered icon + message + CTA button
- Used in: Empty partner lists, no customers yet, no documents uploaded

**Confirmation Dialogs:**
- For destructive actions (delete partner, reject application)
- Clear primary/secondary button hierarchy

## Images

**Not Applicable:** This is a data-centric business application. No hero images or marketing imagery needed. Use icons throughout (Material Icons via CDN) for:
- Navigation items
- Stat cards
- Action buttons
- Status indicators
- Empty states

**Document Thumbnails:** Show PDF/image previews in customer application details

---

**Design Philosophy:** Prioritize information density, scanability, and operational efficiency. Every screen should enable users to complete tasks quickly with minimal cognitive load. Use consistent spacing, clear typography hierarchy, and familiar interaction patterns throughout the application.