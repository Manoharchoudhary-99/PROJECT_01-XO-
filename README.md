# Overview

A full-stack web application built with React, Express, and TypeScript featuring a tic-tac-toe game with AI opponent. The project uses modern web development tools including Vite for frontend bundling, shadcn/ui for component library, TailwindCSS for styling, and Drizzle ORM for database operations. The application is structured as a monorepo with shared TypeScript schemas and includes comprehensive UI components for building interactive web applications.

## Game Features (Updated December 2025)

## Game Modes
- **Single Player**: Play against AI with three difficulty levels
  - Easy: Random move selection
  - Medium: Heuristic (win/block priority, center/corners preference)
  - Hard: Minimax algorithm with alpha-beta pruning
- **Local Multiplayer**: Two players take turns on the same device

### UI/UX
- Mobile-first responsive design optimized for Android
- Dark theme with gradient backgrounds and glow effects
- Touch-friendly buttons with 52px minimum height
- Animated win detection with highlighted winning cells
- Score tracking (X wins, O wins, draws)
- Win/Draw celebration modal with Menu and Play Again options

### Technical Implementation
- Race condition handling for AI moves with gameIdRef tracking
- Modal timeout cleanup on navigation/reset
- Functional state updates to prevent stale closures
- Safe area support for mobile notches

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with simple page-based navigation
- **State Management**: React hooks with TanStack Query for server state management
- **Styling**: TailwindCSS with shadcn/ui component library providing a comprehensive design system
- **UI Components**: Extensive collection of Radix UI primitives wrapped with custom styling

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Structure**: RESTful API with `/api` prefix for all routes
- **Middleware**: Custom logging middleware for API request tracking
- **Development**: Hot reloading with tsx for TypeScript execution

## Data Storage
- **ORM**: Drizzle ORM configured for PostgreSQL dialect
- **Database**: PostgreSQL (configured but can be provisioned later)
- **Schema**: Shared TypeScript schema definitions with Zod validation
- **Migrations**: Drizzle Kit for database migrations management
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development

## Authentication & Session Management
- **Session Store**: PostgreSQL session store using connect-pg-simple
- **Database Connection**: Neon serverless PostgreSQL driver
- **Schema Validation**: Drizzle-Zod integration for type-safe database operations

## Build & Development
- **Bundling**: Vite for frontend, esbuild for backend production builds
- **TypeScript**: Strict type checking with path mapping for clean imports
- **Development Server**: Integrated Vite dev server with Express backend
- **Error Handling**: Runtime error overlay for development debugging

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)
- **Connection Pooling**: Built-in connection management for serverless environments

## UI & Styling
- **Radix UI**: Comprehensive primitive component library for accessible UI
- **TailwindCSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel/slider components for interactive content

## Development Tools
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Runtime Error Handling**: Development error overlay for better debugging experience
- **Code Generation**: Drizzle Kit for automated migration generation

## State Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with Zod validation resolvers
- **Date Handling**: date-fns for date manipulation and formatting

## Build Tools
- **Vite**: Fast frontend build tool with HMR support
- **esbuild**: Fast JavaScript bundler for production backend builds
- **PostCSS**: CSS processing with TailwindCSS and Autoprefixer plugins
