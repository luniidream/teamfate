import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./drizzle/schema.ts";
import { hashPassword } from "./server/auth.ts";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});
const db = drizzle(pool);

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create site settings
    const siteSettings = await db.insert(schema.siteSettings).values({
      logoUrl: "https://via.placeholder.com/200x50?text=TEAM+FATE",
      navHomeLabel: "Home",
      navTeamInfoLabel: "Team Info",
      navShowcaseLabel: "Shiny Showcase",
      navDexLabel: "Shiny Dex",
      navRecruitmentLabel: "Recruitment",
      teamInfoTitle: "Team Fate",
      teamInfoDescription: "A dedicated Pokemon shiny hunting guild focused on collecting rare shinies and sharing the joy of the hunt.",
      teamInfoButtonLabel: "Join Us",
      recruitmentTitle: "Join Team Fate",
      recruitmentRequirements: "We welcome all trainers who are passionate about shiny hunting! No experience necessary.",
      recruitmentPerks:
        "Friendly community and voice chats\nDex / showcase tooling\nBounties and team goals\nPokeMMO-focused advice",
      recruitmentDiscordLabel: "Join Our Discord",
      recruitmentDiscordUrl: "https://discord.gg/example",
      recruitmentOpen: true,
    });
    console.log("✅ Site settings created");

    // Create shiny types
    const shinyTypes = await Promise.all([
      db.insert(schema.shinyTypes).values({
        name: "Standard Shiny",
        code: "standard",
        emoji: "✨",
        sortOrder: 1,
        isEnabled: true,
      }),
      db.insert(schema.shinyTypes).values({
        name: "Secret Shiny",
        code: "secret",
        emoji: "🔐",
        sortOrder: 2,
        isEnabled: true,
      }),
      db.insert(schema.shinyTypes).values({
        name: "Alpha",
        code: "shalpha",
        emoji: "👑",
        sortOrder: 3,
        isEnabled: true,
      }),
    ]);
    console.log("✅ Shiny types created");

    // Create members
    const members = await Promise.all([
      db.insert(schema.members).values({
        username: "hunter1",
        displayName: "Shiny Hunter",
        role: "admin",
        ...hashPassword("password123"),
      }),
      db.insert(schema.members).values({
        username: "collector2",
        displayName: "Poké Collector",
        role: "staff",
        ...hashPassword("password123"),
      }),
      db.insert(schema.members).values({
        username: "trainer3",
        displayName: "Legendary Trainer",
        role: "member",
        ...hashPassword("password123"),
      }),
    ]);
    console.log("✅ Members created");

    // Create shinies
    await Promise.all([
      db.insert(schema.shinies).values({
        pokemonId: 25,
        pokemonName: "Pikachu",
        pokemonSpriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png",
        memberId: members[0].insertId,
        shinyTypeId: shinyTypes[0].insertId,
        caughtAt: new Date("2026-04-01"),
        catchMethod: "Random Encounter",
        location: "Viridian Forest",
        nickname: "Sparky",
      }),
      db.insert(schema.shinies).values({
        pokemonId: 6,
        pokemonName: "Charizard",
        pokemonSpriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/6.png",
        memberId: members[1].insertId,
        shinyTypeId: shinyTypes[1].insertId,
        caughtAt: new Date("2026-03-28"),
        catchMethod: "Breeding",
        location: "Pallet Town",
        nickname: "Inferno",
      }),
    ]);
    console.log("✅ Shinies created");

    // Create bounties
    await db.insert(schema.bounties).values({
      title: "April Shiny Hunt",
      description: "Hunt for any shiny Pokemon this month for bonus points!",
      month: "April 2026",
      points: 50,
      isActive: true,
    });
    console.log("✅ Bounties created");

    // Create event
    await db.insert(schema.events).values({
      title: "Spring Shiny Festival",
      description: "Join us for a month-long celebration of shiny hunting!",
      eventDate: new Date("2026-04-15"),
    });
    console.log("✅ Events created");

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
