export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // Validate required env variables
  if (!oauthPortalUrl || oauthPortalUrl === 'undefined') {
    console.error('VITE_OAUTH_PORTAL_URL is not defined');
    // Fallback to current origin + /api/auth/login
    return `${window.location.origin}/api/auth/login`;
  }
  
  if (!appId || appId === 'undefined') {
    console.error('VITE_APP_ID is not defined');
    return `${window.location.origin}/api/auth/login`;
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
