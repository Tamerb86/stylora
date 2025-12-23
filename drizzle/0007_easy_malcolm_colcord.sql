ALTER TABLE `paymentSettings` ADD `stripeConnectedAccountId` varchar(255);--> statement-breakpoint
ALTER TABLE `paymentSettings` ADD `stripeAccessToken` text;--> statement-breakpoint
ALTER TABLE `paymentSettings` ADD `stripeRefreshToken` text;--> statement-breakpoint
ALTER TABLE `paymentSettings` ADD `stripeAccountStatus` enum('connected','disconnected','pending') DEFAULT 'disconnected';--> statement-breakpoint
ALTER TABLE `paymentSettings` ADD `stripeConnectedAt` timestamp;