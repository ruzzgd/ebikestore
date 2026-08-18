import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import config from './config/index.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { csrfProtection } from './middleware/csrfMiddleware.js';
import { NotFoundError } from './utils/errors.js';

const app = express();

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images to be loaded cross-origin if MinIO is used, though MinIO is on a different port. We'll leave it loose enough for API.
}));
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrfProtection);

// API Base Route Mounting
app.use('/api/v1', routes);

// Handle 404 for unhandled API routes
app.use((req, res, next) => {
  next(new NotFoundError(`API endpoint route '${req.originalUrl}' not found`));
});

// Centralized Application Error Handling Middleware
app.use(errorHandler);

export default app;
