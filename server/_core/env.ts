export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? "587"),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFromEmail: process.env.SMTP_FROM_EMAIL ?? "no-reply@barbertime.app",
  // Vipps payment gateway
  vippsClientId: process.env.VIPPS_CLIENT_ID ?? "",
  vippsClientSecret: process.env.VIPPS_CLIENT_SECRET ?? "",
  vippsSubscriptionKey: process.env.VIPPS_SUBSCRIPTION_KEY ?? "",
  vippsMerchantSerialNumber: process.env.VIPPS_MERCHANT_SERIAL_NUMBER ?? "",
  vippsApiUrl: process.env.VIPPS_API_URL ?? "https://apitest.vipps.no", // Use https://api.vipps.no for production
  // AWS SES for email
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  awsRegion: process.env.AWS_REGION ?? "eu-north-1",
  awsSesFromEmail: process.env.AWS_SES_FROM_EMAIL ?? "",
};
