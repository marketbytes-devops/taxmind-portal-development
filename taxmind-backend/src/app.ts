import { default as compression } from 'compression';
import cookieParser from 'cookie-parser';
import { CorsOptions, default as cors } from 'cors';
import { ErrorRequestHandler, RequestHandler, default as express } from 'express';
import httpContext from 'express-http-context';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { allowedOrigins, webhookUrls } from '@/constants';
import logger from '@/logger';
import { standardErrorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import requestLogger from '@/middleware/requestLogger';
import { responseEnhancer } from '@/middleware/responseEnhancer';
import indexRouter from '@/modules';
import { generateUniqueId } from '@/utils/generateUniqueId';

const swaggerDocument = YAML.load(path.join(__dirname, '../docs/api-doc.yml'));
const app = express();

const corsOptions = {
  origin: allowedOrigins[process.env.NODE_ENV],
  // origin: (origin, callback) => {
  //   let isRegexOrigin = false;

  //   for (const allowedOrigin of allowedOrigins[process.env.NODE_ENV]) {
  //     if (typeof allowedOrigin === 'object' && allowedOrigin.test(origin as string))
  //       isRegexOrigin = true;
  //   }

  //   if (!origin || allowedOrigins[process.env.NODE_ENV].includes(origin) || isRegexOrigin) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error('Not allowed by CORS'));
  //   }
  // },
  // origin: '*',
  methods: 'GET,POST,PUT,PATCH,DELETE',
  allowedHeaders: '*',
  // credentials: true,
} as CorsOptions;

// middleware
app.use(responseEnhancer);
app.use(express.static('public'));
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(express.static('public'));

app.use((req, res, next) => {
  if (webhookUrls.includes(req.originalUrl))
    express.raw({ type: 'application/json' })(req, res, next);
  else express.json({ limit: '10mb' })(req, res, next);
});

app.use(cookieParser());
app.use(requestLogger);
app.use(httpContext.middleware as RequestHandler);

app.use((req, res, next) => {
  const requestId = generateUniqueId('REQ').split('-').join('');
  httpContext.set('requestId', requestId);

  // Exclude docs routes from logging
  if (!req.originalUrl.includes('/docs')) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Base log data - safe for production (no PII)
    const logData: Record<string, unknown> = {
      tags: 'http',
      requestId: requestId,
      url: req.originalUrl,
      method: req.method,
    };

    // Add detailed information only in non-production environments for debugging
    if (!isProduction) {
      const filteredHeaders = { ...req.headers };
      if (filteredHeaders.authorization) filteredHeaders.authorization = '[FILTERED]';

      const filteredBody = { ...req.body };
      const keysToFilterInBody = [
        'password',
        'refreshToken',
        'newPassword',
        'confirmPassword',
        'idToken',
        'token',
      ];
      for (const key of keysToFilterInBody) {
        if (filteredBody[key]) filteredBody[key] = '[FILTERED]';
      }

      logData.additionalInfo = {
        headers: filteredHeaders,
        body: filteredBody,
        params: req.params,
        query: req.query,
        ip: req.ip,
      };
    }

    // Use logger.info for HTTP logs
    logger.info(JSON.stringify(logData));
  }

  next();
});

// if (process.env.NODE_ENV !== 'local') app.set('trust proxy', 1);
// app.use(rateLimiter);
// app.use(speedLimiter);

// routes
app.use('/api', indexRouter);

// API doc
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// error handler middleware
app.use(standardErrorHandler as ErrorRequestHandler);
app.use(notFoundHandler);

export default app;
