# PlaceMate AI

PlaceMate AI is a comprehensive placement management platform that automates the entire campus placement workflow. It converts placement emails into structured opportunities, creates smart calendar reminders, assists with application forms, tracks application progress, and provides AI-powered job matching with detailed scoring.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js v5 with Google OAuth 2.0
- **UI**: Tailwind CSS + shadcn/ui + Framer Motion
- **APIs**: Gmail API, Google Calendar API, Google Pub/Sub, Gemini API, Groq API
- **Automation**: Puppeteer for form filling
- **Queue System**: BullMQ with Redis
- **Validation**: Zod + react-hook-form

## Prerequisites

Before you begin, ensure you have the following:

- Node.js 18+ installed
- MongoDB Atlas account (free tier)
- Google Cloud project with OAuth credentials
- Gemini API key (Google AI Studio)
- Groq API key (Groq console)
- Redis server (local or cloud)
- Google Cloud Pub/Sub topic and subscription (for Gmail webhooks)

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

# Google OAuth (for Gmail & Calendar)
GOOGLE_CLIENT_ID=OAuth 2.0 client ID from Google Cloud Console
GOOGLE_CLIENT_SECRET=OAuth 2.0 client secret from Google Cloud Console
GOOGLE_OAUTH_CALLBACK_URL=OAuth callback URL (e.g., http://localhost:3000/api/auth/callback/google)

# AI APIs
GEMINI_API_KEY=Google Gemini API key from Google AI Studio
GEMINI_MODEL=gemini-1.5-flash
GROQ_API_KEY=Groq API key from Groq console
GROQ_MODEL=llama3-70b-8192

# Google Cloud Services (for Gmail Webhooks & Pub/Sub)
GOOGLE_CLOUD_PROJECT_ID=Google Cloud project ID
GOOGLE_SERVICE_ACCOUNT_EMAIL=Service account email
GOOGLE_SERVICE_ACCOUNT_KEY=Service account private key (JSON format or base64 encoded)

# Optional (for Gmail Webhooks)
GOOGLE_PUBSUB_TOPIC_ID=Pub/Sub topic ID
GOOGLE_PUBSUB_SUBSCRIPTION_ID=Pub/Sub subscription ID

# Redis (for BullMQ Queue System)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Gmail Polling (fallback mechanism for missed webhooks)
GMAIL_POLLING_ENABLED=true
```

### 4. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Gmail API
   - Google Calendar API
   - Google+ API
   - Google Cloud Pub/Sub API
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

### 6. Set up Redis

Using Docker (recommended):
```bash
docker-compose up -d
```

Or install Redis locally:
```bash
# Windows: Download Redis from https://github.com/microsoftarchive/redis/releases
# macOS: brew install redis && brew services start redis
# Linux: sudo apt-get install redis-server && sudo systemctl start redis
```

### 7. Start the email processing worker

In a separate terminal:
```bash
npm run worker
```

### 8. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
placemate-ai/
├── src/
│   ├── app/                          # Next.js app directory
│   │   ├── api/                     # API routes
│   │   │   ├── auth/                # NextAuth endpoints
│   │   │   ├── gmail/               # Gmail API integration
│   │   │   ├── placements/          # Placement CRUD operations
│   │   │   ├── profile/             # Profile management
│   │   │   ├── webhooks/            # Gmail Pub/Sub webhooks
│   │   │   └── monitoring/          # Health & queue stats
│   │   ├── auth/                   # Authentication pages
│   │   ├── dashboard/              # Main dashboard
│   │   ├── placements/             # Placement detail pages
│   │   ├── profile/                # Profile management page
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Landing page
│   ├── components/                 # React components
│   │   ├── placement/              # Placement-specific components
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── Navbar.tsx              # Navigation bar
│   │   ├── PlacementList.tsx       # Placement list component
│   │   └── GmailMonitorToggle.tsx  # Gmail monitoring toggle
│   ├── lib/                        # Core business logic
│   │   ├── ai-extraction.ts        # AI-powered data extraction
│   │   ├── ai-summary.ts           # AI summary generation
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── calendar-service.ts     # Google Calendar integration
│   │   ├── email-detection.ts      # Email classification
│   │   ├── email-processor.ts      # Email processing pipeline
│   │   ├── gmail-service.ts        # Gmail API wrapper
│   │   ├── gmail-poller.ts         # Gmail polling fallback
│   │   ├── job-matcher.ts          # Job matching algorithm
│   │   ├── mongodb.ts              # MongoDB connection
│   │   ├── puppeteer-form-service.ts  # Form automation
│   │   ├── queue.ts                # BullMQ queue configuration
│   │   └── validations/            # Zod schemas
│   ├── models/                     # Mongoose models
│   │   ├── User.ts                 # User model
│   │   ├── Placement.ts            # Placement model
│   │   ├── CalendarEvent.ts        # Calendar event model
│   │   └── EmailProcessing.ts      # Email processing model
│   ├── types/                      # TypeScript type definitions
│   ├── workers/                    # Background workers
│   │   └── email-processor-worker.ts
│   └── proxy.ts                    # API proxy configuration
├── scripts/                        # Utility scripts
│   ├── start-worker.ts             # Worker entry point
│   ├── check-queue.ts              # Queue monitoring
│   ├── check-placements.ts         # Data verification
│   └── migrate-db.js               # Database migrations
├── public/                         # Static assets
├── .env.example                    # Environment variables template
├── docker-compose.yml              # Redis container configuration
├── next.config.ts                 # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json
```

## Features

### ✅ Fully Implemented

**Authentication & User Management**
- Google OAuth 2.0 authentication with NextAuth.js v5
- User profile management with academic details (college, branch, CGPA, skills)
- Profile completion checking and validation
- Google token storage with refresh token support

**Email Detection & Processing**
- Gmail API integration with full email content parsing
- Zero-cost email detection service (keyword-based classification)
- Real-time Gmail webhooks via Google Pub/Sub
- Polling fallback mechanism (5-minute intervals)
- Queue-based email processing with BullMQ and Redis
- Automatic token refresh for expired access tokens

**AI-Powered Information Extraction**
- Hybrid AI extraction chain: Gemini → Groq → Regex fallback
- Extracts: company name, job role, package, location, deadlines
- Multiple link type detection (Google Form, placement cell form, company form)
- Job requirements extraction (skills, responsibilities, experience level)
- Confidence scoring per extraction provider
- URL categorization and classification

**Job Matching Algorithm**
- Weighted scoring system (Skills 40%, CGPA 20%, Branch 15%, Experience 15%, Location 10%)
- Semantic skill matching with substring support
- Missing skills identification
- Detailed match breakdown with component scores
- Match score display on placement cards

**Google Calendar Integration**
- Automatic event creation for deadlines, assessments, interviews
- Configurable reminders (1 day before deadlines, 1 hour before assessments)
- Idempotent event creation with unique IDs
- Event management (create, update, delete)
- Proper OAuth scope handling

**Form Automation**
- Puppeteer-based form filling service
- Form structure extraction (text, dropdown, radio, checkbox, date, time)
- Semantic field mapping from profile to form questions
- Short URL resolution for Google Forms
- Browser script generation for manual auto-fill

**AI Summary Generation**
- Structured summaries with section headers
- Dual AI support (Gemini and Groq with fallback)
- Formatted markdown output
- Concise bullet-point format

**Dashboard & UI**
- Modern design with gradient backgrounds and glassmorphism
- Framer Motion animations for smooth transitions
- Full dark mode support with next-themes
- Responsive mobile-first design
- Placement cards with match scores and status badges
- Gmail monitoring toggle with real-time status
- Profile management form with Zod validation

**Background Processing**
- BullMQ queue system with Redis backend
- Email processing worker with 5 concurrent jobs
- Rate limiting (10 jobs per second)
- Retry logic with exponential backoff (3 attempts)
- Dead letter queue for failed jobs
- Graceful shutdown handling

### 🚧 Partially Implemented

- Form auto-fill UI integration (Puppeteer service complete, UI pending)
- Calendar event management UI (backend complete, controls partial)

### 📋 Planned Features

- AI preparation assistant (deferred per implementation plan)
- Advanced filtering and search functionality
- Email attachment processing
- Application analytics and insights
- Export placement data to CSV/PDF

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run worker       # Start email processing worker
npm run worker:dev   # Start worker with watch mode
```

### Utility Scripts

```bash
npx tsx scripts/check-queue.ts              # Monitor queue status
npx tsx scripts/check-placements.ts         # Verify placement data
npx tsx scripts/backfill-match-scores.ts    # Recalculate match scores
npx tsx scripts/clear-google-tokens.ts      # Clear stored Google tokens
npx tsx scripts/requeue-jobs.ts             # Requeue failed jobs
npx tsx scripts/migrate-db.js               # Run database migrations
npx tsx scripts/update-existing-placements.js # Bulk update placements
```

### Adding New Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

### Architecture Overview

**Email Processing Pipeline**
1. Gmail webhook receives Pub/Sub notification
2. Webhook acknowledges immediately (async processing)
3. Fetches Gmail history changes
4. Extracts new email IDs
5. Adds emails to BullMQ queue with unique job IDs
6. Worker picks up job from queue
7. Email processor fetches full email content
8. Email detection service classifies email
9. AI extraction service extracts structured data
10. AI summary service generates summary
11. Job matcher calculates match score
12. Placement saved/updated in database

**Fallback Mechanisms**
- Email Detection: Webhooks → Polling (5-minute intervals)
- AI Extraction: Gemini → Groq → Regex
- Token Refresh: Access token → Refresh token → Re-auth
- Form Filling: Puppeteer → Manual script

**Idempotency Strategies**
- Queue Jobs: Unique job IDs based on userId + emailId
- Calendar Events: Idempotency keys (placementId + eventType)
- Database Upsert: Email ID-based upsert for placements
- History Tracking: Gmail historyId prevents reprocessing

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy

### Environment Variables for Production

Make sure to add all the environment variables from `.env.local` to your Vercel project settings.

### Redis for Production

For production, use a managed Redis service:
- **Redis Cloud** (recommended)
- **Upstash Redis**
- **AWS ElastiCache**
- **Google Cloud Memorystore**

Update `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` accordingly.

### Worker Deployment

The email processing worker needs to run continuously. Options:
- **Vercel Cron Jobs**: For scheduled tasks
- **Render**: Free tier for background workers
- **Railway**: Supports background workers
- **Docker container**: Deploy as separate service

### Google Cloud Pub/Sub Setup

For Gmail webhooks:
1. Create a Pub/Sub topic in your Google Cloud project
2. Create a subscription with push delivery
3. Set the push endpoint to your deployed webhook URL
4. Add `GOOGLE_PUBSUB_TOPIC_ID` and `GOOGLE_PUBSUB_SUBSCRIPTION_ID` to environment variables

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js handler

### Gmail Integration
- `POST /api/gmail/watch` - Enable/disable Gmail monitoring
- `GET /api/gmail/watch` - Get monitoring status
- `POST /api/gmail/reauth` - Re-authenticate with Google
- `POST /api/webhooks/gmail` - Gmail Pub/Sub webhook endpoint

### Placement Management
- `GET /api/placements` - List user's placements
- `GET /api/placements/[id]` - Get placement details
- `PATCH /api/placements/[id]` - Update placement
- `DELETE /api/placements/[id]` - Delete placement
- `GET /api/placements/[id]/attachments` - List attachments
- `GET /api/placements/[id]/attachments/[attachmentId]` - Get attachment
- `POST /api/placements/[id]/autofill` - Generate auto-fill script
- `POST /api/placements/[id]/calendar` - Create calendar event
- `GET /api/placements/[id]/summary` - Get AI summary

### Profile Management
- `PATCH /api/profile` - Update user profile

### Monitoring
- `GET /api/monitoring/health` - Health check endpoint
- `GET /api/monitoring/queue-stats` - Queue statistics

### Form Automation
- `POST /api/forms/puppeteer` - Puppeteer form operations

## Database Schema

### User Model
- `name`, `email`, `image` - Basic user info
- `profile` - Academic details (phone, college, branch, CGPA, skills, etc.)
- `googleTokens` - OAuth tokens and Gmail watch status

### Placement Model
- `companyName`, `jobRole`, `package`, `location` - Job details
- `eligibility` - Minimum CGPA and allowed branches
- `applicationDeadline`, `assessmentDate`, `interviewDate` - Important dates
- `applicationLink`, `googleFormLink`, `placementCellFormLink`, `companyFormLink` - Application URLs
- `status` - NEW, INTERESTED, APPLIED, ASSESSMENT_SCHEDULED, INTERVIEW_SCHEDULED, REJECTED, SELECTED, NOT_INTERESTED, EXPIRED
- `extractedByAI`, `extractionProvider`, `extractionConfidence` - AI extraction metadata
- `emailFrom`, `emailSubject`, `emailBody`, `emailDate` - Email source data
- `notes[]`, `attachments[]`, `applicationHistory[]` - User-added data
- `calendarEventId`, `deadlineCalendarEventId`, etc. - Calendar event references
- `aiSummary` - AI-generated summary
- `jobRequirements` - Extracted job requirements for matching
- `matchScore`, `matchBreakdown` - Job matching scores

### CalendarEvent Model
- `placementId`, `userId` - References
- `eventType` - APPLICATION_REMINDER, ASSESSMENT, INTERVIEW, DOCUMENT_SUBMISSION, OFFER_DEADLINE
- `googleCalendarEventId` - Google Calendar event reference
- `eventIdempotencyKey` - Unique key for idempotency

### EmailProcessing Model
- `userId`, `gmailMessageId` - References
- `subject`, `from`, `processedAt` - Email metadata
- `isPlacementEmail`, `classificationConfidence` - Detection results
- `status` - PENDING, PROCESSED, IGNORED

## Contributing

This is a personal project for academic purposes. Contributions are not currently accepted.

## License

This project is for educational purposes.

## Support

For issues or questions, please refer to the implementation plan document (`PLACEMATE-AI-IMPLEMENTATION-PLAN.md`).

## Troubleshooting

### Gmail Webhook Not Working
- Verify Google Cloud Pub/Sub topic and subscription are configured
- Check that the webhook URL is publicly accessible
- Ensure `GOOGLE_PUBSUB_TOPIC_ID` and `GOOGLE_PUBSUB_SUBSCRIPTION_ID` are set
- Check Gmail watch is enabled in user profile

### Email Processing Queue Stuck
- Check Redis is running: `docker-compose ps` or `redis-cli ping`
- Monitor queue stats: `npx tsx scripts/check-queue.ts`
- Restart worker: `npm run worker`
- Clear stuck jobs: `npx tsx scripts/requeue-jobs.ts`

### AI Extraction Failing
- Verify Gemini API key is valid: Check Google AI Studio
- Verify Groq API key is valid: Check Groq console
- Check API rate limits and quotas
- Fallback to regex will activate automatically

### Token Refresh Issues
- User needs to re-authenticate if refresh token is missing
- Check OAuth scopes include `https://www.googleapis.com/auth/gmail.modify`
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### Puppeteer Form Fill Issues
- Ensure Chrome is installed at the specified path
- Update `executablePath` in `puppeteer-form-service.ts` if needed
- Check form URL is accessible
- Some forms may have CAPTCHA requiring manual intervention

## License

This project is for educational purposes.
