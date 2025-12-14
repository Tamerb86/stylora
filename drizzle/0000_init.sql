CREATE TABLE `appointmentServices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointmentId` int NOT NULL,
	`serviceId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	CONSTRAINT `appointmentServices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`employeeId` int NOT NULL,
	`appointmentDate` date NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`status` enum('pending','confirmed','completed','canceled','no_show') DEFAULT 'pending',
	`cancellationReason` text,
	`canceledBy` enum('customer','staff','system'),
	`canceledAt` timestamp,
	`isLateCancellation` boolean DEFAULT false,
	`notes` text,
	`recurrenceRuleId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`beforeValue` json,
	`afterValue` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bulkCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('sms','email') NOT NULL,
	`templateId` int,
	`subject` varchar(255),
	`content` text NOT NULL,
	`status` enum('draft','scheduled','sending','completed','failed') DEFAULT 'draft',
	`recipientCount` int DEFAULT 0,
	`sentCount` int DEFAULT 0,
	`deliveredCount` int DEFAULT 0,
	`failedCount` int DEFAULT 0,
	`openedCount` int DEFAULT 0,
	`clickedCount` int DEFAULT 0,
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulkCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businessHours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`dayOfWeek` int NOT NULL,
	`isOpen` boolean NOT NULL DEFAULT true,
	`openTime` time,
	`closeTime` time,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessHours_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_tenant_day` UNIQUE(`tenantId`,`dayOfWeek`)
);
--> statement-breakpoint
CREATE TABLE `campaignRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`customerId` int NOT NULL,
	`recipientContact` varchar(320) NOT NULL,
	`status` enum('pending','sent','delivered','failed','opened','clicked') DEFAULT 'pending',
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignRecipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communicationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`smsProvider` varchar(50),
	`smsApiKey` text,
	`smsApiSecret` text,
	`smsSenderName` varchar(11),
	`smsEnabled` boolean NOT NULL DEFAULT false,
	`smtpHost` varchar(255),
	`smtpPort` int,
	`smtpUser` varchar(255),
	`smtpPassword` text,
	`smtpSecure` boolean NOT NULL DEFAULT true,
	`emailFromAddress` varchar(320),
	`emailFromName` varchar(255),
	`emailEnabled` boolean NOT NULL DEFAULT false,
	`autoReminderEnabled` boolean NOT NULL DEFAULT false,
	`reminderHoursBefore` int DEFAULT 24,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communicationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `communicationSettings_tenantId_unique` UNIQUE(`tenantId`)
);
--> statement-breakpoint
CREATE TABLE `communicationTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`type` enum('sms','email') NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(255),
	`content` text NOT NULL,
	`variables` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communicationTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contactMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`subject` varchar(500),
	`message` text NOT NULL,
	`status` enum('new','read','replied','archived') NOT NULL DEFAULT 'new',
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	`repliedAt` timestamp,
	CONSTRAINT `contactMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100),
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`dateOfBirth` date,
	`address` text,
	`notes` text,
	`marketingSmsConsent` boolean DEFAULT false,
	`marketingEmailConsent` boolean DEFAULT false,
	`consentTimestamp` timestamp,
	`consentIp` varchar(45),
	`preferredEmployeeId` int,
	`totalVisits` int DEFAULT 0,
	`totalRevenue` decimal(10,2) DEFAULT '0.00',
	`lastVisitDate` date,
	`noShowCount` int DEFAULT 0,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `databaseBackups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`backupType` enum('full','manual') NOT NULL DEFAULT 'full',
	`fileKey` varchar(512) NOT NULL,
	`fileSize` bigint,
	`status` enum('in_progress','completed','failed') NOT NULL DEFAULT 'in_progress',
	`errorMessage` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `databaseBackups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailVerifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailVerifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailVerifications_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `employeeLeaves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`employeeId` int NOT NULL,
	`leaveType` enum('annual','sick','emergency','unpaid') NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reason` text,
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employeeLeaves_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employeeSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`breakStart` time,
	`breakEnd` time,
	`isActive` boolean DEFAULT true,
	CONSTRAINT `employeeSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(255) NOT NULL,
	`category` enum('rent','utilities','supplies','salaries','marketing','maintenance','insurance','taxes','other') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` text,
	`expense_date` date NOT NULL,
	`receipt_url` text,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fikenCustomerMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`fikenContactId` int NOT NULL,
	`fikenContactPersonId` int,
	`status` enum('synced','failed','pending') NOT NULL DEFAULT 'synced',
	`errorMessage` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fikenCustomerMapping_id` PRIMARY KEY(`id`),
	CONSTRAINT `fiken_customer_tenant_customer_idx` UNIQUE(`tenantId`,`customerId`)
);
--> statement-breakpoint
CREATE TABLE `fikenInvoiceMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`orderId` int NOT NULL,
	`fikenInvoiceId` int NOT NULL,
	`fikenInvoiceNumber` varchar(50),
	`fikenDraftId` int,
	`status` enum('draft','sent','paid','failed') NOT NULL DEFAULT 'draft',
	`errorMessage` text,
	`syncedAt` timestamp,
	`sentAt` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fikenInvoiceMapping_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fikenProductMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`productId` int,
	`serviceId` int,
	`fikenProductId` int NOT NULL,
	`status` enum('synced','failed','pending') NOT NULL DEFAULT 'synced',
	`errorMessage` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fikenProductMapping_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fikenSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`clientId` varchar(255),
	`clientSecret` varchar(255),
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`companySlug` varchar(100),
	`companyName` varchar(255),
	`organizationNumber` varchar(20),
	`syncFrequency` enum('manual','daily','weekly','monthly') NOT NULL DEFAULT 'manual',
	`autoSyncCustomers` boolean NOT NULL DEFAULT true,
	`autoSyncInvoices` boolean NOT NULL DEFAULT true,
	`autoSyncPayments` boolean NOT NULL DEFAULT true,
	`autoSyncProducts` boolean NOT NULL DEFAULT false,
	`lastSyncAt` timestamp,
	`lastSyncStatus` enum('success','failed','partial'),
	`lastSyncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fikenSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `fikenSettings_tenantId_unique` UNIQUE(`tenantId`)
);
--> statement-breakpoint
CREATE TABLE `fikenSyncLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`operation` enum('customer_sync','invoice_sync','payment_sync','product_sync','full_sync','test_connection','oauth_refresh') NOT NULL,
	`status` enum('success','failed','partial') NOT NULL,
	`itemsProcessed` int DEFAULT 0,
	`itemsFailed` int DEFAULT 0,
	`errorMessage` text,
	`details` json,
	`duration` int,
	`triggeredBy` enum('scheduled','manual','api','auto') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fikenSyncLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyaltyPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`currentPoints` int NOT NULL DEFAULT 0,
	`lifetimePoints` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyaltyPoints_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_loyalty_unique_idx` UNIQUE(`tenantId`,`customerId`)
);
--> statement-breakpoint
CREATE TABLE `loyaltyRedemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`rewardId` int NOT NULL,
	`transactionId` int,
	`code` varchar(20) NOT NULL,
	`status` enum('active','used','expired') DEFAULT 'active',
	`usedAt` timestamp,
	`usedInAppointment` int,
	`usedInOrder` int,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loyaltyRedemptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `loyaltyRedemptions_code_unique` UNIQUE(`code`),
	CONSTRAINT `redemption_code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `loyaltyRewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`pointsCost` int NOT NULL,
	`discountType` enum('percentage','fixed_amount') NOT NULL,
	`discountValue` decimal(10,2) NOT NULL,
	`isActive` boolean DEFAULT true,
	`validityDays` int DEFAULT 30,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyaltyRewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyaltyTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`type` enum('earn','redeem','adjustment','expire') NOT NULL,
	`points` int NOT NULL,
	`reason` varchar(500),
	`referenceType` varchar(50),
	`referenceId` int,
	`performedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loyaltyTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`recipientType` enum('customer','employee','owner') NOT NULL,
	`recipientId` int NOT NULL,
	`notificationType` enum('sms','email') NOT NULL,
	`template` varchar(100),
	`recipientContact` varchar(320) NOT NULL,
	`subject` varchar(255),
	`content` text NOT NULL,
	`status` enum('pending','sent','delivered','failed') DEFAULT 'pending',
	`attempts` int DEFAULT 0,
	`maxAttempts` int DEFAULT 3,
	`errorMessage` text,
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`itemType` enum('service','product') NOT NULL,
	`itemId` int NOT NULL,
	`itemName` varchar(255) NOT NULL DEFAULT 'Unknown Item',
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2) NOT NULL,
	`vatRate` decimal(5,2) NOT NULL DEFAULT '25.00',
	`total` decimal(10,2) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int,
	`employeeId` int,
	`appointmentId` int,
	`orderDate` date NOT NULL,
	`orderTime` time NOT NULL,
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
	`vatAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL DEFAULT '0.00',
	`status` enum('pending','completed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentProviders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`providerType` enum('stripe_terminal','vipps','nets','manual_card','cash','generic') NOT NULL,
	`providerName` varchar(100) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`isDefault` boolean NOT NULL DEFAULT false,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentProviders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentSplits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`orderId` int NOT NULL,
	`paymentId` int,
	`amount` decimal(10,2) NOT NULL,
	`paymentMethod` enum('card','cash','vipps','stripe') NOT NULL,
	`paymentProviderId` int,
	`cardLast4` varchar(4),
	`cardBrand` varchar(50),
	`transactionId` varchar(255),
	`status` enum('completed','failed') NOT NULL DEFAULT 'completed',
	`processedBy` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentSplits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`orderId` int,
	`appointmentId` int,
	`paymentMethod` enum('cash','card','vipps','stripe','split') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'NOK',
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentGateway` varchar(50),
	`gatewayPaymentId` varchar(255),
	`gatewaySessionId` varchar(255),
	`gatewayMetadata` json,
	`cardLast4` varchar(4),
	`cardBrand` varchar(50),
	`paidAt` timestamp,
	`refundedAt` timestamp,
	`refundAmount` decimal(10,2),
	`refundReason` text,
	`notes` text,
	`errorMessage` text,
	`processedAt` timestamp,
	`processedBy` int,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`displayOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`categoryId` int,
	`sku` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`costPrice` decimal(10,2) NOT NULL,
	`retailPrice` decimal(10,2) NOT NULL,
	`vatRate` decimal(5,2) DEFAULT '25.00',
	`barcode` varchar(50),
	`supplier` varchar(255),
	`stockQuantity` int DEFAULT 0,
	`reorderPoint` int DEFAULT 10,
	`reorderQuantity` int DEFAULT 20,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `sku_idx` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `recurrenceRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`employeeId` int NOT NULL,
	`serviceId` int NOT NULL,
	`frequency` enum('weekly','biweekly','monthly') NOT NULL,
	`preferredDayOfWeek` int,
	`preferredTime` time,
	`startDate` date NOT NULL,
	`endDate` date,
	`maxOccurrences` int,
	`currentOccurrences` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recurrenceRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`paymentId` int NOT NULL,
	`orderId` int,
	`appointmentId` int,
	`amount` decimal(10,2) NOT NULL,
	`reason` text NOT NULL,
	`refundMethod` enum('stripe','vipps','manual') NOT NULL,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`gatewayRefundId` varchar(255),
	`errorMessage` text,
	`processedBy` int NOT NULL,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salonHolidays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`date` date NOT NULL,
	`isRecurring` boolean DEFAULT false,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `salonHolidays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salonSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`bookingBranding` json DEFAULT ('{"logoUrl":null,"primaryColor":"#2563eb","accentColor":"#ea580c","welcomeTitle":"Velkommen!","welcomeSubtitle":"Bestill din time på nett.","showStaffSection":true,"showSummaryCard":true}'),
	`printSettings` json DEFAULT ('{"fontSize":"medium","showLogo":true,"customFooterText":"Takk for besøket! Velkommen tilbake!","autoPrintReceipt":false,"autoOpenCashDrawer":false}'),
	`receiptLogoUrl` text,
	`autoClockOutTime` time DEFAULT '17:00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salonSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `salonSettings_tenantId_unique` UNIQUE(`tenantId`)
);
--> statement-breakpoint
CREATE TABLE `serviceCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`displayOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `serviceCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`categoryId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`durationMinutes` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`vatRate` decimal(5,2) DEFAULT '25.00',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_tenant_setting` UNIQUE(`tenantId`,`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`displayNameNo` varchar(100) NOT NULL,
	`priceMonthly` decimal(10,2) NOT NULL,
	`maxEmployees` int,
	`maxLocations` int,
	`smsQuota` int,
	`features` json,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptionPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenantSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`planId` int NOT NULL,
	`status` enum('active','past_due','canceled','paused') DEFAULT 'active',
	`currentPeriodStart` date NOT NULL,
	`currentPeriodEnd` date NOT NULL,
	`stripeSubscriptionId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenantSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`subdomain` varchar(63) NOT NULL,
	`orgNumber` varchar(9),
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`logoUrl` text,
	`primaryColor` varchar(7),
	`timezone` varchar(50) DEFAULT 'Europe/Oslo',
	`currency` varchar(3) DEFAULT 'NOK',
	`vatRate` decimal(5,2) DEFAULT '25.00',
	`status` enum('trial','active','suspended','canceled') DEFAULT 'trial',
	`trialEndsAt` timestamp,
	`emailVerified` boolean NOT NULL DEFAULT false,
	`emailVerifiedAt` timestamp,
	`onboardingCompleted` boolean NOT NULL DEFAULT false,
	`onboardingStep` enum('welcome','service','employee','hours','complete') DEFAULT 'welcome',
	`onboardingCompletedAt` timestamp,
	`wizardDraftData` json,
	`cancellationWindowHours` int DEFAULT 24,
	`noShowThresholdForPrepayment` int DEFAULT 2,
	`requirePrepayment` boolean NOT NULL DEFAULT false,
	`smsPhoneNumber` varchar(20),
	`smsProvider` enum('mock','pswincom','linkmobility','twilio'),
	`smsApiKey` varchar(255),
	`smsApiSecret` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_subdomain_unique` UNIQUE(`subdomain`)
);
--> statement-breakpoint
CREATE TABLE `timesheets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`employeeId` int NOT NULL,
	`clockIn` timestamp NOT NULL,
	`clockOut` timestamp,
	`totalHours` decimal(5,2),
	`workDate` date NOT NULL,
	`notes` text,
	`editReason` text,
	`editedBy` int,
	`editedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timesheets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unimicroCustomerMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`unimicroCustomerId` int NOT NULL,
	`status` enum('synced','failed') NOT NULL DEFAULT 'synced',
	`errorMessage` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unimicroCustomerMapping_id` PRIMARY KEY(`id`),
	CONSTRAINT `unimicro_customer_tenant_customer_idx` UNIQUE(`tenantId`,`customerId`)
);
--> statement-breakpoint
CREATE TABLE `unimicroInvoiceMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`orderId` int NOT NULL,
	`unimicroInvoiceId` int NOT NULL,
	`unimicroInvoiceNumber` varchar(50) NOT NULL,
	`status` enum('pending','synced','failed','paid') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`syncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unimicroInvoiceMapping_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unimicroSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`clientId` text,
	`clientSecret` text,
	`certificatePath` text,
	`companyId` int,
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`syncFrequency` enum('daily','weekly','monthly','manual','custom') NOT NULL DEFAULT 'daily',
	`syncDayOfWeek` int,
	`syncDayOfMonth` int,
	`syncHour` int NOT NULL DEFAULT 23,
	`syncMinute` int NOT NULL DEFAULT 0,
	`lastSyncAt` timestamp,
	`nextSyncAt` timestamp,
	`lastSyncStatus` enum('success','failed','partial'),
	`lastSyncErrors` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unimicroSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `unimicroSettings_tenantId_unique` UNIQUE(`tenantId`)
);
--> statement-breakpoint
CREATE TABLE `unimicroSyncLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`operation` enum('invoice_sync','customer_sync','payment_sync','full_sync','test_connection') NOT NULL,
	`status` enum('success','failed','partial') NOT NULL,
	`itemsProcessed` int DEFAULT 0,
	`itemsFailed` int DEFAULT 0,
	`errorMessage` text,
	`details` json,
	`duration` int,
	`triggeredBy` enum('scheduled','manual','api') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unimicroSyncLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`openId` varchar(64) NOT NULL,
	`email` varchar(320),
	`name` text,
	`phone` varchar(20),
	`loginMethod` varchar(64),
	`role` enum('owner','admin','employee') NOT NULL,
	`pin` varchar(6),
	`isActive` boolean DEFAULT true,
	`deactivatedAt` timestamp,
	`commissionType` enum('percentage','fixed','tiered') DEFAULT 'percentage',
	`commissionRate` decimal(5,2),
	`annualLeaveTotal` int DEFAULT 25,
	`annualLeaveUsed` int DEFAULT 0,
	`sickLeaveUsed` int DEFAULT 0,
	`uiMode` enum('simple','advanced') DEFAULT 'simple',
	`sidebarOpen` boolean DEFAULT false,
	`onboardingCompleted` boolean DEFAULT false,
	`onboardingStep` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `walkInQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerName` varchar(200) NOT NULL,
	`customerPhone` varchar(20),
	`serviceId` int NOT NULL,
	`employeeId` int,
	`estimatedWaitMinutes` int DEFAULT 0,
	`status` enum('waiting','in_service','completed','canceled') NOT NULL DEFAULT 'waiting',
	`priority` enum('normal','urgent','vip') NOT NULL DEFAULT 'normal',
	`priorityReason` text,
	`position` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`notes` text,
	CONSTRAINT `walkInQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `appointment_idx` ON `appointmentServices` (`appointmentId`);--> statement-breakpoint
