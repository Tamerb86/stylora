export const COOKIE_NAME = "app_session_id";
export const REFRESH_TOKEN_COOKIE_NAME = "app_refresh_token";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365; // Legacy - not recommended for sessions
export const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30; // Recommended session duration
export const NINETY_DAYS_MS = 1000 * 60 * 60 * 24 * 90; // Refresh token duration
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
