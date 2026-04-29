CREATE TABLE `bounties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255),
	`description` text,
	`imageUrl` text,
	`month` varchar(64) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`points` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bounties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text,
	`externalUrl` text,
	`eventDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_sessions` (
	`token` varchar(255) NOT NULL,
	`memberId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `member_sessions_token` PRIMARY KEY(`token`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`avatarUrl` text,
	`discordId` varchar(64),
	`role` enum('member','staff','admin') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`shinyCount` int NOT NULL DEFAULT 0,
	`shinyPoints` int NOT NULL DEFAULT 0,
	`passwordHash` varchar(255),
	`passwordSalt` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `members_id` PRIMARY KEY(`id`),
	CONSTRAINT `members_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `shinies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pokemonId` int NOT NULL,
	`pokemonName` varchar(255) NOT NULL,
	`pokemonSpriteUrl` text,
	`memberId` int NOT NULL,
	`shinyTypeId` int,
	`caughtAt` date,
	`catchMethod` varchar(255),
	`encounterNumber` int,
	`location` varchar(255),
	`notes` text,
	`characterName` varchar(255),
	`nickname` varchar(255),
	`reactionUrl` text,
	`ivs` varchar(255),
	`nature` varchar(64),
	`ballUsed` varchar(255),
	`shinyStatus` varchar(64),
	`shinyCharmUsed` boolean NOT NULL DEFAULT false,
	`isAlpha` boolean NOT NULL DEFAULT false,
	`isSecret` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shinies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shiny_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(64) NOT NULL,
	`emoji` varchar(10),
	`iconUrl` text,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shiny_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `shiny_types_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`logoUrl` text,
	`navHomeLabel` varchar(255) NOT NULL DEFAULT 'Home',
	`navTeamInfoLabel` varchar(255) NOT NULL DEFAULT 'Team Info',
	`navShowcaseLabel` varchar(255) NOT NULL DEFAULT 'Shiny Showcase',
	`navDexLabel` varchar(255) NOT NULL DEFAULT 'Shiny Dex',
	`navRecruitmentLabel` varchar(255) NOT NULL DEFAULT 'Recruitment',
	`teamInfoTitle` varchar(255) NOT NULL DEFAULT 'Team Fate',
	`teamInfoDescription` text,
	`teamInfoButtonLabel` varchar(255) NOT NULL DEFAULT 'Join Us',
	`recruitmentTitle` varchar(255) NOT NULL DEFAULT 'Join Team Fate',
	`recruitmentRequirements` text,
	`recruitmentDiscordLabel` varchar(255) NOT NULL DEFAULT 'Join Discord',
	`recruitmentDiscordUrl` text,
	`recruitmentOpen` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `month_idx` ON `bounties` (`month`);--> statement-breakpoint
CREATE INDEX `memberId_idx` ON `member_sessions` (`memberId`);--> statement-breakpoint
CREATE INDEX `expiresAt_idx` ON `member_sessions` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `username_idx` ON `members` (`username`);--> statement-breakpoint
CREATE INDEX `memberId_idx` ON `shinies` (`memberId`);--> statement-breakpoint
CREATE INDEX `pokemonId_idx` ON `shinies` (`pokemonId`);--> statement-breakpoint
CREATE INDEX `caughtAt_idx` ON `shinies` (`caughtAt`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `shiny_types` (`code`);