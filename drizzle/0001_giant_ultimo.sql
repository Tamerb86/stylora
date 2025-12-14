CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`templateType` enum('reminder_24h','reminder_2h','booking_confirmation','booking_cancellation','booking_update') NOT NULL,
	`subject` varchar(500) NOT NULL,
	`bodyHtml` text NOT NULL,
	`logoUrl` text,
	`primaryColor` varchar(7) DEFAULT '#8b5cf6',
	`secondaryColor` varchar(7) DEFAULT '#6366f1',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_type_idx` UNIQUE(`tenantId`,`templateType`)
);
