export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL - redirect to local login page
export const getLoginUrl = () => {
  return `${window.location.origin}/login`;
};
