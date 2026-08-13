# PlaceMate AI - Focused Implementation Plan

This plan provides a focused roadmap for building PlaceMate AI using your selected technology stack: Next.js 14, Gmail Webhooks, Gemini + Groq APIs, Google Calendar API, and Puppeteer form filling.

## Project Overview

**PlaceMate AI** - A personalized placement management platform that converts placement emails into structured opportunities, creates smart calendar reminders, assists with application forms, tracks application progress, and provides AI-powered preparation guidance.

## Phase 1: Foundation & Core Features (Weeks 1-4)

### Selected Stack: Next.js 14 Full-Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Auth**: NextAuth.js with Google OAuth 2.0
- **UI**: Tailwind CSS + shadcn/ui
- **Pros**: Built-in API routes, SSR, better SEO, single codebase
- **Cons**: More complex setup, learning curve

### Implementation Tasks:
1. **Project Setup**
   - Initialize Next.js 14 project with TypeScript
   - Configure Tailwind CSS and shadcn/ui
   - Set up MongoDB connection with Mongoose
   - Configure environment variables

2. **Authentication**
   - Install and configure NextAuth.js
   - Set up Google OAuth provider
   - Create user schema and model
   - Implement protected routes

3. **Student Profile**
   - Create profile schema (personal info, skills, links)
   - Build profile management pages
   - Implement profile CRUD operations
   - Add form validation with Zod

4. **Core Dashboard**
   - Create placement opportunity schema
   - Build dashboard UI with opportunity cards
   - Implement manual placement entry
   - Add status tracking (New, Applied, Rejected, etc.)
   - Create filtering and search functionality

## Phase 2: Gmail Integration (Weeks 5-7)

### Selected Stack: Gmail API with Webhooks
- **API**: Gmail API with Push Notifications
- **Trigger**: Google Pub/Sub for real-time email detection
- **Setup**: Google Cloud Console project with Gmail API enabled
- **Pros**: Real-time updates, scalable, production-grade
- **Cons**: Complex setup, requires Google Cloud account

### Implementation Tasks:
1. **Google Cloud Setup**
   - Create Google Cloud project
   - Enable Gmail API and Google Pub/Sub API
   - Create service account with appropriate permissions
   - Set up Pub/Sub topic and subscription
   - Configure webhook endpoint

2. **Gmail API Integration**
   - Install googleapis and google-auth-library
   - Implement OAuth 2.0 flow for Gmail access
   - Create webhook endpoint for Pub/Sub notifications
   - Handle push notification events

3. **Email Detection**
   - Implement placement email classification
   - Use keyword matching + AI classification
   - Filter non-placement emails
   - Add confidence scoring

4. **Email Processing Pipeline**
   - Fetch email content using Gmail API
   - Parse email body (HTML/text)
   - Extract attachments if any
   - Queue emails for AI processing

## Phase 3: AI Information Extraction (Weeks 8-10)

### Selected Stack: Gemini API + Groq API
- **Primary**: Google Gemini Pro for structured extraction
- **Secondary**: Groq API for faster processing/cost optimization
- **Hybrid Approach**: Use Gemini for complex extraction, Groq for simpler tasks
- **Cost**: Gemini free tier + Groq competitive pricing

### Implementation Tasks:
1. **API Integration**
   - Set up Gemini API credentials
   - Set up Groq API credentials
   - Create API service layer with fallback logic
   - Implement rate limiting and error handling

2. **Extraction Pipeline**
   - Design structured prompt for extraction
   - Define output schema (company, role, deadline, etc.)
   - Implement JSON parsing and validation
   - Add confidence scoring

3. **Rule-Based Fallback**
   - Create regex patterns for common formats
   - Implement keyword-based extraction
   - Build pattern matching for dates, URLs, etc.
   - Use rules when AI fails or for speed

4. **Data Validation**
   - Validate extracted data with Zod schemas
   - Handle missing or malformed data
   - Implement data cleaning and normalization
   - Add manual review interface for low-confidence extractions

## Phase 4: Google Calendar Integration (Weeks 11-12)

### Selected Stack: Google Calendar API + OAuth 2.0
- **API**: Google Calendar API with events.insert()
- **Auth**: OAuth 2.0 with NextAuth.js
- **Duplicate Prevention**: Idempotent event IDs with database tracking
- **Features**: Create deadline events, reminders, assessment events

