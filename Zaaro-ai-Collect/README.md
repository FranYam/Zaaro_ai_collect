# Zaaro AI Collect

A modern web application for collecting audio recordings in Burkina Faso local languages. Built to record data through crowdsourced voice contributions in the aim to created an customized ai for translation purposes..

## Overview

**Zaaro AI Collect** is a platform where contributors can record voice samples in multiple local languages across different domains (health, administration, agriculture, finance). The application manages recordings, validates submissions, and provides analytics for both contributors and administrators.

### Key Features

- **Voice Recording Interface** - Clean, modern recording UI with real-time waveform visualization (WhatsApp-style)
- **Multi-Language Support** - Support for Mooré, Dioula, Gourounsi, and Fulfulde
- **Contributor Dashboard** - Track personal contributions, progress toward goals, and recording history
- **Admin Validation Panel** - Review, validate, or reject submissions with detailed statistics
- **Secure Audio Storage** - Audio files stored in Supabase with encrypted URLs
- **Analytics & Reporting** - Detailed statistics by language, domain, and contributor
- **Role-Based Access Control** - Separate user and admin interfaces with permission management
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Beautiful icon set
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Backend

- **Next.js API Routes** - Serverless backend
- **Prisma ORM** - Database management
- **NextAuth v5** - Authentication and authorization
- **bcryptjs** - Password hashing

### Database & Storage

- **PostgreSQL** - Relational database (via Supabase)
- **Supabase** - Managed PostgreSQL & object storage
- **Prisma Migrate** - Database migrations

### Development Tools

- **npm** - Package manager
- **ESLint** - Code linting
- **dotenv** - Environment variable management

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** database (local or remote, already online)
- **Supabase Account** (for audio storage)
- **Git** for version control

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/zaaro-ai-collect.git
cd zaaro-ai-collect
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory with your **online database credentials**:

```env
# Database (your existing online database)
DATABASE_URL="postgresql://user:password@your-host:5432/zaaro_db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**How to generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

⚠️ **IMPORTANT:** The `.env.local` file is in `.gitignore` and will NOT be pushed to GitHub. Your credentials stay secure locally.

### 4. Set Up the Database

Sync your schema with the existing online database:

```bash
# Generate Prisma client
npm run db:generate

# Sync schema with your online database
npm run db:push

# Seed with initial admin user (optional if already seeded)
npm run db:seed
```

The seed script creates an admin user with:

- **Email:** `admin@zaaro.local`
- **Password:** `Admin@123` (⚠️ Change this in production!)

### 5. Set Up Supabase Storage

1. Go to your Supabase dashboard
2. Navigate to **Storage**
3. Create a new bucket named `recordings`
4. Configure bucket policies to allow uploads by authenticated users

## Running the Project

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Project Structure

```
zaaro-ai-collect/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (app)/              # User routes (protected)
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── record/         # Recording interface
│   │   │   ├── history/        # Submission history
│   │   │   └── profile/        # User profile
│   │   ├── (admin)/            # Admin routes (protected)
│   │   │   ├── admin/          # Admin dashboard
│   │   │   ├── validation/     # Submission validation
│   │   │   ├── phrases/        # Phrase management
│   │   │   ├── languages/      # Language statistics
│   │   │   └── users/          # User management
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── recordings/     # Recording operations
│   │   │   ├── phrases/        # Phrase endpoints
│   │   │   ├── user/           # User data endpoints
│   │   │   └── admin/          # Admin operations
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   └── ui/                 # Reusable UI components
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client
│   │   ├── utils.ts            # Utility functions
│   │   └── supabase/           # Supabase integration
│   └── app/globals.css         # Global styles
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.js                 # Database seed script
├── public/                     # Static assets
├── auth.ts                     # NextAuth configuration
├── auth.config.ts              # Auth callbacks
├── middleware.ts               # NextAuth middleware
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## Database Schema

The application uses the following main tables:

- **users** - User accounts and profiles
- **recordings** - Audio submission metadata
- **phrases** - Phrases to be recorded
- **sessions** - NextAuth session management

See [prisma/schema.prisma](prisma/schema.prisma) for the complete schema.

## Key Workflows

### User Recording Workflow

1. User logs in to the dashboard
2. Selects language and domain
3. Records two takes of a given phrase
4. Submits both recordings
5. Audio files uploaded to Supabase
6. Metadata stored in PostgreSQL

### Admin Validation Workflow

1. Admin logs into the admin dashboard
2. Reviews pending submissions
3. Listens to recordings
4. Validates or rejects with feedback
5. Generates statistics and exports

## Environment Variables Reference

| Variable                        | Description                  | Example                                      |
| ------------------------------- | ---------------------------- | -------------------------------------------- |
| `DATABASE_URL`                  | PostgreSQL connection string | `postgresql://user:pass@host:5432/db`        |
| `NEXTAUTH_SECRET`               | Secret for JWT signing       | Generate with `openssl rand -base64 32`      |
| `NEXTAUTH_URL`                  | Public URL of the app        | `http://localhost:3000` or `https://app.com` |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL         | `https://xxxxx.supabase.co`                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key       | Found in Supabase settings                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key    | Found in Supabase settings                   |

## Deployment

### Vercel (Recommended for Next.js)

1. Push your code to GitHub (`.env.local` is NOT included)
2. Connect the repository to Vercel
3. **Add environment variables in Vercel dashboard:**
   - `DATABASE_URL` (your online database URL)
   - `NEXTAUTH_SECRET` (generate new one with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your production domain)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

```bash
# Build command: npm run build
# Start command: npm start
```

## Security Considerations

**Before going to production:**

- **Never commit `.env.local` to Git** - it's already in `.gitignore`
- Set environment variables on your deployment platform (Vercel, Railway, etc.) via their dashboard
- Change `NEXTAUTH_SECRET` to a strong random value for production
- Change the default admin password immediately
- Use HTTPS in production (deployment platforms handle this)
- Set `NEXTAUTH_URL` to your production domain
- Review Supabase storage policies
- Enable database backups on your PostgreSQL provider
- Set up error tracking and monitoring
- Review and update CORS settings

## Available Scripts

```bash
# Development
npm run dev           # Start development server

# Building
npm run build         # Build for production
npm start             # Start production server

# Database
npm run db:generate   # Generate Prisma client
npm run db:push       # Sync schema to database
npm run db:seed       # Seed initial data

# Code Quality
npm run lint          # Run ESLint
```

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure user has proper permissions

### Supabase Storage Issues

- Verify bucket name is `recordings`
- Check service role key is valid
- Ensure storage policies allow uploads

### Recording Upload Fails

- Check browser microphone permissions
- Verify Supabase storage bucket exists
- Check network connectivity

## Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Check existing documentation
- Review the project structure

## Acknowledgments

Built with:

- Next.js and React communities
- Supabase for infrastructure
- Tailwind CSS for styling
- All contributors preserving local languages
