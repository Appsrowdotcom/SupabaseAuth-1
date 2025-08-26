# Supabase Auth App

A full-stack web application built with React frontend and Supabase backend, featuring role-based authentication for project management. The application serves two types of users: Project Managers (PM) and Team Members, each with their own dedicated dashboard interfaces.

## Features

- **Role-based Authentication**: PM and Team Member roles with different access levels
- **Project Management**: Create, view, and manage projects
- **Task Management**: Assign and track tasks within projects
- **Work Logging**: Track time spent on tasks
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components

## Tech Stack

### Frontend
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing with role-based route protection
- **State Management**: React Context for authentication state and TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with custom user profiles
- **API**: Direct Supabase client integration (no custom backend needed)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Environment Variables
Create a `.env.local` file in the client directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
1. Create a new Supabase project
2. Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor
3. Configure authentication settings in your Supabase dashboard

### Installation
```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### Build
```bash
npm run build
npm run preview
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and configurations
│   │   └── hooks/         # Custom React hooks
│   └── index.html
├── supabase-schema.sql    # Database schema and RLS policies
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## Database Schema

The application uses the following main tables:
- **users**: User profiles with roles and specializations
- **projects**: Project information managed by PMs
- **tasks**: Individual tasks within projects
- **work_logs**: Time tracking for tasks
- **status_history**: Audit trail for status changes

All tables have Row Level Security (RLS) enabled with appropriate policies for data access control.

## Authentication Flow

1. Users sign up with email/password and role selection
2. Supabase Auth handles authentication
3. User profile is created in the `users` table
4. Role-based access control is enforced through RLS policies
5. Users can only access data they're authorized to see

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT
