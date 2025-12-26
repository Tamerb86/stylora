CREATE TABLE `refreshTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`revoked` boolean NOT NULL DEFAULT false,
	`revokedAt` timestamp,
	`revokedReason` varchar(255),
	CONSTRAINT `refreshTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `refreshTokens_token_unique` UNIQUE(`token`),
	CONSTRAINT `token_idx` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `refreshTokens` (`userId`);--> statement-breakpoint
CREATE INDEX `tenant_id_idx` ON `refreshTokens` (`tenantId`);--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `refreshTokens` (`expiresAt`);