### Implementation Tasks:
1. **Calendar API Setup**
   - Enable Google Calendar API in Google Cloud
   - Configure OAuth scopes for calendar access
   - Implement calendar API client
   - Test authentication flow

2. **Event Creation Logic**
   - Implement events.insert() for deadlines
   - Create reminder events (deadline - 1 day)
   - Add assessment and interview events
   - Include event details (company, role, links)

3. **Idempotency & Deduplication**
   - Generate unique event IDs based on placementId + eventType
   - Track created events in database
   - Check for existing events before creating
   - Implement event update logic

4. **Event Management**
   - Build UI to view created events
   - Add ability to delete events
   - Sync status between app and calendar
   - Handle calendar API errors gracefully

## Phase 5: Google Form Prefill (Weeks 13-15)

### Selected Stack: Form Filling Service with Puppeteer
- **Technology**: Puppeteer for browser automation
- **Architecture**: Backend service that opens forms and fills them
- **Pros**: Works without extension, automated filling
- **Cons**: Complex, potential anti-automation issues, resource-intensive

### Implementation Tasks:
1. **Puppeteer Setup**
   - Install Puppeteer and configure browser
   - Set up headless Chrome instance
   - Configure browser context and cookies
   - Implement browser pool for concurrent operations

2. **Form Detection**
   - Detect Google Form structure
   - Parse form questions and field types
   - Identify input fields (text, dropdown, checkbox, etc.)
   - Handle dynamic form elements

3. **Field Matching Logic**
   - Create mapping between form questions and profile fields
   - Use semantic similarity for matching
   - Implement fuzzy matching for field names
   - Build manual override interface

4. **Form Filling Process**
   - Navigate to form URL
   - Fill matched fields with profile data
   - Handle CAPTCHA and anti-automation (manual intervention)
   - Take screenshot for user verification
   - Provide option for user to review and submit

5. **Anti-Automation Handling**
   - Detect CAPTCHA challenges
   - Pause for manual intervention
   - Implement human-like typing patterns
   - Add random delays between actions

## Phase 6: AI Preparation Assistant (Deferred)

### Status: Currently Ignored
- This phase is deferred to future development
- Focus on core functionality first
- Can be implemented using Gemini API with prompt engineering when ready
- Potential features: company-specific prep, role-specific questions, skill gap analysis

## Database Design

### Selected Database: MongoDB with Mongoose
- **Schema**: Flexible document structure
- **Pros**: Schema flexibility, good for unstructured data, fits Next.js ecosystem
- **Cons**: Less strict data validation (mitigated with Zod)

### Key Collections:

