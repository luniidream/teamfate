-- Supabase / Postgres schema for Team Fate Tracker
-- Paste into Supabase SQL editor and run.

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('member', 'staff', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS users (
  id bigserial PRIMARY KEY,
  "openId" varchar(64) NOT NULL UNIQUE,
  name text,
  email varchar(320),
  "loginMethod" varchar(64),
  role user_role NOT NULL DEFAULT 'user',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "lastSignedIn" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id bigserial PRIMARY KEY,
  username varchar(64) NOT NULL UNIQUE,
  "displayName" varchar(255) NOT NULL,
  "avatarUrl" text,
  "discordId" varchar(64),
  role member_role NOT NULL DEFAULT 'member',
  "joinedAt" timestamp NOT NULL DEFAULT now(),
  "shinyCount" int NOT NULL DEFAULT 0,
  "shinyPoints" int NOT NULL DEFAULT 0,
  "passwordHash" varchar(255),
  "passwordSalt" varchar(255),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS username_idx ON members(username);

CREATE TABLE IF NOT EXISTS member_sessions (
  token varchar(255) PRIMARY KEY,
  "memberId" bigint NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memberId_idx ON member_sessions("memberId");
CREATE INDEX IF NOT EXISTS expiresAt_idx ON member_sessions("expiresAt");

CREATE TABLE IF NOT EXISTS shiny_types (
  id bigserial PRIMARY KEY,
  name varchar(255) NOT NULL,
  code varchar(64) NOT NULL UNIQUE,
  emoji varchar(10),
  "iconUrl" text,
  "isEnabled" boolean NOT NULL DEFAULT true,
  "sortOrder" int NOT NULL DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS code_idx ON shiny_types(code);

CREATE TABLE IF NOT EXISTS shiny_methods (
  id bigserial PRIMARY KEY,
  name varchar(255) NOT NULL,
  code varchar(64) NOT NULL UNIQUE,
  emoji varchar(10),
  "iconUrl" text,
  "isEnabled" boolean NOT NULL DEFAULT true,
  "sortOrder" int NOT NULL DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS method_code_idx ON shiny_methods(code);

CREATE TABLE IF NOT EXISTS dex_research_targets (
  id bigserial PRIMARY KEY,
  "pokemonId" int NOT NULL,
  "pokemonName" varchar(255),
  "shinyTypeId" bigint,
  "shinyMethodId" bigint,
  notes text,
  "sortOrder" int NOT NULL DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shinies (
  id bigserial PRIMARY KEY,
  "pokemonId" int NOT NULL,
  "pokemonName" varchar(255) NOT NULL,
  "pokemonSpriteUrl" text,
  "memberId" bigint NOT NULL,
  "shinyTypeId" bigint,
  "shinyMethodId" bigint,
  "caughtAt" date,
  "catchMethod" varchar(255),
  "encounterNumber" int,
  location varchar(255),
  notes text,
  "characterName" varchar(255),
  nickname varchar(255),
  "reactionUrl" text,
  ivs varchar(255),
  nature varchar(64),
  "ballUsed" varchar(255),
  "shinyStatus" varchar(64),
  "shinyCharmUsed" boolean NOT NULL DEFAULT false,
  "isAlpha" boolean NOT NULL DEFAULT false,
  "isSecret" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shiny_memberId_idx ON shinies("memberId");
CREATE INDEX IF NOT EXISTS shiny_pokemonId_idx ON shinies("pokemonId");
CREATE INDEX IF NOT EXISTS shiny_caughtAt_idx ON shinies("caughtAt");

CREATE TABLE IF NOT EXISTS bounties (
  id bigserial PRIMARY KEY,
  title varchar(255),
  description text,
  "imageUrl" text,
  month varchar(64) NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  points int,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS month_idx ON bounties(month);

CREATE TABLE IF NOT EXISTS events (
  id bigserial PRIMARY KEY,
  title varchar(255) NOT NULL,
  description text,
  "imageUrl" text,
  "externalUrl" text,
  "eventDate" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id bigserial PRIMARY KEY,
  "logoUrl" text,
  "navHomeLabel" varchar(255) NOT NULL DEFAULT 'Home',
  "navTeamInfoLabel" varchar(255) NOT NULL DEFAULT 'Team Info',
  "navShowcaseLabel" varchar(255) NOT NULL DEFAULT 'Shiny Showcase',
  "navDexLabel" varchar(255) NOT NULL DEFAULT 'Shiny Dex',
  "navRecruitmentLabel" varchar(255) NOT NULL DEFAULT 'Recruitment',
  "teamInfoTitle" varchar(255) NOT NULL DEFAULT 'Team Fate',
  "teamInfoDescription" text,
  "teamInfoButtonLabel" varchar(255) NOT NULL DEFAULT 'Join Us',
  "recruitmentTitle" varchar(255) NOT NULL DEFAULT 'Join Team Fate',
  "recruitmentRequirements" text,
  "recruitmentPerks" text,
  "recruitmentDiscordLabel" varchar(255) NOT NULL DEFAULT 'Join Discord',
  "recruitmentDiscordUrl" text,
  "recruitmentOpen" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

