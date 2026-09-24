/**
 * HTTP Client — src/lib/api.js
 *
 * A thin, reusable fetch wrapper that prepends the API base URL,
 * handles JSON serialisation/deserialisation, and normalises errors.
 *
 * Design goals:
 *  - Zero dependencies beyond native browser fetch
 *  - Single place to add auth headers when AWS Cognito is integrated
 *  - Consistent error shape for all service callers
 *  - Easy to mock in unit tests
 *
 * Usage:
 *   import api from '../lib/api.js';
 *   const drives = await api.get('/drives');
 *   const app    = await api.post('/applications', { driveId, studentId });
 *
 * When to upgrade this file:
 *  - Add Authorization header here when Cognito tokens are available
 *  - Add request retry logic here if needed
 *  - Add CloudWatch RUM / logging hook here for observability
 */

import { API_BASE_URL } from '../config.js';

// ─────────────────────────────────────────────────────────────────────────────
// Error type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ApiError is thrown for any non-2xx HTTP response.
 * Callers can distinguish network errors from API errors by checking instanceof.
 */
export class ApiError extends Error {
  /**
   * @param {string} message   - Human-readable message
   * @param {number} status    - HTTP status code
   * @param {object} [body]    - Parsed response body (if available)
   */
  constructor(message, status, body = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core request function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build request headers.
 * When Cognito is integrated, add: Authorization: `Bearer ${token}` here.
 *
 * @param {boolean} hasBody - whether the request has a JSON body
 * @returns {object} headers object
 */
function buildHeaders(hasBody) {
  const headers = {
    Accept: 'application/json',
  };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    const token = sessionStorage.getItem('hireflow_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    // sessionStorage unavailable
  }
  return headers;
}

/**
 * Core fetch wrapper.
 *
 * @param {string} path           - Path relative to API_BASE_URL (must start with /)
 * @param {'GET'|'POST'|'PUT'|'DELETE'|'PATCH'} method
 * @param {object|null} [body]    - Request body (will be JSON-serialised)
 * @returns {Promise<any>}        - Parsed JSON response body
 * @throws {ApiError}             - On non-2xx responses
 * @throws {Error}                - On network failures (no internet, CORS, timeout)
 */
async function request(path, method, body = null) {
  const url = `${API_BASE_URL}${path}`;
  const hasBody = body !== null;

  const options = {
    method,
    headers: buildHeaders(hasBody),
  };

  if (hasBody) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (networkError) {
    // Network failure — no HTTP response received at all
    throw new Error(
      `Network error — could not reach the server. Check your connection. (${networkError.message})`
    );
  }

  // Try to parse response body as JSON regardless of status code
  // so we can include server error details in ApiError.body
  let responseBody = null;
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    try {
      responseBody = await response.json();
    } catch {
      // Body was not valid JSON — leave as null
    }
  }

  if (!response.ok) {
    // Attempt to use server-provided message, fall back to HTTP status text
    const serverMessage =
      responseBody?.message ||
      responseBody?.error ||
      response.statusText ||
      'An unexpected error occurred';

    throw new ApiError(
      `API request failed [${response.status}]: ${serverMessage}`,
      response.status,
      responseBody
    );
  }

  // 204 No Content — return null instead of trying to parse an empty body
  if (response.status === 204) {
    return null;
  }

  return responseBody;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API methods
// ─────────────────────────────────────────────────────────────────────────────

const api = {
  /**
   * HTTP GET
   * @param {string} path - e.g. '/drives' or '/applications/app-001'
   * @returns {Promise<any>}
   */
  get(path) {
    return request(path, 'GET');
  },

  /**
   * HTTP POST — creates a resource
   * @param {string} path
   * @param {object} body
   * @returns {Promise<any>}
   */
  post(path, body) {
    return request(path, 'POST', body);
  },

  /**
   * HTTP PUT — replaces a resource
   * @param {string} path
   * @param {object} body
   * @returns {Promise<any>}
   */
  put(path, body) {
    return request(path, 'PUT', body);
  },

  /**
   * HTTP PATCH — partial update
   * @param {string} path
   * @param {object} body
   * @returns {Promise<any>}
   */
  patch(path, body) {
    return request(path, 'PATCH', body);
  },

  /**
   * HTTP DELETE
   * @param {string} path
   * @returns {Promise<any>}
   */
  delete(path) {
    return request(path, 'DELETE');
  },
};

export default api;
