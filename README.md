# PlaceMate AI

PlaceMate AI is a personalized placement management platform that automatically converts placement emails into structured opportunities, creates smart calendar reminders, assists with application forms, tracks application progress, and provides AI-powered preparation guidance.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js with Google OAuth 2.0
- **UI**: Tailwind CSS + shadcn/ui
- **APIs**: Gmail API, Google Calendar API, Gemini API, Groq API
- **Validation**: Zod

## Prerequisites

Before you begin, ensure you have the following:

- Node.js 18+ installed
- MongoDB Atlas account (free tier)
- Google Cloud project with OAuth credentials
- Gemini API key
- Groq API key

## Getting Started

### 1. Clone the repository

```bash
cd placemate-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the required environment variables:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/placemate-ai

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Groq API
GROQ_API_KEY=your-groq-api-key

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=your-service-account-key
```

### 4. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth client ID
5. Select "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env.local`

### 5. Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (0.0.0.0/0 for development)
5. Get the connection string and add it to `.env.local`

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
placemate-ai/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard page
│   │   ├── profile/           # Profile page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── Navbar.tsx        # Navigation bar
│   │   └── PlacementCard.tsx # Placement card component
│   ├── lib/                   # Utility functions
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── mongodb.ts        # MongoDB connection
│   │   └── utils.ts          # Utility functions
│   └── models/               # Mongoose models
│       ├── User.ts
│       ├── Placement.ts
│       ├── CalendarEvent.ts
│       └── EmailProcessing.ts
├── .env.example              # Environment variables template
├── .env.local               # Your environment variables (not committed)
└── package.json
```

## Features

### Current Implementation (Phase 1)

- ✅ Next.js 14 with TypeScript
- ✅ Tailwind CSS + shadcn/ui components
- ✅ MongoDB connection with Mongoose
- ✅ NextAuth.js with Google OAuth
- ✅ User authentication and session management
- ✅ Basic layout with navigation
- ✅ Landing page
- ✅ Dashboard page
- ✅ Profile management page
- ✅ Database models (User, Placement, CalendarEvent, EmailProcessing)

### Planned Features

- 📧 Gmail integration with webhooks
- 🤖 AI-powered email information extraction (Gemini + Groq)
- 📅 Google Calendar integration for reminders
- 📝 Google Form auto-fill assistant
- 🧠 AI preparation assistant

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding New Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy

### Environment Variables for Production

Make sure to add all the environment variables from `.env.local` to your Vercel project settings.

## Contributing

This is a personal project for academic purposes. Contributions are not currently accepted.

## License

This project is for educational purposes.

## Support

For issues or questions, please refer to the implementation plan document.
