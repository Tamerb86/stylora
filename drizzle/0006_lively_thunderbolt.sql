ALTER TABLE `paymentProviders` MODIFY COLUMN `accessToken` text NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentProviders` MODIFY COLUMN `refreshToken` text NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentProviders` MODIFY COLUMN `tokenExpiresAt` datetime(3) NOT NULL;