**User Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  image: String,
  profile: {
    phone: String,
    college: String,
    branch: String,
    semester: Number,
    cgpa: Number,
    graduationYear: Number,
    linkedin: String,
    github: String,
    portfolio: String,
    skills: [String],
    resume: String
  },
  googleTokens: {
    accessToken: String,
    refreshToken: String,
    calendarToken: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Placement Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  companyName: String,
  jobRole: String,
  package: String,
  location: String,
  eligibility: {
    minimumCGPA: Number,
    allowedBranches: [String]
  },
  applicationDeadline: Date,
  assessmentDate: Date,
  interviewDate: Date,
  applicationLink: String,
  googleFormLink: String,
  emailId: String,
  status: String, // NEW, APPLIED, REJECTED, SELECTED, etc.
  extractedByAI: Boolean,
  extractionConfidence: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Calendar Event Collection**
```javascript
{
  _id: ObjectId,
  placementId: ObjectId,
  userId: ObjectId,
  eventType: String, // APPLICATION_REMINDER, ASSESSMENT, INTERVIEW
  googleCalendarEventId: String,
  eventDate: Date,
  eventIdempotencyKey: String, // placementId + eventType
  createdAt: Date
}
```

**Email Processing Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  gmailMessageId: String,
  subject: String,
  from: String,
  processedAt: Date,
  isPlacementEmail: Boolean,
  classificationConfidence: Number,
  placementId: ObjectId, // if processed
  status: String // PENDING, PROCESSED, IGNORED
}
```

## Deployment Strategy

### Selected Platform: Vercel (Next.js optimized)
- **Frontend & Backend**: Vercel (Next.js full-stack deployment)
- **Database**: MongoDB Atlas (free tier)
- **Pros**: Next.js native, automatic SSR, edge functions, free tier generous
- **Cons**: Serverless functions have execution time limits

### Deployment Tasks:
1. **Vercel Setup**
   - Connect GitHub repository to Vercel
   - Configure environment variables
   - Set up build settings
   - Configure domain (optional)

2. **MongoDB Atlas Setup**
   - Create MongoDB Atlas cluster
   - Configure IP whitelist
   - Set up database user
   - Get connection string

3. **Environment Variables**
   - MongoDB connection string
   - NextAuth secret
   - Google OAuth credentials
   - Gemini API key
   - Groq API key
   - Google Cloud service account credentials

4. **Background Jobs**
   - Use Vercel Cron Jobs for scheduled tasks
   - Or use external service (Render Cron, etc.)
   - For Puppeteer: consider separate server or serverless alternative

## Documentation & SE Artifacts

### Required Documents (for academic project):
1. **SRS (Software Requirements Specification)**
2. **Use Case Diagrams**
3. **Activity Diagrams**
4. **Sequence Diagrams**
5. **Class Diagrams**
6. **ER Diagrams**
7. **Data Flow Diagrams**
8. **System Architecture**
9. **Test Cases**
10. **Risk Analysis**

### Tools for Documentation:
- **Diagrams**: Draw.io, Lucidchart, Mermaid.js
- **SRS**: Markdown or Word templates
- **API Docs**: Swagger/OpenAPI

## Cost Analysis

### Free Tier Approach (MVP):
- **Hosting**: Vercel + Render (free)
- **Database**: MongoDB Atlas (free 512MB)
- **AI**: Gemini API (free tier) or rule-based
- **Email**: Gmail API (free quota)
- **Total Cost**: $0/month

### Production Approach:
- **Hosting**: $20-50/month
- **Database**: $10-30/month
- **AI**: $20-100/month (depending on usage)
- **Total Cost**: $50-180/month

## Implementation Timeline

### Sprint 1 (Weeks 1-2): Next.js Foundation
- Initialize Next.js 14 project with TypeScript
- Configure Tailwind CSS and shadcn/ui
- Set up MongoDB connection with Mongoose
- Configure NextAuth.js with Google OAuth
- Create basic layout and navigation
- Set up environment variables

### Sprint 2 (Weeks 3-4): Core Features
- Create User schema and authentication flow
- Build student profile management pages
- Create Placement schema
- Implement manual placement entry
- Build dashboard with opportunity list
- Add status tracking (New, Applied, Rejected, etc.)
- Implement filtering and search

### Sprint 3 (Weeks 5-6): Gmail Webhook Setup
- Set up Google Cloud project
- Enable Gmail API and Pub/Sub API
- Create service account and permissions
- Set up Pub/Sub topic and subscription
- Implement webhook endpoint
- Test push notification flow

### Sprint 4 (Weeks 7-8): Email Processing
- Implement Gmail API integration
- Build email classification logic
- Create placement email detection
- Implement email parsing pipeline
- Add email processing queue
- Build email processing UI

### Sprint 5 (Weeks 9-10): AI Extraction
- Integrate Gemini API
- Integrate Groq API
- Design extraction prompts
- Implement structured data extraction
- Add rule-based fallback
- Implement confidence scoring
- Build extraction review interface

### Sprint 6 (Weeks 11-12): Google Calendar
- Enable Google Calendar API
- Implement OAuth for calendar access
- Build event creation logic
- Implement idempotency with database tracking
- Create deadline and reminder events
- Add event management UI
- Handle duplicate prevention

### Sprint 7 (Weeks 13-15): Puppeteer Form Filling
- Set up Puppeteer and browser pool
- Implement form detection logic
- Build field matching algorithm
- Create form filling automation
- Handle anti-automation detection
- Build user verification flow
- Add manual intervention points

### Sprint 8 (Weeks 16-17): Polish & Testing
- UI/UX improvements
- Error handling and edge cases
- Performance optimization
- End-to-end testing
- Security audit
- Documentation

### Sprint 9 (Week 18): Deployment & SE Artifacts
- Deploy to Vercel
- Set up MongoDB Atlas production
- Configure production environment
- Create SRS document
- Draw system diagrams (Use case, Activity, Sequence, Class, ER, DFD)
- Prepare presentation
- Final testing and bug fixes

## Final Technology Stack

**Framework:**
- Next.js 14 (App Router)
- TypeScript
- React 18

**UI & Styling:**
- Tailwind CSS
- shadcn/ui components
- Lucide React icons

**Database:**
- MongoDB Atlas
- Mongoose ODM

**Authentication:**
- NextAuth.js v5
- Google OAuth 2.0

**APIs & Services:**
- Gmail API with Webhooks (Pub/Sub)
- Google Calendar API
- Gemini API (Google)
- Groq API
- Google Cloud Pub/Sub

**Automation:**
- Puppeteer for form filling
- Google Cloud service account

**Validation:**
- Zod for schema validation

**Development Tools:**
- ESLint + Prettier
- Git + GitHub
- VS Code
- Postman for API testing

**Deployment:**
- Vercel (Next.js hosting)
- MongoDB Atlas (database)
- Vercel Cron Jobs (scheduled tasks)

## Risk Mitigation

**Technical Risks:**
1. **Gmail API limits** → Implement polling fallback
2. **AI extraction accuracy** → Hybrid rule-based + AI approach
3. **Google Form autofill complexity** → Start with clipboard assistant
4. **Calendar API rate limits** → Batch operations, caching

**Project Risks:**
1. **Scope creep** → Strict MVP definition, phased approach
2. **Timeline pressure** → Prioritize core features first
3. **API costs** → Use free tiers, implement caching

## Success Metrics

- **User Adoption**: Number of students using the platform
- **Email Detection Accuracy**: >90% placement email detection
- **Extraction Accuracy**: >85% correct information extraction
- **Form Time Saved**: >50% reduction in form filling time
- **Deadline Miss Rate**: <10% missed deadlines after using platform

## Prerequisites & Setup

### Required Accounts:
1. **Google Cloud Account**
   - For Gmail API, Calendar API, Pub/Sub
   - For OAuth 2.0 credentials
   - For service account

2. **MongoDB Atlas Account**
   - Free tier for database

3. **Gemini API Access**
   - Google AI Studio for API key

4. **Groq API Access**
   - Groq console for API key

5. **GitHub Account**
   - For code hosting and Vercel integration

6. **Vercel Account**
   - For deployment

### Required Tools:
- Node.js 18+ 
- Git
- VS Code (recommended)
- Postman (for API testing)

## Immediate Next Steps

1. **Create all required accounts** (Google Cloud, MongoDB Atlas, etc.)
2. **Set up Google Cloud project** and enable APIs
3. **Create OAuth 2.0 credentials** for Gmail and Calendar
4. **Set up MongoDB Atlas cluster** and get connection string
5. **Get API keys** for Gemini and Groq
6. **Initialize Next.js project** with selected stack
7. **Configure environment variables**
8. **Begin Sprint 1** implementation

## Cost Estimate

**Development Phase (Free):**
- Vercel: Free tier
- MongoDB Atlas: Free 512MB
- Gemini API: Free tier limits
- Groq API: Free tier limits
- Total: $0/month

**Production Phase (Estimated):**
- Vercel Pro: $20/month
- MongoDB Atlas: $10-30/month
- Gemini API: $10-50/month (depending on usage)
- Groq API: $5-20/month
- Total: $45-120/month

## Risk Mitigation

**Technical Risks:**
1. **Gmail Webhook complexity** → Have polling fallback ready
2. **Puppeteer detection** → Implement human-like patterns, manual intervention
3. **AI extraction accuracy** → Hybrid approach with rule-based fallback
4. **Calendar API rate limits** → Implement batching and caching
5. **Vercel serverless limits** → Optimize functions, consider separate server for Puppeteer

**Project Risks:**
1. **Timeline pressure** → Prioritize core features, defer AI assistant
2. **API costs** → Monitor usage, implement caching, use free tiers
3. **Scope creep** → Stick to defined phases, avoid feature additions
