# Zaaro AI Collect

**English** | [Français](#zaaro-ai-collect-français)

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

Copy the example file and fill in your values:

```bash
cp .env.example .env.local   # Windows: copy .env.example .env.local
```

The complete, commented list of variables (database URLs, auth secret, Supabase keys) lives in [`.env.example`](.env.example) — the single source of truth for configuration.

**How to generate the auth secret:**

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

- **Email:** `admin@zaaro.ai`
- **Password:** `admin123` (⚠️ Change this in production!)

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

## Environment Variables

All required variables are listed and commented in [`.env.example`](.env.example) — copy it to `.env.local` and fill in your values. Real secrets are never committed to Git.

## Deployment

### Vercel (Recommended for Next.js)

1. Push your code to GitHub (`.env.local` is NOT included)
2. Connect the repository to Vercel
3. **Add environment variables in the Vercel dashboard** (see [`.env.example`](.env.example) for details):
   - `DATABASE_URL` (your online database URL)
   - `AUTH_SECRET` (generate a new one with `openssl rand -base64 32`)
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
- Change `AUTH_SECRET` to a strong random value for production
- Change the default admin password immediately
- Use HTTPS in production (deployment platforms handle this)
- Set `AUTH_URL` to your production domain
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

---

# Zaaro AI Collect (Français)

[English](#zaaro-ai-collect) | **Français**

Une application web moderne de collecte d'enregistrements audio dans les langues locales du Burkina Faso. Conçue pour recueillir des données par le biais de contributions vocales participatives, dans le but de créer une IA personnalisée à des fins de traduction.

## Vue d'ensemble

**Zaaro AI Collect** est une plateforme où des contributeurs enregistrent des échantillons de voix dans plusieurs langues locales, à travers différents domaines (santé, administration, agriculture, finance). L'application gère les enregistrements, valide les soumissions et fournit des statistiques pour les contributeurs comme pour les administrateurs.

### Fonctionnalités clés

- **Interface d'enregistrement vocal** — Interface d'enregistrement épurée et moderne avec visualisation de la forme d'onde en temps réel (style WhatsApp)
- **Prise en charge multilingue** — Mooré, Dioula, Gourounsi et Fulfulde
- **Tableau de bord contributeur** — Suivi des contributions personnelles, progression vers les objectifs et historique des enregistrements
- **Panneau de validation admin** — Examiner, valider ou rejeter les soumissions avec des statistiques détaillées
- **Stockage audio sécurisé** — Fichiers audio stockés dans Supabase avec des URLs signées
- **Analyses et rapports** — Statistiques détaillées par langue, par domaine et par contributeur
- **Contrôle d'accès par rôle** — Interfaces distinctes utilisateur et admin avec gestion des permissions
- **Design responsive** — Fonctionne aussi bien sur ordinateur que sur mobile

## Pile technique

### Frontend

- **Next.js 14** — Framework React avec App Router
- **React 18** — Bibliothèque d'interface utilisateur
- **TypeScript** — Typage statique
- **Tailwind CSS** — Styling utilitaire
- **Lucide Icons** — Jeu d'icônes
- **React Hook Form** — Gestion des formulaires
- **Zod** — Validation de schémas

### Backend

- **Next.js API Routes** — Backend serverless
- **Prisma ORM** — Gestion de la base de données
- **NextAuth v5** — Authentification et autorisation
- **bcryptjs** — Hachage des mots de passe

### Base de données & stockage

- **PostgreSQL** — Base de données relationnelle (via Supabase)
- **Supabase** — PostgreSQL géré & stockage d'objets
- **Prisma Migrate** — Migrations de base de données

### Outils de développement

- **npm** — Gestionnaire de paquets
- **ESLint** — Linting du code
- **dotenv** — Gestion des variables d'environnement

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- **Node.js** (v18 ou supérieur)
- **npm** (fourni avec Node.js)
- Une base de données **PostgreSQL** (locale ou distante, déjà en ligne)
- Un compte **Supabase** (pour le stockage audio)
- **Git** pour le contrôle de version

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/yourusername/zaaro-ai-collect.git
cd zaaro-ai-collect
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Copiez le fichier d'exemple puis remplissez vos valeurs :

```bash
cp .env.example .env.local   # Windows : copy .env.example .env.local
```

La liste complète et commentée des variables (URLs de base de données, secret d'authentification, clés Supabase) se trouve dans [`.env.example`](.env.example) — c'est la source de vérité unique pour la configuration.

**Comment générer le secret d'authentification :**

```bash
openssl rand -base64 32
```

⚠️ **IMPORTANT :** Le fichier `.env.local` est dans `.gitignore` et ne sera PAS poussé sur GitHub. Vos identifiants restent sécurisés localement.

### 4. Configurer la base de données

Synchronisez votre schéma avec la base de données en ligne existante :

```bash
# Générer le client Prisma
npm run db:generate

# Synchroniser le schéma avec votre base en ligne
npm run db:push

# Insérer les données initiales avec un utilisateur admin (optionnel si déjà fait)
npm run db:seed
```

Le script de seed crée un utilisateur admin avec :

- **Email :** `admin@zaaro.ai`
- **Mot de passe :** `admin123` (⚠️ À changer en production !)

### 5. Configurer Supabase Storage

1. Allez sur votre tableau de bord Supabase
2. Naviguez vers **Storage**
3. Créez un nouveau bucket nommé `recordings`
4. Configurez les politiques du bucket pour autoriser les uploads par les utilisateurs authentifiés

## Lancer le projet

### Développement

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

### Build de production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Structure du projet

```
zaaro-ai-collect/
├── src/
│   ├── app/                    # Répertoire App de Next.js
│   │   ├── (app)/              # Routes utilisateur (protégées)
│   │   │   ├── dashboard/      # Tableau de bord principal
│   │   │   ├── record/         # Interface d'enregistrement
│   │   │   ├── history/        # Historique des soumissions
│   │   │   └── profile/        # Profil utilisateur
│   │   ├── (admin)/            # Routes admin (protégées)
│   │   │   ├── admin/          # Tableau de bord admin
│   │   │   ├── validation/     # Validation des soumissions
│   │   │   ├── phrases/        # Gestion des phrases
│   │   │   ├── languages/      # Statistiques par langue
│   │   │   └── users/          # Gestion des utilisateurs
│   │   ├── api/                # Routes API
│   │   │   ├── auth/           # Endpoints d'authentification
│   │   │   ├── recordings/     # Opérations d'enregistrement
│   │   │   ├── phrases/        # Endpoints phrases
│   │   │   ├── user/           # Endpoints données utilisateur
│   │   │   └── admin/          # Opérations admin
│   │   ├── login/              # Page de connexion
│   │   ├── register/           # Page d'inscription
│   │   └── layout.tsx          # Layout racine
│   ├── components/
│   │   └── ui/                 # Composants UI réutilisables
│   ├── lib/
│   │   ├── prisma.ts           # Client Prisma
│   │   ├── utils.ts            # Fonctions utilitaires
│   │   └── supabase/           # Intégration Supabase
│   └── app/globals.css         # Styles globaux
├── prisma/
│   ├── schema.prisma           # Schéma de base de données
│   └── seed.js                 # Script de seed
├── public/                     # Assets statiques
├── auth.ts                     # Configuration NextAuth
├── auth.config.ts              # Callbacks d'authentification
├── middleware.ts               # Middleware NextAuth
├── tailwind.config.ts          # Configuration Tailwind
├── tsconfig.json               # Configuration TypeScript
└── package.json                # Dépendances
```

## Schéma de base de données

L'application utilise les tables principales suivantes :

- **users** - Comptes utilisateurs et profils
- **recordings** - Métadonnées des soumissions audio
- **phrases** - Phrases à enregistrer
- **sessions** - Gestion des sessions NextAuth

Voir [prisma/schema.prisma](prisma/schema.prisma) pour le schéma complet.

## Flux principaux

### Flux d'enregistrement utilisateur

1. L'utilisateur se connecte au tableau de bord
2. Il sélectionne la langue et le domaine
3. Il enregistre deux prises d'une phrase donnée
4. Il soumet les deux enregistrements
5. Les fichiers audio sont uploadés vers Supabase
6. Les métadonnées sont stockées dans PostgreSQL

### Flux de validation admin

1. L'admin se connecte au tableau de bord admin
2. Il examine les soumissions en attente
3. Il écoute les enregistrements
4. Il valide ou rejette avec un retour
5. Il génère des statistiques et des exports

## Variables d'environnement

Toutes les variables requises sont listées et commentées dans [`.env.example`](.env.example) — copiez-le vers `.env.local` et remplissez vos valeurs. Les vrais secrets ne sont jamais committés dans Git.

## Déploiement

### Vercel (recommandé pour Next.js)

1. Poussez votre code sur GitHub (`.env.local` n'est PAS inclus)
2. Connectez le dépôt à Vercel
3. **Ajoutez les variables d'environnement dans le tableau de bord Vercel** (détails dans [`.env.example`](.env.example)) :
   - `DATABASE_URL` (l'URL de votre base en ligne)
   - `AUTH_SECRET` (générez-en une nouvelle avec `openssl rand -base64 32`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Déployez

```bash
# Commande de build : npm run build
# Commande de start : npm start
```

## Considérations de sécurité

**Avant de passer en production :**

- **Ne jamais committer `.env.local` dans Git** — il est déjà dans `.gitignore`
- Définissez les variables d'environnement sur votre plateforme de déploiement (Vercel, Railway, etc.) via leur tableau de bord
- Changez `AUTH_SECRET` pour une valeur aléatoire forte en production
- Changez immédiatement le mot de passe admin par défaut
- Utilisez HTTPS en production (les plateformes de déploiement le gèrent)
- Définissez `AUTH_URL` sur votre domaine de production
- Vérifiez les politiques de stockage Supabase
- Activez les sauvegardes de base de données chez votre fournisseur PostgreSQL
- Mettez en place le suivi des erreurs et la supervision
- Vérifiez et mettez à jour les paramètres CORS

## Scripts disponibles

```bash
# Développement
npm run dev           # Démarrer le serveur de développement

# Build
npm run build         # Build pour la production
npm start             # Démarrer le serveur de production

# Base de données
npm run db:generate   # Générer le client Prisma
npm run db:push       # Synchroniser le schéma vers la base
npm run db:seed       # Insérer les données initiales

# Qualité du code
npm run lint          # Exécuter ESLint
```

## Dépannage

### Problèmes de connexion à la base de données

- Vérifiez que `DATABASE_URL` est correcte
- Vérifiez que PostgreSQL est en cours d'exécution
- Assurez-vous que l'utilisateur a les permissions nécessaires

### Problèmes de stockage Supabase

- Vérifiez que le bucket s'appelle `recordings`
- Vérifiez que la clé service role est valide
- Assurez-vous que les politiques de stockage autorisent les uploads

### Échec de l'upload d'enregistrement

- Vérifiez les permissions micro du navigateur
- Vérifiez que le bucket Supabase Storage existe
- Vérifiez la connexion réseau

## Support

Pour les problèmes, questions ou suggestions :

- Ouvrez une issue sur GitHub
- Consultez la documentation existante
- Passez en revue la structure du projet

## Remerciements

Réalisé avec :

- Les communautés Next.js et React
- Supabase pour l'infrastructure
- Tailwind CSS pour le styling
- Tous les contributeurs préservant les langues locales
