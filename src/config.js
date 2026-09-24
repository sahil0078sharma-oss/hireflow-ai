/**
 * Application Configuration
 *
 * All environment-specific values are sourced from Vite environment variables.
 * Set these in a .env file (see .env.example). Never commit secrets to source control.
 *
 * Usage:
 *   import { API_BASE_URL } from './config.js';
 */

/**
 * Base URL for the backend API.
 *
 * Phase 1 (current): Falls back to localhost — no real backend exists yet.
 * Phase 2 (AWS):     Set VITE_API_BASE_URL to your API Gateway invoke URL in .env
 *                    e.g. https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
 *
 * IMPORTANT: This variable must be prefixed with VITE_ to be exposed by Vite.
 */
export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Application name — used in page titles and labels.
 */
export const APP_NAME = 'HireFlow AI';

/**
 * Current deployment environment.
 * Vite sets import.meta.env.MODE to 'development' or 'production' automatically.
 */
export const ENV = import.meta.env?.MODE || 'development';

export const IS_DEV = ENV === 'development';
export const IS_PROD = ENV === 'production';
