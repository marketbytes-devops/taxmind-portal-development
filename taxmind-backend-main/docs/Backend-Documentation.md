# TaxMind Backend — Technical Documentation

> **Production-Grade REST API for Irish Tax Filing and Refund Management Platform**

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Project Structure](#project-structure)
5. [Core Modules & APIs](#core-modules--apis)
6. [Database Schema & Data Management](#database-schema--data-management)
7. [Third-Party Integrations](#third-party-integrations)
8. [Security & Compliance](#security--compliance)
9. [Authentication & Authorization](#authentication--authorization)
10. [Error Handling & Logging](#error-handling--logging)
11. [Background Jobs & Automation](#background-jobs--automation)
12. [Deployment & DevOps](#deployment--devops)
13. [Environment Configuration](#environment-configuration)
14. [API Documentation](#api-documentation)
15. [Development Workflow](#development-workflow)

---

## Executive Summary

TaxMind Backend is a comprehensive RESTful API platform built to power a comprehensive tax filing and refund management system for Irish taxpayers. The system handles the complete lifecycle of tax applications—from user registration and questionnaire submissions to document management, payment processing, and refund distribution.

### Key Capabilities

- **Modular Architecture**: Modular scalable architecture
- **GDPR Compliance**: End-to-end data encryption, soft deletion, automated retention policies, and audit trails
- **Security**: JWT authentication, granular RBAC, encrypted data at rest
- **Multi-Channel Communications**: Email (AWS SES), SMS (Twilio), Push Notifications (Firebase), WhatsApp Business API
- **Real-Time Features**: WebSocket-based chat system for user-admin communication
- **Payment Processing**: Integrated Revolut payment gateway with webhook processing and offline payment handling
- **Document Management**: Secure AWS S3 storage with presigned URLs and document verification workflows
- **E-Signature**: Zoho Sign integration for digital signature collection
- **Advanced Search**: Trigram-based partial search with HMAC hashing for privacy-preserving queries
- **Operational Excellence**: Health checks, structured logging, automated cron jobs, and graceful shutdown

---

## Technology Stack

### Core Technologies

| Component      | Technology  | Version | Purpose                        |
| -------------- | ----------- | ------- | ------------------------------ |
| **Runtime**    | Node.js     | 22.18.0 | JavaScript runtime environment |
| **Language**   | TypeScript  | 5.8.3   | Type-safe development          |
| **Framework**  | Express.js  | 5.1.0   | Web application framework      |
| **Database**   | PostgreSQL  | Latest  | Primary relational database    |
| **ORM**        | Drizzle ORM | 0.44.3  | Type-safe database queries     |
| **Real-Time**  | Socket.IO   | 4.8.1   | WebSocket communication        |
| **Validation** | Zod         | 4.0.5   | Runtime schema validation      |
| **Container**  | Docker      | Latest  | Containerization               |

### Major Dependencies

- **Security**: `bcrypt` (password hashing), `jsonwebtoken` (JWT), `helmet` (HTTP headers)
- **HTTP**: `axios` (external requests), `cors`, `compression`, `cookie-parser`
- **Logging**: `winston` (structured logging), `winston-daily-rotate-file`
- **Date Handling**: `date-fns` (date utilities)
- **File Processing**: `pdfkit` (PDF generation)
- **Validation**: `zod`, `zod-validation-error`
- **Template Engine**: `handlebars` (email templates)
- **Utilities**: `nanoid`, `uuid`, `libphonenumber-js`

---

---

## System Architecture

### Application Bootstrap Flow

```
src/index.ts (Entry Point)
    ↓
    ├─→ Module alias registration (@/* paths)
    ↓
src/server.ts (Server Initialization)
    ↓
    ├─→ createEnv() - Environment validation
    ├─→ checkDbConnection() - PostgreSQL connectivity
    ├─→ HTTP Server creation
    ├─→ Terminus health check endpoints
    ├─→ initSocket() - WebSocket initialization
    ├─→ initializeCronJobs() - Scheduled tasks
    └─→ Server listening on configured PORT
```

### Express Application Structure (`src/app.ts`)

**Middleware Stack (Execution Order)**:

1. **Response Enhancer** - Adds utility methods to response object
2. **Static Files** - Serves public directory
3. **Security Headers** - Helmet.js for HTTP security
4. **CORS** - Environment-based origin control
5. **Compression** - gzip compression for responses
6. **URL Encoded Parser** - Form data parsing with 10mb limit
7. **Body Parsing** - Conditional: Raw for webhooks, JSON for other routes (10mb limit)
8. **Cookie Parser** - Cookie handling
9. **Request Logger** - Winston-based HTTP logging
10. **HTTP Context** - Request-scoped context storage
11. **Request ID Generation** - Unique ID per request
12. **Custom Request Logging** - Structured logging with PII filtering

**Routing Architecture**:

```
/api
  ├── /docs (Swagger UI)
  └── /v1
      ├── /users (User management & auth)
      ├── /admins (Admin management)
      ├── /applications (Tax applications)
      ├── /files (Document management)
      ├── /blogs (Content management)
      ├── /site-contents (Policies, FAQs, etc.)
      ├── /questionnaires (Dynamic forms)
      ├── /chats (Real-time messaging)
      ├── /whatsapp-chats (WhatsApp integration)
      ├── /notifications (Multi-channel notifications)
      ├── /rbac (Role-based access control)
      └── /common (Public endpoints)
```

### High-Level Data Flow

```
Client Request
    ↓
[CORS & Security Headers]
    ↓
[Request Logging & ID Generation]
    ↓
[JWT Authentication] → authorize() middleware
    ↓
[RBAC Permission Check] → requirePermission()
    ↓
[Route Handler] → services.ts
    ↓
[Business Logic & Validation] → Zod schemas
    ↓
[Database Operations] → Drizzle ORM
    ↓
[Response Formatting] → response.success() / response.error()
    ↓
[Error Handler] → standardErrorHandler
    ↓
Client Response
```

---

## Project Structure

```
TaxMind-Backend/
│
├── src/                                # Source code directory
│   ├── index.ts                        # Application entry point
│   ├── server.ts                       # HTTP server + Socket.IO + cron initialization
│   ├── app.ts                          # Express app configuration & middleware
│   │
│   ├── constants/                      # Application constants
│   │   ├── index.ts                    # Core constants (CORS, enums, statuses)
│   │   └── modulePermissions.ts        # RBAC module configurations
│   │
│   ├── database/                       # Database layer
│   │   ├── index.ts                    # Connection pool & Drizzle instance
│   │   ├── models/                     # Drizzle ORM schemas
│   │   │   ├── users.ts               # User table with encrypted fields
│   │   │   ├── admins.ts              # Admin users
│   │   │   ├── applications.ts        # Tax applications
│   │   │   ├── files.ts               # File metadata
│   │   │   ├── chats.ts               # Chat messages
│   │   │   ├── notifications.ts       # Notification templates
│   │   │   ├── questionnaires.ts      # Dynamic questionnaires
│   │   │   ├── questions.ts           # Question definitions
│   │   │   ├── roles.ts               # RBAC roles
│   │   │   ├── modules.ts             # System modules
│   │   │   ├── payments.ts            # Payment transactions
│   │   │   └── ... (40+ tables total)
│   │   ├── migrations/                 # SQL migration files
│   │   ├── seeders/                    # Database seed scripts
│   │   └── utils/                      # Custom DB types & utilities
│   │
│   ├── modules/                        # Feature modules (domain-driven)
│   │   ├── index.ts                    # Router aggregation
│   │   ├── user/                       # User module
│   │   │   ├── routes.ts              # HTTP route definitions
│   │   │   ├── services.ts            # Business logic
│   │   │   └── validations.ts         # Zod validation schemas
│   │   ├── admin/                      # Admin module
│   │   ├── applications/               # Tax application lifecycle
│   │   ├── files/                      # Document management
│   │   ├── blog/                       # Content management
│   │   ├── site-content/               # FAQs, policies, tax credits
│   │   ├── questionnaire/              # Dynamic questionnaire system
│   │   ├── chat/                       # Real-time chat (Socket.IO)
│   │   │   ├── routes.ts              # REST endpoints
│   │   │   ├── services.ts            # Chat logic
│   │   │   └── socket.ts              # WebSocket handlers
│   │   ├── whatsapp-chat/              # WhatsApp Business integration
│   │   ├── notification/               # Multi-channel notifications
│   │   ├── rbac/                       # Role-based access control
│   │   └── common/                     # Shared/public endpoints
│   │
│   ├── middleware/                     # Express middleware
│   │   ├── authorize/                  # JWT authentication
│   │   │   ├── index.ts               # Main authorize middleware
│   │   │   └── helper.ts              # JWT decode & user loading
│   │   ├── rbac.ts                     # Permission checking middleware
│   │   ├── errorHandler.ts             # Global error handling
│   │   ├── notFoundHandler.ts          # 404 handler
│   │   ├── requestLogger.ts            # HTTP request logging
│   │   ├── responseEnhancer.ts         # Response utility methods
│   │   ├── paginate.ts                 # Pagination helper
│   │   ├── sort.ts                     # Sorting helper
│   │   ├── rateLimiter.ts              # Rate limiting
│   │   ├── speedLimiter.ts             # Speed limiting
│   │   ├── revolutIpAllowlist.ts       # Revolut webhook IP validation
│   │   └── revolutWebhookSignatureVerification.ts  # Webhook signature
│   │
│   ├── integrations/                   # External service integrations
│   │   ├── awsS3.ts                   # AWS S3 file storage
│   │   ├── awsSES.ts                  # AWS SES email service
│   │   ├── twilio.ts                  # Twilio SMS service
│   │   ├── firbase.ts                 # Firebase Cloud Messaging
│   │   ├── revolut.ts                 # Revolut payment gateway
│   │   ├── stripe.ts                  # Stripe payment (future)
│   │   ├── zohoSign.ts                # Zoho Sign e-signature
│   │   ├── googleLogin.ts             # Google OAuth
│   │   ├── appleLogin.ts              # Apple Sign In
│   │   ├── redis.ts                   # Redis caching
│   │   └── flowise.ts                 # AI chatbot integration
│   │
│   ├── logger/                         # Logging infrastructure
│   │   ├── index.ts                   # Winston logger configuration
│   │   └── activityLog.ts             # Admin activity logging
│   │
│   ├── mail/                           # Email system
│   │   ├── handler.ts                 # Email sending logic
│   │   ├── index.ts                   # Email service exports
│   │   ├── loadEmailTemplate.ts       # Template loader
│   │   └── templates/                 # Handlebars email templates
│   │       ├── welcome_email.hbs
│   │       ├── verify_email.hbs
│   │       ├── payment_reminder.hbs
│   │       └── ... (15+ templates)
│   │
│   ├── notifications/                  # Notification system
│   │   ├── index.ts                   # Notification dispatcher
│   │   ├── notificationHandler.ts     # Multi-channel handler
│   │   └── templates/                 # Notification templates
│   │
│   ├── scripts/                        # Utility scripts & cron jobs
│   │   ├── cronScheduler.ts           # Cron job initialization
│   │   ├── paymentReminderJob.ts      # Payment reminder automation
│   │   ├── permanentUserDeletion.ts   # GDPR data retention
│   │   ├── populateTrigramHashes.ts   # Search index population
│   │   ├── migrate.ts                 # Database migration runner
│   │   ├── generate.ts                # Schema generation
│   │   ├── seedSuperAdmin.ts          # Super admin seeding
│   │   ├── setupRevolutWebhook.ts     # Revolut webhook setup
│   │   └── userPhoneNumberUpdateJob.ts # Data migration utility
│   │
│   ├── types/                          # TypeScript type definitions
│   │   ├── index.ts                   # Shared types
│   │   └── types.d.ts                 # Global type declarations
│   │
│   └── utils/                          # Utility functions
│       ├── crypto.ts                  # Encryption, hashing, trigrams
│       ├── apiError.ts                # Custom error class
│       ├── env.ts                     # Environment validation
│       ├── generateUniqueId.ts        # ID generation
│       ├── terminus.ts                # Health check configuration
│       ├── serviceHandler.ts          # Service error handling
│       ├── prettifyZodMessage.ts      # Error message formatting
│       └── ... (30+ utility files)
│
├── docs/                               # Documentation
│   ├── api-doc.yml                    # OpenAPI/Swagger specification
│   ├── TAXMIND_postman_collection.json # Postman collection
│   ├── TRIGRAM_HASH_SEARCH_GUIDE.md   # Search implementation guide
│   └── api-examples/                  # API response examples
│
├── logs/                               # Application logs (generated)
│   └── application-YYYY-MM-DD.log     # Daily rotating logs
│
├── github/workflows/                   # CI/CD workflows
│   └── development.yml                # Dev deployment pipeline
│
├── Dockerfile                          # Container definition
├── docker-compose.yml                  # Local development compose
├── ecosystem.config.js                 # PM2 configuration
├── drizzle.config.ts                   # Drizzle ORM configuration
├── tsconfig.json                       # TypeScript compiler options
├── package.json                        # Dependencies & scripts
├── buildspec-dev.yml                   # AWS CodeBuild (dev)
├── buildspec-prod.yml                  # AWS CodeBuild (prod)
└── README.md                           # Project overview
```

---

---

## Core Modules & APIs

Each module follows a consistent three-layer architecture:

- **`routes.ts`**: HTTP endpoint definitions with middleware
- **`services.ts`**: Business logic and database operations
- **`validations.ts`**: Zod schema definitions for request validation

### 1. User Module (`/api/v1/users`)

**Purpose**: User authentication, profile management, and account operations

**Key Endpoints**:

| Method | Endpoint                     | Access | Description                     |
| ------ | ---------------------------- | ------ | ------------------------------- |
| POST   | `/auth/signin`               | Public | Email/password login            |
| POST   | `/auth/signup`               | Public | User registration               |
| POST   | `/auth/signout`              | User   | Logout and token invalidation   |
| POST   | `/auth/token/refresh`        | Public | Access token refresh            |
| POST   | `/auth/password/change`      | User   | Password change (authenticated) |
| POST   | `/auth/password/reset`       | Public | Password reset via email        |
| POST   | `/auth/email/verify`         | Public | Send email OTP                  |
| POST   | `/auth/email/verify/confirm` | Public | Verify email OTP                |
| POST   | `/auth/phone/verify`         | Public | Send SMS OTP                    |
| POST   | `/auth/phone/verify/confirm` | Public | Verify phone OTP                |
| GET    | `/profile`                   | User   | Get current user profile        |
| PATCH  | `/profile`                   | User   | Update user profile             |
| POST   | `/auth/spouse/unbind`        | User   | Unbind spouse account           |
| DELETE | `/auth/delete-account`       | User   | Soft delete user account        |
| GET    | `/`                          | Admin  | List all users (paginated)      |
| GET    | `/:userId`                   | Admin  | Get user details by ID          |
| GET    | `/off-boarded`               | Admin  | List offboarded users           |
| DELETE | `/:userId/offboard`          | Admin  | Offboard/deactivate user        |
| POST   | `/queries`                   | Public | Submit contact query            |
| GET    | `/queries`                   | Admin  | List user queries               |
| GET    | `/queries/:id`               | Admin  | Get query details               |
| POST   | `/agent-activations/upload`  | Admin  | Upload agent activation data    |
| GET    | `/agent-activations`         | Admin  | List agent activations          |
| POST   | `/esign/webhook`             | Public | Zoho Sign webhook handler       |

**Features**:

- Multi-factor authentication (email + phone OTP)
- Spouse account linking for joint tax filing
- GDPR-compliant soft deletion
- Admin search with trigram-based partial matching

---

### 2. Admin Module (`/api/v1/admins`)

**Purpose**: Admin user management and administrative operations

**Key Endpoints**:

| Method | Endpoint                     | Access | Description                |
| ------ | ---------------------------- | ------ | -------------------------- |
| POST   | `/auth/signin`               | Public | Admin login                |
| POST   | `/auth/signout`              | Admin  | Admin logout               |
| POST   | `/auth/token/refresh`        | Public | Refresh admin access token |
| POST   | `/auth/password/change`      | Admin  | Change admin password      |
| POST   | `/auth/password/reset`       | Public | Reset admin password       |
| POST   | `/auth/email/verify`         | Public | Send admin email OTP       |
| POST   | `/auth/email/verify/confirm` | Public | Verify admin email         |
| GET    | `/profile`                   | Admin  | Get admin profile          |
| PUT    | `/:adminId/profile`          | Admin  | Update admin profile       |
| POST   | `/`                          | Admin  | Create new admin account   |
| GET    | `/`                          | Admin  | List all admins            |
| GET    | `/lookup`                    | Admin  | Admin lookup/search        |
| GET    | `/dashboard`                 | Admin  | Get admin dashboard data   |
| GET    | `/reports`                   | Admin  | Get reports data           |

**Features**:

- Separate admin authentication system
- Role-based access control integration
- Activity logging for compliance
- Admin creation with email notifications

---

### 3. Applications Module (`/api/v1/applications`)

**Purpose**: Tax application lifecycle management

**Application Lifecycle**:

```
draft → submitted → documents_upload_pending → documents_uploaded
→ documents_verified → reviewed → processing → refund_completed
```

**Key Endpoints**:

**Application Management**:

| Method | Endpoint                     | Access     | Description                      |
| ------ | ---------------------------- | ---------- | -------------------------------- |
| POST   | `/start`                     | User       | Create new tax application       |
| GET    | `/`                          | User       | List user's applications         |
| GET    | `/claims`                    | User       | Get claim history                |
| GET    | `/all`                       | Admin      | List all applications (filtered) |
| GET    | `/user`                      | Admin      | List user applications           |
| GET    | `/:applicationId`            | User/Admin | Get application details          |
| GET    | `/:applicationId/steps/:key` | User       | Get application step data        |
| GET    | `/:applicationId/documents`  | Admin      | Get application documents        |
| POST   | `/notes`                     | Admin      | Add note to application          |
| GET    | `/:applicationId/notes`      | Admin      | List application notes           |

**Document Management**:

| Method | Endpoint                                           | Access     | Description                  |
| ------ | -------------------------------------------------- | ---------- | ---------------------------- |
| POST   | `/documents/request`                               | Admin      | Request additional documents |
| PATCH  | `/documents/:applicationDocumentCategoryId/status` | Admin      | Update document status       |
| POST   | `/:applicationId/check/documents_uploaded`         | User/Admin | Check all docs uploaded      |
| PATCH  | `/:applicationId/status/documents_uploaded`        | Admin      | Mark documents as verified   |
| PATCH  | `/:applicationId/status/reviewed`                  | Admin      | Mark application as reviewed |

**Financial & Amounts**:

| Method | Endpoint             | Access | Description              |
| ------ | -------------------- | ------ | ------------------------ |
| POST   | `/amounts/calculate` | Admin  | Calculate refund amounts |
| POST   | `/amounts/submit`    | Admin  | Submit final amounts     |

**Payment Processing**:

| Method | Endpoint                             | Access | Description                    |
| ------ | ------------------------------------ | ------ | ------------------------------ |
| POST   | `/payments/checkout`                 | User   | Create payment checkout        |
| POST   | `/payments/webhook`                  | Public | Revolut webhook handler        |
| POST   | `/payments/offline/request`          | User   | Request offline payment        |
| POST   | `/payments/offline/request/approve`  | Admin  | Approve offline payment        |
| POST   | `/payments/offline/request/reject`   | Admin  | Reject offline payment         |
| GET    | `/payments/offline/request/pending`  | Admin  | List pending offline payments  |
| GET    | `/payments/offline/request/rejected` | Admin  | List rejected offline payments |
| GET    | `/payments/completed`                | Admin  | List completed payments        |

**Reviews**:

| Method | Endpoint              | Access     | Description               |
| ------ | --------------------- | ---------- | ------------------------- |
| POST   | `/reviews`            | User       | Submit application review |
| GET    | `/reviews`            | User/Admin | List all reviews          |
| GET    | `/reviews/:id`        | Admin      | Get application review    |
| PATCH  | `/reviews/:id/status` | Admin      | Update review status      |

**Features**:

- Multi-step application workflow
- Document upload and verification
- Refund calculation with commission/VAT
- Payment processing (online and offline)
- Application amendments support
- Admin notes and document requests
- Payment reminders (automated)

---

### 4. Files Module (`/api/v1/files`)

**Purpose**: Secure document upload and management via AWS S3

**Key Endpoints**:

| Method | Endpoint          | Access     | Description                    |
| ------ | ----------------- | ---------- | ------------------------------ |
| POST   | `/request-upload` | User/Admin | Get presigned upload URL       |
| POST   | `/confirm-upload` | User/Admin | Confirm file upload            |
| GET    | `/:id`            | Public     | Get file by ID (presigned URL) |
| GET    | `/`               | Admin      | List all files                 |
| DELETE | `/`               | User/Admin | Delete file with associations  |
| POST   | `/cleanup`        | Admin      | Cleanup orphaned/expired files |

**Features**:

- Presigned URL upload (direct to S3)
- File metadata storage in PostgreSQL
- Secure file retrieval with expiring URLs
- File association with applications
- Support for multiple document types

---

### 5. Questionnaire Module (`/api/v1/questionnaires`)

**Purpose**: Dynamic questionnaire system for tax information collection

**Key Endpoints**:

| Method | Endpoint                            | Access     | Description                       |
| ------ | ----------------------------------- | ---------- | --------------------------------- |
| GET    | `/`                                 | Admin      | List questionnaires               |
| GET    | `/:questionnaireId`                 | Admin      | Get single questionnaire          |
| POST   | `/`                                 | Admin      | Create questionnaire              |
| POST   | `/import`                           | Admin      | Import questionnaire JSON         |
| POST   | `/:questionnaireId/publish`         | Admin      | Publish questionnaire             |
| DELETE | `/:questionnaireId`                 | Admin      | Delete questionnaire (draft only) |
| GET    | `/:questionnaireId/categories`      | Admin      | List question categories          |
| POST   | `/categories`                       | Admin      | Create question category          |
| PATCH  | `/categories/:categoryId`           | Admin      | Update question category          |
| DELETE | `/categories/:categoryId`           | Admin      | Delete question category          |
| GET    | `/categories/:categoryId/questions` | Admin      | List questions in category        |
| POST   | `/questions`                        | Admin      | Create question                   |
| GET    | `/questions/:questionId`            | Admin      | Get question details              |
| PATCH  | `/questions/:questionId`            | Admin      | Update question                   |
| DELETE | `/questions/:questionId`            | Admin      | Delete question                   |
| POST   | `/responses`                        | User       | Create response                   |
| POST   | `/answers`                          | User       | Save answer                       |
| POST   | `/responses/submit`                 | User       | Submit completed response         |
| GET    | `/responses`                        | Admin      | List all responses                |
| GET    | `/responses/:responseId`            | User/Admin | Get response details              |
| GET    | `/applications/:applicationId`      | User/Admin | Get response by application       |
| PATCH  | `/responses/:responseId`            | User       | Update response progress          |

**Features**:

- Version control for questionnaires
- Conditional logic (show/hide based on answers)
- Required field validation
- Save progress functionality
- Response review and approval workflow

---

### 6. Chat Module (`/api/v1/chats`)

**Purpose**: Real-time messaging between users and admins via WebSocket

**REST Endpoints**:

| Method | Endpoint                            | Access     | Description                            |
| ------ | ----------------------------------- | ---------- | -------------------------------------- |
| GET    | `/admins/support-conversations`     | Admin      | List support chat conversations        |
| GET    | `/admins/application-conversations` | Admin      | List application-related conversations |
| GET    | `/messages`                         | User/Admin | Get chat messages                      |
| POST   | `/read`                             | User/Admin | Mark messages as read                  |

#### WebSocket Implementation

**Authentication Flow**:

1. Client connects with JWT token in `socket.handshake.auth.token`
2. Token can include `Bearer ` prefix (automatically stripped)
3. Token decoded and validated
4. User/Admin loaded from database
5. Socket automatically joins appropriate room:
   - **Admins**: Join `admins` room (all admins receive messages)
   - **Users**: Join `user:{userId}` room (individual user isolation)

---

**WebSocket Events**:

| Event          | Direction       | Description                                |
| -------------- | --------------- | ------------------------------------------ |
| `connection`   | Client → Server | Initial connection with JWT authentication |
| `chat:send`    | Client → Server | Send chat message                          |
| `chat:message` | Server → Client | Broadcast message to recipient(s)          |
| `disconnect`   | Client → Server | Socket disconnection cleanup               |

---

**Event: `chat:send`**

**Payload Schema**:

```typescript
{
  chatType: string,          // Type of chat conversation
  content: string,           // Message content (required for text)
  messageType: 'text' | 'file' | 'image' | 'document', // Default: 'text'
  applicationId?: UUID,      // Optional: Link to application
  fileId?: UUID,             // Required for non-text messages
  userId?: UUID              // Required when admin sends (target user)
}
```

**Validation Rules**:

- `fileId` required when `messageType !== 'text'`
- `userId` required when admin sends message (to specify recipient)
- `applicationId` validated if provided (must exist and user must own it for non-admins)
- `fileId` validated if provided (must exist and be active)

**Behavior**:

- **User sends**: Message broadcast to all admins in `admins` room
- **Admin sends**: Message sent to specific `user:{userId}` room
- Message persisted to database before broadcast
- Callback function returns success/error with created message

**Response** (via callback):

```typescript
{
  success: boolean,
  message?: object,  // Created chat message
  error?: string     // Error message if failed
}
```

---

**Event: `chat:message`**

**Broadcast Direction**:

- **From User → To All Admins**: Sent to `admins` room
- **From Admin → To Specific User**: Sent to `user:{userId}` room

**Message Object**:

```typescript
{
  id: UUID,
  chatType: string,
  content: string,
  messageType: string,
  senderType: 'user' | 'admin',
  userId: UUID,
  adminId: UUID | null,
  applicationId: UUID | null,
  fileId: UUID | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

**Room Structure**:

- `admins` - All connected admin users (broadcast room)
- `user:{userId}` - Individual user room (1-to-1 with admin)

**Connection Persistence**:

- Socket data stores `user` or `admin` object
- Automatic room joining on connection
- Socket ID tracked per connection
- Cleanup on disconnect

---

**Error Handling**:

- Zod validation errors formatted and returned in callback
- API errors (404, 403, 400) caught and returned
- Authentication failures prevent connection
- Invalid references (application, file, user) rejected before message creation

---

**Features**:

- Real-time bidirectional communication
- JWT-based authentication
- Message persistence in PostgreSQL
- Admin broadcast (all admins notified of user messages)
- User-specific routing (admins target specific users)
- File attachment support (via fileId)
- Application context linking
- Validation before message creation

---

### 7. Notification Module (`/api/v1/notifications`)

**Purpose**: Multi-channel notification system

**Key Endpoints**:

| Method | Endpoint          | Access | Description               |
| ------ | ----------------- | ------ | ------------------------- |
| GET    | `/user`           | User   | List user notifications   |
| POST   | `/user/seen`      | User   | Mark notification as seen |
| PATCH  | `/user/fcm-token` | User   | Update FCM token          |

**Notification Types**:

- **Authentication**: Email verification, welcome email
- **Application**: Tax agent request, submission confirmation, filing completed
- **Documents**: Document rejected, additional document request
- **Payment**: Payment received, payment failed, payment reminder, offline payment rejected
- **Refund**: Refund completed
- **Account**: Terms update, account offboarding

**Channels**:

- Email (AWS SES)
- SMS (Twilio)
- Push notifications (Firebase)

---

### 8. RBAC Module (`/api/v1/rbac`)

**Purpose**: Role-based access control system

**Key Endpoints**:

| Method | Endpoint                     | Access | Description                        |
| ------ | ---------------------------- | ------ | ---------------------------------- |
| GET    | `/modules`                   | Admin  | List all modules with permissions  |
| POST   | `/modules/initialize`        | Admin  | Initialize modules and permissions |
| GET    | `/roles`                     | Admin  | List all roles (paginated)         |
| GET    | `/list-all-roles`            | Admin  | Get all roles (no pagination)      |
| POST   | `/roles`                     | Admin  | Create new role                    |
| GET    | `/roles/:roleId`             | Admin  | Get role details                   |
| PUT    | `/roles/:roleId`             | Admin  | Update role                        |
| DELETE | `/roles/:roleId`             | Admin  | Delete role                        |
| POST   | `/roles/:roleId/permissions` | Admin  | Assign permissions to role         |
| GET    | `/roles/:roleId/permissions` | Admin  | Get role permissions               |

**Permission Types**:

- `view` - Read access
- `create` - Create new records
- `edit` - Modify existing records
- `delete` - Remove records

**System Modules**:

- Users, Applications, Blogs, Files
- Questionnaires, Notifications
- Site Contents, RBAC, Contact Us
- Agent Activations

**Features**:

- Granular permission control
- Module-level access management
- Role inheritance (planned)
- Admin activity logging

---

### 9. Site Content Module (`/api/v1/site-contents`)

**Purpose**: Manage public-facing content and policies

**Key Endpoints**:

| Method | Endpoint                   | Access | Description                 |
| ------ | -------------------------- | ------ | --------------------------- |
| GET    | `/faqs`                    | Public | List FAQs                   |
| POST   | `/faqs`                    | Admin  | Create FAQ                  |
| PUT    | `/faqs/:id`                | Admin  | Update FAQ                  |
| DELETE | `/faqs/:id`                | Admin  | Delete FAQ                  |
| GET    | `/tax-credits`             | Public | List tax credits            |
| POST   | `/tax-credits`             | Admin  | Create tax credit           |
| PUT    | `/tax-credits/:id`         | Admin  | Update tax credit           |
| DELETE | `/tax-credits/:id`         | Admin  | Delete tax credit           |
| GET    | `/query-categories`        | Public | List query categories       |
| POST   | `/query-categories`        | Admin  | Create query category       |
| PUT    | `/query-categories/:id`    | Admin  | Update query category       |
| DELETE | `/query-categories/:id`    | Admin  | Delete query category       |
| GET    | `/document-categories`     | Public | List document categories    |
| POST   | `/document-categories`     | Admin  | Create document category    |
| PUT    | `/document-categories/:id` | Admin  | Update document category    |
| DELETE | `/document-categories/:id` | Admin  | Delete document category    |
| GET    | `/document-templates`      | Public | List document templates     |
| POST   | `/document-templates`      | Admin  | Create document template    |
| PUT    | `/document-templates/:id`  | Admin  | Update document template    |
| DELETE | `/document-templates/:id`  | Admin  | Delete document template    |
| GET    | `/carousel-images`         | Public | List carousel images        |
| POST   | `/carousel-images`         | Admin  | Create carousel image       |
| DELETE | `/carousel-images/:id`     | Admin  | Delete carousel image       |
| GET    | `/social-media`            | Public | List social media links     |
| POST   | `/social-media`            | Admin  | Create social media link    |
| PUT    | `/social-media/:id`        | Admin  | Update social media link    |
| DELETE | `/social-media/:id`        | Admin  | Delete social media link    |
| GET    | `/policies/active`         | Public | Get active policies by type |
| GET    | `/policies`                | Admin  | List all policies           |
| POST   | `/policies`                | Admin  | Create policy version       |
| PUT    | `/policies/:id`            | Admin  | Update policy               |
| DELETE | `/policies/:id`            | Admin  | Delete policy               |
| GET    | `/config`                  | Public | Get site configuration      |
| PATCH  | `/config`                  | Admin  | Update site configuration   |

**Policy Types**:

- Privacy Policy
- Cookie Policy
- Fee Structure
- Terms & Conditions

---

### 10. Blog Module (`/api/v1/blogs`)

**Purpose**: Content management for tax-related articles

**Key Endpoints**:

| Method | Endpoint           | Access | Description            |
| ------ | ------------------ | ------ | ---------------------- |
| GET    | `/`                | Public | List published blogs   |
| GET    | `/:identifier`     | Public | Get blog by identifier |
| POST   | `/`                | Admin  | Create blog            |
| PUT    | `/:blogId`         | Admin  | Update blog            |
| PATCH  | `/:blogId/publish` | Admin  | Publish/unpublish blog |
| DELETE | `/:blogId`         | Admin  | Delete blog            |

**Features**:

- SEO-friendly slugs
- Draft/published status
- Featured images
- Tags and categories
- Reading time calculation

---

### 11. WhatsApp Chat Module (`/api/v1/whatsapp-chats`)

**Purpose**: WhatsApp Business API integration

**Key Endpoints**:

| Method | Endpoint          | Access | Description                      |
| ------ | ----------------- | ------ | -------------------------------- |
| GET    | `/webhook`        | Public | WhatsApp webhook verification    |
| POST   | `/webhook`        | Public | WhatsApp webhook message handler |
| GET    | `/conversations`  | Admin  | List WhatsApp conversations      |
| GET    | `/messages`       | Admin  | Get WhatsApp messages            |
| POST   | `/read`           | Admin  | Mark WhatsApp messages as read   |
| POST   | `/send`           | Admin  | Send WhatsApp message            |
| GET    | `/download-media` | Admin  | Download WhatsApp media          |

**Features**:

- Bidirectional WhatsApp messaging
- Message persistence
- Admin dashboard integration

---

### 12. Common Module (`/api/v1`)

**Purpose**: Public and shared endpoints

**Key Endpoints**:

| Method | Endpoint | Access | Description   |
| ------ | -------- | ------ | ------------- |
| GET    | `/test`  | Public | Test endpoint |

---

## Data Model (Drizzle ORM)

- `users` — encrypted PII fields; trigram hash arrays for secure partial search; verification and notification preferences; GDPR policy acceptance tracking; Revolut customer linkage; soft deletion.
- `applications` — financial amounts encrypted; statuses, amendment flow, tax return document references; payment status; reminder tracking; audit timestamps.
- Other key tables: `files`, `admins`, `roles`, `modules`, `modulePermissions`, `roleModulePermissions`, `notifications`, `questionnaires`, `questions`, `questionCategories`, `questionnaireResponses`, `blogs`, `faqs`, `taxCredits`, `policies`, `chats`, `whatsappChats`, etc.
- Indexing strategy: GIN indexes on trigram arrays for fast search; frequent filter indexes on common query patterns.

Encryption & Search:

- Sensitive fields are stored using a custom encrypted type.
- Partial search uses hashed trigrams stored in array columns; queries use `@>` containment with GIN indexes.

---

## Integrations

- AWS S3: unique, sanitized filenames; presigned upload and retrieval; secure credentials via env vars.
- AWS SES: email sending through templated handlebars files.
- Twilio: SMS and OTP sending.
- Firebase (FCM): push notifications and device token handling; service account injected securely during build.
- Revolut: customer creation, order checkout, and webhook processing for payments.
- Zoho Sign: e-signature workflow and webhook processing.
- Stripe: utility scaffold for future payments if needed.
- Redis: caching and BullMQ queues for background processing.

---

## Security & Compliance

- Authentication: JWT-based; middleware `authorize` loads `user` or `admin` context per role.
- Authorization: RBAC middleware (`requirePermission`, `requireAllPermissions`, `requireAnyPermission`); admin-only enforcement where relevant.
- CORS: environment-based origin control via `constants.allowedOrigins`.
- Headers and bodies sanitized in logs (PII filtered in non-production).
- Rate limiting and speed limiting middlewares available for use.
- GDPR:
  - Soft deletion (`deletedAt`); long-term permanent deletion via cron job.
  - Policy acceptance tracking (privacy, cookies, fee structure, terms).
  - Payment reminder cadence controlled and audited.
- Health: Terminus managed graceful shutdown and health probes.

---

## Logging & Monitoring

- Winston logger with environment-based console verbosity and daily rotate file transport (`logs/application-%DATE%.log`).
- Structured JSON logs for HTTP requests (excluding `/docs`).
- Unhandled rejection/exception capture with process-level handlers.

---

## Cron Jobs & Automation

- `src/scripts/cronScheduler.ts`: initializes scheduled tasks in Europe/Dublin timezone.
  - Permanent user deletion (daily 02:00) respecting data retention policies.
  - Payment reminders (daily 10:00) for pending payments post refund completion.
- Jobs report stats and errors via logger; hooks ready for admin notifications.

---

## Deployment

- Development (AWS CodeBuild/ECR):
  - `buildspec-dev.yml` builds Docker image, injects Firebase service account via Secrets Manager into build arg, pushes to ECR, and emits `imagedefinitions.json` for downstream deployment.
- Production (AWS CodeBuild/ECR):
  - `buildspec-prod.yml` builds Docker image, injects Firebase service account via Secrets Manager into build arg, pushes to ECR, and emits `imagedefinitions.json` for downstream deployment.

---

## Environment & Configuration

- `.env.*` files: local, development, staging, production (referenced in scripts and PM2 config).
- Required env vars include (non-exhaustive):
  - `DATABASE_URL`, `PORT`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`
  - `REVOLUT_API`, `STRIPE_*` (if used), `TWILIO_*`, `FIREBASE_*`
- Drizzle config: `drizzle.config.ts` uses `DATABASE_URL` and outputs migrations to `src/database/migrations`.

---

## API Documentation

- Swagger OpenAPI: `docs/api-doc.yml` served at `/api/docs`.
- Route base: `/api/v1/...` per module.
- Common request headers:
  - `Authorization: Bearer <token>` for protected endpoints.
- Pagination: `paginate` middleware supports query pagination for list endpoints.

---

## Build & Runtime Scripts

Key `package.json` scripts:

- Start (TS dev watchers with env selection): `start:local|dev|staging|prod`
- Build: `npm run build` (tsc, copies mail templates and migrations)
- Database:
  - Drizzle generate/migrate/push/studio/check
  - Seeders and super admin seeds for all environments
  - Mongo → PostgreSQL migration scripts for legacy data
- Jobs:
  - Payment reminders, phone number updates, permanent deletion, trigram hashes population

---

## Operational Notes

- WebSocket auth: JWT passed via Socket.IO `handshake.auth.token` (supports `Bearer` prefix).
- File uploads: sanitize filenames; store per `NODE_ENV` namespace; confirm uploads create DB associations.
- Search: admin users can search via hashed trigram arrays; performant with GIN indexes.

---