CREATE INDEX `tenant_appointments_idx` ON `appointments` (`tenantId`,`appointmentDate`,`employeeId`);--> statement-breakpoint
CREATE INDEX `customer_appointments_idx` ON `appointments` (`customerId`,`appointmentDate`);--> statement-breakpoint
CREATE INDEX `employee_schedule_idx` ON `appointments` (`employeeId`,`appointmentDate`,`startTime`);--> statement-breakpoint
CREATE INDEX `tenant_logs_idx` ON `auditLogs` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `entity_idx` ON `auditLogs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `tenant_campaigns_idx` ON `bulkCampaigns` (`tenantId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tenant_day_idx` ON `businessHours` (`tenantId`,`dayOfWeek`);--> statement-breakpoint
CREATE INDEX `campaign_recipients_idx` ON `campaignRecipients` (`campaignId`,`status`);--> statement-breakpoint
CREATE INDEX `customer_recipients_idx` ON `campaignRecipients` (`customerId`);--> statement-breakpoint
CREATE INDEX `tenant_templates_idx` ON `communicationTemplates` (`tenantId`,`type`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `contactMessages` (`tenantId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `contactMessages` (`status`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `contactMessages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `tenant_customers_idx` ON `customers` (`tenantId`,`deletedAt`);--> statement-breakpoint
CREATE INDEX `phone_idx` ON `customers` (`tenantId`,`phone`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `customers` (`tenantId`,`email`);--> statement-breakpoint
CREATE INDEX `tenant_backups_idx` ON `databaseBackups` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tenant_email_idx` ON `emailVerifications` (`tenantId`,`email`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `emailVerifications` (`token`);--> statement-breakpoint
CREATE INDEX `tenant_leaves_idx` ON `employeeLeaves` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `employee_leaves_idx` ON `employeeLeaves` (`employeeId`,`startDate`);--> statement-breakpoint
CREATE INDEX `employee_schedule_idx` ON `employeeSchedules` (`employeeId`,`dayOfWeek`);--> statement-breakpoint
CREATE INDEX `expenses_tenant_idx` ON `expenses` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `expenses_date_idx` ON `expenses` (`expense_date`);--> statement-breakpoint
CREATE INDEX `expenses_category_idx` ON `expenses` (`category`);--> statement-breakpoint
CREATE INDEX `fiken_contact_id_idx` ON `fikenCustomerMapping` (`fikenContactId`);--> statement-breakpoint
CREATE INDEX `fiken_customer_status_idx` ON `fikenCustomerMapping` (`status`);--> statement-breakpoint
CREATE INDEX `fiken_invoice_tenant_order_idx` ON `fikenInvoiceMapping` (`tenantId`,`orderId`);--> statement-breakpoint
CREATE INDEX `fiken_invoice_id_idx` ON `fikenInvoiceMapping` (`fikenInvoiceId`);--> statement-breakpoint
CREATE INDEX `fiken_invoice_status_idx` ON `fikenInvoiceMapping` (`status`);--> statement-breakpoint
CREATE INDEX `fiken_product_tenant_product_idx` ON `fikenProductMapping` (`tenantId`,`productId`);--> statement-breakpoint
CREATE INDEX `fiken_product_tenant_service_idx` ON `fikenProductMapping` (`tenantId`,`serviceId`);--> statement-breakpoint
CREATE INDEX `fiken_product_id_idx` ON `fikenProductMapping` (`fikenProductId`);--> statement-breakpoint
CREATE INDEX `fiken_settings_tenant_idx` ON `fikenSettings` (`tenantId`);--> statement-breakpoint
CREATE INDEX `fiken_log_tenant_operation_idx` ON `fikenSyncLog` (`tenantId`,`operation`,`createdAt`);--> statement-breakpoint
CREATE INDEX `fiken_log_status_idx` ON `fikenSyncLog` (`status`);--> statement-breakpoint
CREATE INDEX `fiken_log_created_idx` ON `fikenSyncLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `tenant_customer_loyalty_idx` ON `loyaltyPoints` (`tenantId`,`customerId`);--> statement-breakpoint
CREATE INDEX `tenant_customer_redemptions_idx` ON `loyaltyRedemptions` (`tenantId`,`customerId`);--> statement-breakpoint
CREATE INDEX `redemptions_status_idx` ON `loyaltyRedemptions` (`status`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `tenant_rewards_idx` ON `loyaltyRewards` (`tenantId`,`isActive`);--> statement-breakpoint
CREATE INDEX `tenant_customer_transactions_idx` ON `loyaltyTransactions` (`tenantId`,`customerId`);--> statement-breakpoint
CREATE INDEX `transactions_created_idx` ON `loyaltyTransactions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `tenant_notifications_idx` ON `notifications` (`tenantId`,`status`,`scheduledAt`);--> statement-breakpoint
CREATE INDEX `pending_idx` ON `notifications` (`status`,`scheduledAt`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `orderItems` (`orderId`);--> statement-breakpoint
CREATE INDEX `tenant_orders_idx` ON `orders` (`tenantId`,`orderDate`);--> statement-breakpoint
CREATE INDEX `employee_sales_idx` ON `orders` (`employeeId`,`orderDate`);--> statement-breakpoint
CREATE INDEX `tenant_providers_idx` ON `paymentProviders` (`tenantId`,`isActive`);--> statement-breakpoint
CREATE INDEX `tenant_splits_idx` ON `paymentSplits` (`tenantId`);--> statement-breakpoint
CREATE INDEX `order_splits_idx` ON `paymentSplits` (`orderId`);--> statement-breakpoint
CREATE INDEX `payment_idx` ON `paymentSplits` (`paymentId`);--> statement-breakpoint
CREATE INDEX `tenant_payments_idx` ON `payments` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `gateway_payment_idx` ON `payments` (`gatewayPaymentId`);--> statement-breakpoint
CREATE INDEX `appointment_payment_idx` ON `payments` (`appointmentId`);--> statement-breakpoint
CREATE INDEX `order_payment_idx` ON `payments` (`orderId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `tenant_categories_idx` ON `productCategories` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_products_idx` ON `products` (`tenantId`,`isActive`);--> statement-breakpoint
CREATE INDEX `low_stock_idx` ON `products` (`tenantId`,`stockQuantity`);--> statement-breakpoint
CREATE INDEX `tenant_recurrences_idx` ON `recurrenceRules` (`tenantId`,`isActive`);--> statement-breakpoint
CREATE INDEX `tenant_refunds_idx` ON `refunds` (`tenantId`);--> statement-breakpoint
CREATE INDEX `payment_idx` ON `refunds` (`paymentId`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `refunds` (`orderId`);--> statement-breakpoint
CREATE INDEX `appointment_idx` ON `refunds` (`appointmentId`);--> statement-breakpoint
CREATE INDEX `tenant_holidays_idx` ON `salonHolidays` (`tenantId`,`date`);--> statement-breakpoint
CREATE INDEX `salon_settings_tenant_idx` ON `salonSettings` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_categories_idx` ON `serviceCategories` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_services_idx` ON `services` (`tenantId`,`isActive`);--> statement-breakpoint
CREATE INDEX `tenant_subscription_idx` ON `tenantSubscriptions` (`tenantId`);--> statement-breakpoint
CREATE INDEX `stripe_subscription_idx` ON `tenantSubscriptions` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE INDEX `subdomain_idx` ON `tenants` (`subdomain`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `tenants` (`status`);--> statement-breakpoint
CREATE INDEX `tenant_employee_timesheet_idx` ON `timesheets` (`tenantId`,`employeeId`,`workDate`);--> statement-breakpoint
CREATE INDEX `timesheet_work_date_idx` ON `timesheets` (`workDate`);--> statement-breakpoint
CREATE INDEX `unimicro_customer_id_idx` ON `unimicroCustomerMapping` (`unimicroCustomerId`);--> statement-breakpoint
CREATE INDEX `unimicro_invoice_tenant_order_idx` ON `unimicroInvoiceMapping` (`tenantId`,`orderId`);--> statement-breakpoint
CREATE INDEX `unimicro_invoice_id_idx` ON `unimicroInvoiceMapping` (`unimicroInvoiceId`);--> statement-breakpoint
CREATE INDEX `unimicro_invoice_status_idx` ON `unimicroInvoiceMapping` (`status`);--> statement-breakpoint
CREATE INDEX `unimicro_settings_tenant_idx` ON `unimicroSettings` (`tenantId`);--> statement-breakpoint
CREATE INDEX `unimicro_log_tenant_operation_idx` ON `unimicroSyncLog` (`tenantId`,`operation`,`createdAt`);--> statement-breakpoint
CREATE INDEX `unimicro_log_status_idx` ON `unimicroSyncLog` (`status`);--> statement-breakpoint
CREATE INDEX `unimicro_log_created_idx` ON `unimicroSyncLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `tenant_users_idx` ON `users` (`tenantId`,`isActive`);--> statement-breakpoint
CREATE INDEX `open_id_idx` ON `users` (`openId`);--> statement-breakpoint
CREATE INDEX `tenant_queue_idx` ON `walkInQueue` (`tenantId`,`status`,`position`);--> statement-breakpoint
CREATE INDEX `queue_status_idx` ON `walkInQueue` (`status`);