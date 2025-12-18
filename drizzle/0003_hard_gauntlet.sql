ALTER TABLE `paymentProviders` MODIFY COLUMN `providerType` enum('izettle','stripe_terminal','vipps','nets','manual_card','cash','generic') NOT NULL;--> statement-breakpoint
ALTER TABLE `salonSettings` MODIFY COLUMN `bookingBranding` json;--> statement-breakpoint
ALTER TABLE `salonSettings` MODIFY COLUMN `printSettings` json;--> statement-breakpoint
ALTER TABLE `paymentProviders` ADD `accessToken` text;--> statement-breakpoint
ALTER TABLE `paymentProviders` ADD `refreshToken` text;--> statement-breakpoint
ALTER TABLE `paymentProviders` ADD `tokenExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `paymentProviders` ADD `providerAccountId` varchar(255);--> statement-breakpoint
ALTER TABLE `paymentProviders` ADD `providerEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `paymentProviders` ADD `lastSyncAt` timestamp;--> statement-breakpoint
ALTER TABLE `paymentProviders` ADD `lastErrorAt` timestamp;--> statement-breakpoint
ALTER TABLE `paymentProviders` ADD `lastErrorMessage` text;