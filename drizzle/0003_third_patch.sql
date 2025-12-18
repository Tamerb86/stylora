CREATE TABLE `paymentSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`vippsEnabled` boolean NOT NULL DEFAULT false,
	`cardEnabled` boolean NOT NULL DEFAULT false,
	`cashEnabled` boolean NOT NULL DEFAULT true,
	`payAtSalonEnabled` boolean NOT NULL DEFAULT true,
	`vippsClientId` text,
	`vippsClientSecret` text,
	`vippsSubscriptionKey` text,
	`vippsMerchantSerialNumber` varchar(20),
	`vippsTestMode` boolean NOT NULL DEFAULT true,
	`stripePublishableKey` text,
	`stripeSecretKey` text,
	`stripeTestMode` boolean NOT NULL DEFAULT true,
	`defaultPaymentMethod` enum('vipps','card','cash','pay_at_salon') DEFAULT 'pay_at_salon',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentSettings_tenantId_unique` UNIQUE(`tenantId`)
);
--> statement-breakpoint
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
ALTER TABLE `paymentProviders` ADD `lastErrorMessage` text;--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `paymentSettings` (`tenantId`);