# PPF Master - Workshop Management System

## Overview

PPF Master is a professional vehicle workflow management system designed for Paint Protection Film (PPF) centers. It implements a "job card" system where each vehicle becomes a job that moves through defined stages from inward to delivery. The application is built as a full-stack TypeScript solution with a React frontend and Express backend, using PostgreSQL for data persistence.

The system tracks vehicles through 11 workflow stages: Vehicle Inward → Inspection → Washing → Surface Preparation → Parts Opening → Washing (2) → PPF Application → Parts Repacking → Cleaning & Finishing → Final Inspection → Delivered.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, Zustand for client state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy, bcrypt for password hashing
- **Session Management**: express-session with configurable session storage
- **API Design**: RESTful endpoints under `/api` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` - contains table definitions using Drizzle
- **Migrations**: Drizzle Kit for schema migrations (output to `./migrations`)

### Core Data Models
- **Users**: Authentication and role management (Admin, Installer roles)
- **Jobs**: Vehicle workflow tracking with stages, customer info, and status
- **Service Packages**: Configurable service offerings (Full Body PPF, Ceramic Coating, etc.)

### Authentication Flow
- Session-based authentication using Passport.js local strategy
- Protected routes redirect unauthenticated users to login
- Role-based access control (Admin has full access, Installers see assigned jobs)

### Build Configuration
- Development: Vite dev server with HMR
- Production: esbuild bundles server code, Vite builds client to `dist/public`
- Shared code in `shared/` directory accessible by both client and server

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database abstraction layer with type-safe queries

### Authentication & Security
- **Passport.js**: Authentication middleware
- **bcrypt**: Password hashing
- **express-session**: Session management

### UI Libraries
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-styled component library
- **Lucide React**: Icon library
- **@hello-pangea/dnd**: Drag and drop for Kanban board

### Development Tools
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Server bundling for production
- **Drizzle Kit**: Database migration tooling

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption (optional, has default for development)