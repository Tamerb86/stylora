/**
 * Automatic Token Refresh Interceptor
 * Intercepts 401 responses and automatically refreshes the access token
 */

import { toast } from "sonner";

let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

/**
 * Subscribe to token refresh completion
 */
function subscribeTokenRefresh(callback: () => void) {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers that token has been refreshed
 */
function onRefreshed() {
  refreshSubscribers.forEach(callback => callback());
  refreshSubscribers = [];
}

/**
 * Refresh the access token using the refresh token
 * Returns true if successful, false otherwise
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // Include cookies (refresh token)
    });

    if (response.ok) {
      console.log("[Auth] Access token refreshed successfully");
      return true;
    }

    // Refresh token expired or invalid
    console.warn("[Auth] Refresh token expired or invalid");
    return false;
  } catch (error) {
    console.error("[Auth] Token refresh failed:", error);
    return false;
  }
}

/**
 * Fetch with automatic token refresh on 401
 * Use this instead of regular fetch for authenticated requests
 */
export async function fetchWithRefresh(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Ensure credentials are included
  const fetchOptions: RequestInit = {
    ...options,
    credentials: "include",
  };

  // Make initial request
  let response = await fetch(url, fetchOptions);

  // If 401, try to refresh token
  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;

      const refreshed = await refreshAccessToken();

      if (refreshed) {
        isRefreshing = false;
        onRefreshed();

        // Retry original request with new token
        response = await fetch(url, fetchOptions);
      } else {
        isRefreshing = false;

        // Redirect to login
        toast.error("Din økt har utløpt. Vennligst logg inn på nytt.");

        // Wait a bit before redirecting to show toast
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);

        throw new Error("Session expired");
      }
    } else {
      // Wait for ongoing refresh to complete
      await new Promise<void>(resolve => {
        subscribeTokenRefresh(() => {
          resolve();
        });
      });

      // Retry original request after refresh completes
      response = await fetch(url, fetchOptions);
    }
  }

  return response;
}

/**
 * Setup automatic refresh for tRPC client
 * Call this in your tRPC client setup
 */
export function setupTRPCRefresh() {
  // This will be used by tRPC httpBatchLink
  return async (url: string, options: RequestInit) => {
    return fetchWithRefresh(url, options);
  };
}

/**
 * Check if user is authenticated
 * Returns user data if authenticated, null otherwise
 */
export async function checkAuth() {
  try {
    const response = await fetchWithRefresh("/api/auth/me");

    if (response.ok) {
      const data = await response.json();
      return data.user;
    }

    return null;
  } catch (error) {
    console.error("[Auth] Check auth failed:", error);
    return null;
  }
}

/**
 * Logout and revoke refresh token
 */
export async function logout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    // Redirect to login
    window.location.href = "/login";
  } catch (error) {
    console.error("[Auth] Logout failed:", error);
    // Redirect anyway
    window.location.href = "/login";
  }
}

/**
 * Logout from all devices
 */
export async function logoutAll() {
  try {
    const response = await fetchWithRefresh("/api/auth/logout-all", {
      method: "POST",
    });

    if (response.ok) {
      toast.success("Logget ut fra alle enheter");
    }

    // Redirect to login
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  } catch (error) {
    console.error("[Auth] Logout all failed:", error);
    toast.error("Kunne ikke logge ut fra alle enheter");
  }
}
