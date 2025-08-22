# Overview

This is a full-stack web application built with React frontend and Express backend, featuring role-based authentication for project management. The application serves two types of users: Project Managers (PM) and Team Members, each with their own dedicated dashboard interfaces. It uses modern web technologies including TypeScript, Tailwind CSS, and shadcn/ui components for a polished user experience.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **Routing**: Wouter for client-side routing with role-based route protection
- **State Management**: React Context for authentication state and TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Framework**: Express.js with TypeScript for REST API endpoints
- **Session Management**: Express-session with in-memory store for user sessions
- **Authentication**: Custom session-based authentication with bcrypt for password hashing
- **Storage**: Abstracted storage interface with in-memory implementation (designed for easy database integration)
- **Development**: Hot module replacement with Vite integration for seamless development experience

## Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL with schema-driven development
- **Schema Management**: Centralized schema definitions in shared directory with Zod validation
- **User Model**: Users table with email, password, role (PM/team_member), and timestamps
- **Current Implementation**: In-memory storage for development with interface ready for database migration

## Authentication and Authorization
- **Session-based Authentication**: Server-side sessions with HTTP-only cookies
- **Role-based Access Control**: Two distinct user roles (pm, team_member) with corresponding dashboards
- **Protected Routes**: Client-side route protection based on user authentication status and role
- **Password Security**: Bcrypt hashing for secure password storage

## External Dependencies
- **Database**: Configured for Neon Database (PostgreSQL) via DATABASE_URL environment variable
- **UI Components**: Radix UI primitives for accessible component foundation
- **Form Validation**: Zod schema validation for type-safe data handling
- **Development Tools**: Replit-specific plugins for development environment integration
- **Build Tools**: ESBuild for server bundling and Vite for client bundling