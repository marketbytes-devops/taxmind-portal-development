# TaxMind Client WebApp

A comprehensive Vue.js-based web application for tax filing and management services. This application provides an intuitive interface for users to apply for tax services, manage their profiles, upload documents, and track their tax filing status in real-time.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Build & Deployment](#build--deployment)
- [Docker](#docker)
- [Scripts](#scripts)
- [Key Dependencies](#key-dependencies)
- [Architecture](#architecture)
- [Contributing](#contributing)

## 🎯 Overview

TaxMind Client WebApp is a modern, responsive single-page application (SPA) built with Vue.js 2.6 and Vuetify. It provides a seamless user experience for tax filing services with features like real-time notifications via WebSockets, document management, digital signatures, and comprehensive user profile management.

## 🛠 Tech Stack

### Core Framework

- **Vue.js 2.6.11** - Progressive JavaScript framework
- **Vuex 3.6.2** - State management
- **Vue Router 3.6.5** - Client-side routing
- **Vuetify 2.6.0** - Material Design component framework

### Build Tools

- **Vue CLI 4.5.11** - Standard tooling for Vue.js development
- **Webpack** - Module bundler (via Vue CLI)
- **Babel** - JavaScript compiler
- **ESLint** - Code linting

### Real-time Communication

- **Socket.IO 4.8.1** - Real-time bidirectional event-based communication
- **Socket.IO Client 4.8.1** - Client-side Socket.IO
- **Vue Socket.IO 3.0.10** - Vue.js integration for Socket.IO

### Third-Party Integrations

- **Firebase 11.1.0** - Authentication and cloud services
- **DocuSign eSign 8.0.1** - Electronic signature integration
- **Axios 1.5.1** - HTTP client for API requests

### UI/UX Libraries

- **AOS 2.3.4** - Animate On Scroll library
- **CropperJS 1.6.2** - Image cropping
- **Vue Advanced Cropper 1.11.7** - Advanced image cropping for Vue
- **Vue Owl Carousel 2.0.3** - Carousel component
- **Signature Pad 5.0.4** - Smooth signature drawing
- **Vue Phone Number Input 1.12.13** - International phone number input

### Analytics & SEO

- **Vue Analytics 5.22.1** - Google Analytics integration
- **Vue Gtag 1.16.1** - Google Analytics 4 integration
- **Vue Meta 2.4.0** - Manage page meta information

### Development Tools

- **Compression Webpack Plugin 6.1.1** - Asset compression
- **Sass 1.32.0** - CSS preprocessor
- **Vue Template Compiler 2.6.11** - Template compilation

## 📁 Project Structure

```
TaxMind-Client-WebApp/
├── public/                          # Static assets
│   ├── index.html                   # HTML entry point
│   ├── favicon.ico                  # Application favicon
│   └── no_img.svg                   # Placeholder image
│
├── src/                             # Source files
│   ├── assets/                      # Static assets (images, fonts, icons)
│   │   ├── fonts/                   # Custom fonts
│   │   ├── icons/                   # Icon files
│   │   └── images/                  # Image assets
│   │
│   ├── components/                  # Vue components
│   │   ├── About/                   # About page components
│   │   ├── Application/             # Tax application components
│   │   │   └── components/          # Sub-components
│   │   │       ├── questionnaire/   # Questionnaire components
│   │   │       └── RefundAmountStep.vue
│   │   ├── ApplyNow/                # Registration & login components
│   │   │   ├── applyNow.vue
│   │   │   ├── loginPage.vue
│   │   │   ├── forgotPassword.vue
│   │   │   └── otpPage.vue
│   │   ├── Blogs/                   # Blog components
│   │   ├── Common/                  # Reusable common components
│   │   │   └── WelcomeHeader.vue
│   │   ├── CookiesPolicy/           # Cookie policy components
│   │   ├── Digitalsignature/        # Digital signature components
│   │   ├── FAQs/                    # FAQ components
│   │   ├── FeeStructure/            # Fee structure components
│   │   ├── LandingPage/             # Landing page components
│   │   │   └── homePage.vue
│   │   ├── PrivacyPolicy/           # Privacy policy components
│   │   ├── Profile/                 # User profile components
│   │   ├── T&C/                     # Terms & conditions components
│   │   ├── TaxDetailed/             # Tax details components
│   │   └── contactUs/               # Contact page components
│   │
│   ├── services/                    # API service modules
│   │   ├── api.js                   # Base API configuration
│   │   ├── application.js           # Application-related APIs
│   │   ├── files.js                 # File upload/download APIs
│   │   ├── profile.js               # User profile APIs
│   │   └── socket.js                # Socket.IO service
│   │
│   ├── Sockets/                     # Socket configuration
│   │   └── socket.js                # Socket initialization
│   │
│   ├── common/                      # Common utilities
│   │   └── constants/               # Application constants
│   │
│   ├── plugins/                     # Vue plugins
│   │   └── vuetify.js               # Vuetify configuration
│   │
│   ├── router.js                    # Vue Router configuration
│   ├── store.js                     # Vuex store
│   ├── main.js                      # Application entry point
│   └── App.vue                      # Root component
│
├── scripts/                         # Utility scripts
│   ├── analyze-migration.js         # Migration analysis tool
│   └── migrate-component.js         # Component migration tool
│
├── .vscode/                         # VS Code configuration
│   └── settings.json                # Editor settings
│
├── Dockerfile                       # Docker configuration
├── nginx.conf                       # Nginx server configuration
├── vue.config.js                    # Vue CLI configuration
├── babel.config.js                  # Babel configuration
├── package.json                     # NPM dependencies
├── buildspec-dev.yml                # AWS CodeBuild spec (dev)
├── buildspec-prod.yml               # AWS CodeBuild spec (prod)
└── README.md                        # Project documentation
```

## ✨ Features

### User Management

- User registration and authentication
- Login with email/password
- OTP verification
- Password reset functionality
- Profile management
- Session management with JWT

### Tax Application

- Multi-step tax application form
- Questionnaire system
- Document upload and management
- Image cropping and optimization
- Digital signature integration
- Application status tracking
- Refund amount calculation

### Real-time Features

- Live notifications via WebSockets
- Real-time application status updates
- Instant messaging support

### Document Management

- Secure file upload
- Image preview and zoom
- Document cropping
- Multiple file format support
- Download functionality

### Additional Features

- Responsive design for all devices
- Google Analytics integration
- SEO optimization with meta tags
- Animated scroll effects
- Carousel for showcasing features
- FAQ section
- Blog section
- Contact form
- Privacy policy and terms & conditions

## 📋 Prerequisites

- **Node.js**: v14.x or higher (v18.x recommended)
- **NPM**: v6.x or higher
- **Docker**: (Optional) For containerized deployment
- **Git**: For version control

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd TaxMind-Client-WebApp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration values.

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VUE_APP_API_BASE_URL=https://api.taxmind.com
VUE_APP_API_TIMEOUT=30000
VUE_APP_API_RETRY_ATTEMPTS=3
VUE_APP_API_RETRY_DELAY=1000

# Socket.IO Configuration
VUE_APP_SOCKET_URL=https://socket.taxmind.com
VUE_APP_SOCKET_PATH=/socket.io

# Media URLs
VUE_APP_MEDIA_URL=https://media.taxmind.com
VUE_APP_FILE_URL=https://files.taxmind.com

# Feature Flags
VUE_APP_USE_NEW_CAROUSEL_API=true
VUE_APP_USE_NEW_ADVANTAGES_API=true
VUE_APP_ENABLE_API_LOGGING=false

# Analytics
VUE_APP_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X

# Firebase Configuration (if applicable)
VUE_APP_FIREBASE_API_KEY=your-api-key
VUE_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
VUE_APP_FIREBASE_PROJECT_ID=your-project-id
```

## 💻 Development

### Start development server

```bash
npm run serve
```

The application will be available at `http://localhost:8080`

### Hot-reload

The development server supports hot module replacement (HMR) for instant updates during development.

### Linting

```bash
npm run lint
```

### Component Migration Tools

```bash
# Analyze components for migration
npm run analyze-migration

# Migrate a specific component
npm run migrate-component
```

## 🏗 Build & Deployment

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory with:

- Minified JavaScript and CSS
- Gzip compression for assets
- Code splitting for optimal loading
- Source maps disabled for security

### Build Configuration

The build process is configured in `vue.config.js`:

- **Transpile Dependencies**: Vuetify
- **Production Source Map**: Disabled
- **Compression**: Gzip compression for JS, CSS, HTML, SVG files
- **Threshold**: 10KB minimum file size for compression

## 🐳 Docker

### Build Docker Image

```bash
docker build -t taxmind-webapp .
```

### Run Docker Container

```bash
docker run -p 80:80 taxmind-webapp
```

### Docker Configuration

The application uses a multi-stage Docker build:

1. **Build Stage**: Node.js 18 Alpine for building the Vue app
2. **Production Stage**: Nginx Alpine for serving static files

### Environment Variables in Docker

Pass environment variables during build:

```bash
docker build \
  --build-arg VUE_APP_API_BASE_URL="https://api.taxmind.com" \
  --build-arg VUE_APP_SOCKET_URL="https://socket.taxmind.com" \
  -t taxmind-webapp .
```

## 📜 Scripts

| Script                      | Description                               |
| --------------------------- | ----------------------------------------- |
| `npm run serve`             | Start development server with hot-reload  |
| `npm run build`             | Build for production                      |
| `npm run lint`              | Lint and fix files                        |
| `npm run analyze-migration` | Analyze components for migration patterns |
| `npm run migrate-component` | Migrate component to new structure        |

## 📦 Key Dependencies

### Production Dependencies

| Package          | Version | Purpose                         |
| ---------------- | ------- | ------------------------------- |
| vue              | ^2.6.11 | Core framework                  |
| vuex             | ^3.6.2  | State management                |
| vue-router       | ^3.6.5  | Routing                         |
| vuetify          | ^2.6.0  | UI component library            |
| axios            | ^1.5.1  | HTTP client                     |
| socket.io-client | ^4.8.1  | Real-time communication         |
| firebase         | ^11.1.0 | Authentication & cloud services |
| docusign-esign   | ^8.0.1  | Electronic signatures           |
| cropperjs        | ^1.6.2  | Image cropping                  |
| signature_pad    | ^5.0.4  | Digital signatures              |
| aos              | ^2.3.4  | Scroll animations               |
| vue-meta         | ^2.4.0  | Meta tag management             |
| vue-gtag         | ^1.16.1 | Google Analytics 4              |

### Development Dependencies

| Package                    | Version | Purpose           |
| -------------------------- | ------- | ----------------- |
| @vue/cli-service           | ~4.5.11 | Vue CLI service   |
| sass                       | ~1.32.0 | CSS preprocessor  |
| eslint                     | ^6.7.2  | Code linting      |
| compression-webpack-plugin | ^6.1.1  | Asset compression |

## 🏛 Architecture

### State Management (Vuex)

The application uses Vuex for centralized state management:

- User authentication state
- Application form data
- Profile information
- Real-time notifications

### Routing

Vue Router handles client-side routing with:

- History mode for clean URLs
- Route guards for authentication
- Lazy loading for code splitting
- Meta tags for SEO

### API Layer

Centralized API service layer (`src/services/`) handles:

- HTTP requests with Axios
- Request/response interceptors
- Error handling
- Retry logic
- Authentication token management

### Real-time Communication

Socket.IO integration provides:

- Bi-directional communication
- Event-based messaging
- Automatic reconnection
- Room-based notifications

### Component Architecture

- **Atomic Design**: Components organized by functionality
- **Reusable Components**: Common components shared across features
- **Smart/Dumb Components**: Container and presentational component pattern
- **Scoped Styles**: Component-scoped CSS with Sass

## 🔒 Security Features

- JWT-based authentication
- Secure HTTP-only cookies
- CORS configuration
- Input validation and sanitization
- XSS protection
- CSRF protection
- Secure file upload validation

## 🚀 CI/CD

The project includes AWS CodeBuild specifications:

- **buildspec-dev.yml**: Development environment deployment
- **buildspec-prod.yml**: Production environment deployment

### Deployment Pipeline

1. Code pushed to repository
2. AWS CodeBuild triggered
3. Docker image built with environment variables
4. Image pushed to Amazon ECR
5. ECS service updated with new image

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow Vue.js style guide
- Use ESLint for code linting
- Write meaningful commit messages
- Add comments for complex logic

## 📝 License

This project is proprietary and confidential.

