-- Run manually if not using drizzle-kit push
CREATE TABLE IF NOT EXISTS `shiny_methods` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(64) NOT NULL,
  `emoji` varchar(10),
  `iconUrl` text,
  `isEnabled` boolean NOT NULL DEFAULT true,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `shiny_methods_id` PRIMARY KEY(`id`),
  CONSTRAINT `shiny_methods_code_unique` UNIQUE(`code`),
  KEY `method_code_idx` (`code`)
);

CREATE TABLE IF NOT EXISTS `dex_research_targets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `pokemonId` int NOT NULL,
  `pokemonName` varchar(255),
  `shinyTypeId` int,
  `shinyMethodId` int,
  `notes` text,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `dex_research_targets_id` PRIMARY KEY(`id`)
);

ALTER TABLE `shinies` ADD COLUMN `shinyMethodId` int;
ALTER TABLE `site_settings` ADD COLUMN `recruitmentPerks` text;
