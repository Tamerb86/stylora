CREATE TABLE `appointmentHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`appointmentId` int NOT NULL,
	`changeType` enum('created','rescheduled','status_changed','service_changed','employee_changed','canceled','notes_updated') NOT NULL,
	`fieldName` varchar(100),
	`oldValue` text,
	`newValue` text,
	`changedBy` enum('customer','staff','system') NOT NULL,
	`changedByUserId` int,
	`changedByEmail` varchar(320),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appointmentHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `appointment_idx` ON `appointmentHistory` (`appointmentId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `appointmentHistory` (`tenantId`);--> statement-breakpoint
CREATE INDEX `change_type_idx` ON `appointmentHistory` (`changeType`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `appointmentHistory` (`createdAt`);