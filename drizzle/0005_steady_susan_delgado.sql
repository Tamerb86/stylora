CREATE TABLE `dataImports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`importType` enum('customers','services','products','sql_restore') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`status` enum('in_progress','completed','failed') NOT NULL DEFAULT 'in_progress',
	`recordsTotal` int DEFAULT 0,
	`recordsImported` int DEFAULT 0,
	`recordsFailed` int DEFAULT 0,
	`errorMessage` text,
	`errorDetails` json,
	`importedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `dataImports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `dataImports` (`tenantId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `dataImports` (`status`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `dataImports` (`createdAt`);