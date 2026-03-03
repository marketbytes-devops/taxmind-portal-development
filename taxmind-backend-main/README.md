# TaxMind Backend API

> **Enterprise-grade RESTful API for Irish tax filing and refund management platform**

[![Node.js](https://img.shields.io/badge/Node.js-22.18.0-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue.svg)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.44.3-orange.svg)](https://orm.drizzle.team/)

## 🎯 Overview

TaxMind Backend is a comprehensive, production-ready API platform that powers the TaxMind tax filing and refund management system. Built with enterprise-level security, scalability, and GDPR compliance at its core, the platform manages the complete lifecycle of tax applications—from user registration and questionnaire submissions to document management, payment processing, and refund distribution.

### Key Highlights

- **🏗️ Modern Architecture**: Modular, scalable microservices-ready architecture
- **🔒 Security-First**: GDPR-compliant with data encryption, HMAC hashing, and comprehensive audit logging
- **⚡ High Performance**: Optimized database queries with trigram search, connection pooling, and caching strategies
- **🔄 Real-Time**: WebSocket support for live chat and instant notifications
- **💳 Payment**: Integrated payment processing via Revolut
- **📱 Multi-Channel**: Email (AWS SES), SMS (Twilio), Push Notifications (Firebase), and WhatsApp Business API
- **🚀 Production-Ready**: Comprehensive error handling, logging (Winston), rate limiting, and monitoring

---

## 🏛️ System Architecture

### Technology Stack

| Layer                | Technology         | Purpose                                      |
| -------------------- | ------------------ | -------------------------------------------- |
| **Runtime**          | Node.js 22.18.0    | JavaScript runtime environment               |
| **Framework**        | Express.js 5.1.0   | Web application framework                    |
| **Language**         | TypeScript 5.8.3   | Type-safe development                        |
| **Database**         | PostgreSQL         | Primary data store with full ACID compliance |
| **ORM**              | Drizzle ORM 0.44.3 | Type-safe database queries and migrations    |
| **Real-Time**        | Socket.IO 4.8.1    | WebSocket communication for chat             |
| **Validation**       | Zod 4.0.5          | Runtime type validation and schema parsing   |
| **Authentication**   | JWT + bcrypt       | Secure token-based authentication            |
| **Process Manager**  | PM2                | Production process management                |
| **Containerization** | Docker             | Containerized deployment                     |

### Third-Party Integrations

- **Payment Processing**: Revolut
- **Cloud Storage**: AWS S3 (document management)
- **Email Service**: AWS SES
- **SMS Service**: Twilio
- **Push Notifications**: Firebase Cloud Messaging
- **E-Signature**: Zoho Sign
- **WhatsApp Business**: Meta WhatsApp Business API

---

## 📁 Project Structure

```
TaxMind-Backend/
├── src/
│   ├── app.ts                      # Express application setup
│   ├── server.ts                   # HTTP server initialization
│   ├── index.ts                    # Application entry point
│   │
│   ├── modules/                    # Feature modules (domain-driven)
│   │   ├── user/                   # User management & authentication
│   │   ├── admin/                  # Admin user management
│   │   ├── applications/           # Tax application lifecycle
│   │   ├── questionnaire/          # Dynamic questionnaire system
│   │   ├── files/                  # Document upload & management
│   │   ├── chat/                   # Real-time chat (Socket.IO)
│   │   ├── whatsapp-chat/          # WhatsApp Business integration
│   │   ├── notification/           # Multi-channel notifications
│   │   ├── blog/                   # Content management
│   │   ├── site-content/           # FAQs, policies, tax credits
│   │   ├── rbac/                   # Role-based access control
│   │   └── common/                 # Shared/public endpoints
│   │
│   ├── database/
│   │   ├── models/                 # Drizzle ORM schema definitions
│   │   ├── migrations/             # Database migration files
│   │   ├── seeders/                # Database seed scripts
│   │   └── index.ts                # Database connection pool
│   │
│   ├── middleware/
│   │   ├── authorize/              # JWT authentication middleware
│   │   ├── rbac.ts                 # Permission & module access control
│   │   ├── errorHandler.ts         # Global error handling
│   │   ├── rateLimiter.ts          # API rate limiting
│   │   ├── paginate.ts             # Pagination helper
│   │   └── requestLogger.ts        # Request/response logging
│   │
│   ├── integrations/               # External service integrations
│   │   ├── awsS3.ts               # S3 file storage
│   │   ├── awsSES.ts              # Email service
│   │   ├── stripe.ts              # Stripe payment gateway
│   │   ├── revolut.ts             # Revolut payment gateway
│   │   ├── twilio.ts              # SMS/OTP service
│   │   ├── firbase.ts             # Push notifications
│   │   ├── zohoSign.ts            # E-signature service
│   │   ├── googleLogin.ts         # Google OAuth
│   │   ├── appleLogin.ts          # Apple Sign-In
│   │   └── flowise.ts             # AI chatbot integration
│   │
│   ├── scripts/
│   │   ├── cronScheduler.ts        # Scheduled job orchestrator
│   │   ├── paymentReminderJob.ts   # Automated payment reminders
│   │   ├── permanentUserDeletion.ts # GDPR data retention compliance
│   │   ├── migrate.ts              # Database migration runner
│   │   ├── seedSuperAdmin.ts       # Admin account seeding
│   │   └── setupRevolutWebhook.ts  # Revolut webhook setup
│   │
│   ├── mail/
│   │   ├── templates/              # Handlebars email templates
│   │   ├── handler.ts              # Email sending logic
│   │   └── loadEmailTemplate.ts    # Template loader
│   │
│   ├── notifications/
│   │   ├── templates/              # Push notification templates
│   │   └── notificationHandler.ts  # Notification dispatcher
│   │
│   ├── logger/
│   │   ├── index.ts                # Winston logger configuration
│   │   └── activityLog.ts          # Audit trail logging
│   │
│   ├── utils/                      # Utility functions
│   │   ├── crypto.ts               # GDPR-compliant encryption/hashing
│   │   ├── apiError.ts             # Custom error classes
│   │   ├── serviceHandler.ts       # Service wrapper with error handling
│   │   ├── env.ts                  # Environment validation (Zod)
│   │   └── ...                     # Various helpers
│   │
│   ├── types/                      # TypeScript type definitions
│   ├── constants/                  # Application constants & enums
│   └── config/                     # Configuration files
│
├── docs/
│   └── api-doc.yml                 # OpenAPI/Swagger documentation
│
├── github/workflows/               # CI/CD pipelines
│   └── development.yml             # GitHub Actions workflow
│
├── Dockerfile                      # Docker image definition
├── docker-compose.yml              # Multi-container orchestration
├── ecosystem.config.js             # PM2 configuration
├── drizzle.config.ts               # Drizzle ORM configuration
├── tsconfig.json                   # TypeScript configuration
├── buildspec-dev.yml               # AWS CodeBuild (Dev)
├── buildspec-prod.yml              # AWS CodeBuild (Prod)
└── package.json                    # Dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: v22.18.0 or later
- **npm**: v10.8.2 or later
- **PostgreSQL**: v15+ (or access to a PostgreSQL instance)
- **Docker**: (optional, for containerized deployment)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/ileafsolutions/TaxMind-Backend.git
   cd TaxMind-Backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Configuration**:

   Create environment files for each environment (`.env.local`, `.env.development`, `.env.staging`, `.env.production`):

   ```bash
   # Copy the example and configure
   cp .env.example .env.local
   ```

   **Required Environment Variables** (see [Environment Variables](#-environment-variables) section below)

4. **Database Setup**:

   ```bash
   # Run migrations
   npm run db:migrate:local

   # Seed initial data
   npm run db:seed:local

   # Create super admin account
   npm run db:seed:super-admin:local
   ```

5. **Start Development Server**:

   ```bash
   npm run start:local
   ```

   Server will start at `http://localhost:5000`

### Quick Start Scripts

```bash
# Development with hot-reload
npm run start:local          # Local environment
npm run start:dev            # Development environment
npm run start:staging        # Staging environment

# Build for production
npm run build

# Run production build
npm run start:build:prod

# Code quality
npm run lint                 # Check code quality
npm run lint:fix            # Auto-fix issues
npm run format              # Format code with Prettier
```

---

## 🗄️ Database Management

### Drizzle ORM Commands

```bash
# Generate migration from schema changes
npm run db:generate

# Run migrations
npm run db:migrate:local     # Local
npm run db:migrate:dev       # Development
npm run db:migrate:staging   # Staging
npm run db:migrate:prod      # Production

# Database seeding
npm run db:seed:local
npm run db:seed:dev
npm run db:seed:staging
npm run db:seed:prod

# Seed super admin
npm run db:seed:super-admin:local
npm run db:seed:super-admin:prod

# Development utilities
npm run db:push:local        # Push schema without migrations
npm run db:studio:local      # Open Drizzle Studio GUI
npm run db:check:local       # Check migration conflicts
```

### MongoDB to PostgreSQL Migration

Legacy migration scripts for data transfer:

```bash
# User data migration
npm run migrate:mongo-users:local
npm run migrate:mongo-users:prod

# Content migration
npm run migrate:mongo-blogs:local
npm run migrate:mongo-faqs:local
npm run migrate:mongo-tax-credits:local

# Application data
npm run migrate:mongo-applications:local
npm run migrate:mongo-questionnaires:local
```

---

## 📡 API Modules

### Core Modules

| Module            | Endpoints                | Description                                                       |
| ----------------- | ------------------------ | ----------------------------------------------------------------- |
| **User**          | `/api/v1/users`          | User authentication, profile, account management, spouse binding  |
| **Admin**         | `/api/v1/admins`         | Admin authentication, management, role assignment                 |
| **Applications**  | `/api/v1/applications`   | Tax application lifecycle, status tracking, document verification |
| **Questionnaire** | `/api/v1/questionnaires` | Dynamic questionnaire system with conditional logic               |
| **Files**         | `/api/v1/files`          | Document upload, S3 presigned URLs, file management               |
| **Chat**          | `/api/v1/chats`          | Real-time messaging (WebSocket + REST)                            |
| **WhatsApp**      | `/api/v1/whatsapp-chats` | WhatsApp Business API integration                                 |
| **Notifications** | `/api/v1/notifications`  | Multi-channel notification delivery                               |
| **Site Content**  | `/api/v1/site-contents`  | FAQs, policies, tax credits, document templates                   |
| **Blog**          | `/api/v1/blogs`          | Content management system                                         |
| **RBAC**          | `/api/v1/rbac`           | Roles, permissions, module access control                         |

### Authentication Flow

```typescript
// User Registration & Login
POST / api / v1 / users / auth / signup;
POST / api / v1 / users / auth / signin;
POST / api / v1 / users / auth / signout;
POST / api / v1 / users / auth / token / refresh;

// Email Verification
POST / api / v1 / users / auth / email / verify;
POST / api / v1 / users / auth / email / verify / confirm;

// Phone Verification (OTP via Twilio)
POST / api / v1 / users / auth / phone / verify;
POST / api / v1 / users / auth / phone / verify / confirm;

// Password Management
POST / api / v1 / users / auth / password / change;
POST / api / v1 / users / auth / password / reset;

// Social Authentication
POST / api / v1 / users / auth / google;
POST / api / v1 / users / auth / apple;
```

### Application Workflow

```typescript
// Application Management
GET    /api/v1/applications              # List applications (with filters)
POST   /api/v1/applications              # Create application
GET    /api/v1/applications/:id          # Get application details
PATCH  /api/v1/applications/:id          # Update application
DELETE /api/v1/applications/:id          # Delete application

// Questionnaire & Documents
GET    /api/v1/applications/:id/questionnaires
POST   /api/v1/applications/:id/questionnaires/submit
GET    /api/v1/applications/:id/documents
POST   /api/v1/applications/:id/documents/upload

// Agent Activation
POST   /api/v1/applications/:id/agent-activation

// Admin Review
POST   /api/v1/applications/:id/review
POST   /api/v1/applications/:id/documents/:docId/reject

// Payment Processing
GET    /api/v1/applications/:id/payment-session  # Create Revolut/Stripe session
POST   /api/v1/applications/:id/offline-payment  # Request offline payment
POST   /api/v1/applications/:id/payment/webhook  # Payment webhooks
```

### WebSocket Events (Real-Time Chat)

```typescript
// Client -> Server
socket.emit('chat:send', {
  chatType: 'general' | 'application',
  content: string,
  messageType: 'text' | 'image' | 'document',
  applicationId?: string,
  fileId?: string,
  userId?: string  // Admin only
});

// Server -> Client
socket.on('chat:message', (message) => {
  // Receive real-time messages
});
```

---

## 🔐 Security & Compliance

### GDPR Compliance

- **Data Encryption**: All PII encrypted at rest using AES-256
- **HMAC Hashing**: Searchable encryption for phone numbers and emails
- **Trigram Search**: Privacy-preserving fuzzy search
- **Right to Deletion**: Automated permanent deletion after 6 years (soft delete + hard delete)
- **Audit Logging**: Comprehensive activity logs for data access
- **Data Minimization**: Only essential data collected and stored

### Authentication & Authorization

- **JWT Tokens**: Access token (7 days) + Refresh token (30 days)
- **Role-Based Access Control (RBAC)**: Fine-grained permissions per module
- **Middleware Stack**:
  ```typescript
  authorize('ADMIN'); // Role check
  requireModuleAccess('users'); // Module-level access
  requirePermission('users', 'write'); // Specific permission
  ```

### API Security Features

- **Helmet.js**: HTTP security headers
- **CORS**: Configurable origin whitelisting
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Speed Limiting**: Gradual slowdown for repeated requests
- **Input Validation**: Zod schema validation on all endpoints
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM
- **XSS Protection**: Content Security Policy headers

---

## 💳 Payment Integration

### Revolut Payment Flow

1. **Create Customer**: Store customer in Revolut
2. **Create Order**: Generate checkout session
3. **Redirect**: User completes payment on Revolut
4. **Webhook**: Receive `ORDER_COMPLETED` event
5. **Update**: Mark payment as completed, trigger notifications

---

## 📧 Notification System

### Multi-Channel Delivery

| Channel      | Provider | Use Cases                                      |
| ------------ | -------- | ---------------------------------------------- |
| **Email**    | AWS SES  | Registration, status updates, payment receipts |
| **SMS**      | Twilio   | OTP verification, urgent alerts                |
| **Push**     | Firebase | Real-time updates, chat messages               |
| **WhatsApp** | Meta API | Customer support, status updates               |

### Notification Types

```typescript
const notificationTypes = {
  // Authentication
  verify_email,
  welcome_email,

  // Application
  agent_activation_completed,
  application_submitted,
  application_review,
  filing_completed,

  // Documents
  document_rejected,
  additional_document_request,

  // Payment
  payment_failed,
  payment_received,
  payment_reminder,
  offline_payment_rejected,

  // Refund
  refund_completed,

  // Account
  terms_and_conditions,
  offboard_user,
  new_admin_account,
};
```

### Email Templates

Handlebars templates with dynamic content:

```
src/mail/templates/
├── welcome_email.hbs
├── payment_reminder.hbs
├── agent_activation_completed.hbs
├── refund_completed.hbs
└── ...
```

---

## 🔄 Automated Jobs (Cron)

### Scheduled Tasks

```typescript
// Daily at 2:00 AM (Dublin timezone)
- Permanent User Deletion: Delete accounts 6+ years old (GDPR)

// Daily at 10:00 AM (Dublin timezone)
- Payment Reminders: Email users with pending payments (2-day intervals)
```

### Manual Job Execution

```bash
# Payment reminders
npm run script:payment-reminder:local

# User deletion
npm run delete-user:dev

# Phone number updates
npm run db:update:user-phone-numbers:local

# Trigram hash population (for search)
npm run populate-trigram-hashes:local
```

---

## 🔧 Environment Variables

### Core Configuration

```bash
# Runtime
NODE_ENV=local|development|staging|production
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secrets
JWT_ACCESS_TOKEN_SECRET=your-access-secret
JWT_REFRESH_TOKEN_SECRET=your-refresh-secret
JWT_ACCESS_TOKEN_EXPIRE=7d
JWT_REFRESH_TOKEN_EXPIRE=30d

# GDPR Encryption
HMAC_SECRET_KEY=your-hmac-key
ENCRYPTION_SECRET_KEY=your-encryption-key
```

### AWS Services

```bash
# S3 Storage
AWS_S3_BUCKET_NAME=your-bucket
AWS_ACCESS_KEY=your-access-key
AWS_SECRET_KEY=your-secret-key
AWS_REGION=eu-west-1
AWS_S3_URL=https://your-bucket.s3.amazonaws.com
S3_SIGNED_URL_EXPIRY=86400
```

### Payment Gateways

```bash
# Revolut
REVOLUT_API_SECRET_KEY=your-secret-key
REVOLUT_API_PUBLIC_KEY=your-public-key
REVOLUT_API=https://merchant.revolut.com
REVOLUT_WEBHOOK_URL=https://your-domain.com/api/v1/applications/payments/webhook
REVOLUT_ENV=sandbox|production

# Stripe
STRIPE_SECRET_KEY=your-secret-key
STRIPE_PUBLISHABLE_KEY=your-publishable-key
```

### Communication Services

```bash
# Twilio (SMS/OTP)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_SERVICE_SID=your-service-sid

# Firebase (Push Notifications)
FIREBASE_SERVICE_ACCOUNT=<json-credentials>

# WhatsApp Business
WA_BASE_URL=https://graph.facebook.com/v21.0
WA_MOBILE_NUMBER_ID=your-number-id
WA_API_TOKEN=your-api-token
WA_WEBHOOK_VERIFY_TOKEN=your-verify-token
```

### E-Signature (Zoho Sign)

```bash
ZOHO_CLIENT_ID=your-client-id
ZOHO_CLIENT_SECRET=your-client-secret
ZOHO_REFRESH_TOKEN=your-refresh-token
ZOHO_ACCOUNTS_URL=https://accounts.zoho.eu
ZOHO_SIGN_URL=https://sign.zoho.eu
ZOHO_TEMPLATE_ID=your-template-id
ZOHO_WEBHOOK_SECRET=your-webhook-secret
```

### Application URLs

```bash
ADMIN_DASHBOARD_BASE_URL=https://admin.taxmind.ie
USER_DASHBOARD_BASE_URL=https://taxmind.ie
SUPPORT_EMAIL_ID=support@taxmind.ie
```

---

## 🐳 Deployment

### Docker Deployment

```bash
# Build image
docker build -t taxmind-api:latest .

# Run container
docker run -d \
  -p 5000:5000 \
  --name taxmind-api \
  --env-file .env.production \
  taxmind-api:latest
```

### Docker Compose (with Redis)

```bash
docker-compose up -d
```

### PM2 Process Manager

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs taxmind-api

# Restart
pm2 restart taxmind-api
```

### AWS Deployment (ECS/Fargate)

The project includes AWS CodeBuild specs (`buildspec-dev.yml`, `buildspec-prod.yml`) for automated CI/CD:

1. Build Docker image
2. Push to Amazon ECR
3. Deploy to ECS/Fargate via AWS CodePipeline

---

## 📊 Monitoring & Logging

### Winston Logger

```typescript
logger.info('Application started', { port: 5000 });
logger.error('Payment failed', { userId, error: err.message });
logger.warn('Rate limit exceeded', { ip: req.ip });
```

Logs stored in:

- Console (development)
- Daily rotating files (`logs/`)
- CloudWatch Logs (production)

### Activity Audit Logs

All admin actions logged:

- User creation/modification/deletion
- Role/permission changes
- Application status updates
- Document rejections

---

Powered by Swagger UI with OpenAPI 3.0 specification (`docs/api-doc.yml`).

---

## 🛠️ Development Guidelines

### Code Quality

```bash
# ESLint + Prettier
npm run lint
npm run lint:fix
npm run format
```

### TypeScript Path Aliases

```typescript
import { db } from '@/database';
import { mail } from '@/mail';
import { authorize } from '@/middleware/authorize';
```

### Service Handler Pattern

```typescript
export const createUser = serviceHandler(schema, async (req, res) => {
  const data = req.body;
  // Business logic here
  return res.success('User created', user, 201);
});
```

### Error Handling

```typescript
throw new ApiError('User not found', 404);
throw new ApiError('Invalid credentials', 401);
throw new ApiError('Permission denied', 403);
```

---
