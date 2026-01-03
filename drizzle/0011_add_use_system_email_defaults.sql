-- Add useSystemEmailDefaults column to communicationSettings table
ALTER TABLE `communicationSettings` ADD COLUMN `useSystemEmailDefaults` BOOLEAN NOT NULL DEFAULT true;
