-- Create paymentProviders table for iZettle OAuth
-- Run this in Railway MySQL Query tab

CREATE TABLE IF NOT EXISTS `paymentProviders` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenantId` varchar(36) NOT NULL,
  `providerType` enum('izettle','stripe_terminal','vipps','nets','manual_card','cash','generic') NOT NULL,
  `providerName` varchar(100) NOT NULL,
  `isActive` boolean NOT NULL DEFAULT true,
  `isDefault` boolean NOT NULL DEFAULT false,
  `accessToken` text,
  `refreshToken` text,
  `tokenExpiresAt` timestamp NULL,
  `providerAccountId` varchar(255),
  `providerEmail` varchar(320),
  `config` json,
  `lastSyncAt` timestamp NULL,
  `lastErrorAt` timestamp NULL,
  `lastErrorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `paymentProviders_id` PRIMARY KEY(`id`)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS `tenant_provider_idx` ON `paymentProviders` (`tenantId`, `providerType`);
CREATE INDEX IF NOT EXISTS `tenant_idx` ON `paymentProviders` (`tenantId`);
CREATE INDEX IF NOT EXISTS `provider_type_idx` ON `paymentProviders` (`providerType`);

-- Verify table created
SELECT COUNT(*) as table_exists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'paymentProviders';
