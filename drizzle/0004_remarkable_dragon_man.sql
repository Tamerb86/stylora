ALTER TABLE `appointments` ADD `managementToken` varchar(64);--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_managementToken_unique` UNIQUE(`managementToken`);