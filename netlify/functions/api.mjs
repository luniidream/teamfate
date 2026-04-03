import { getStore } from "@netlify/blobs";

const STATE_STORE = "team-fate-state";
const UPLOADS_STORE = "team-fate-uploads";
const STATE_KEY = "db";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "teamfate2024";
const FUNCTION_PREFIX = "/.netlify/functions/api";

const DEFAULT_SETTINGS = {
  navHomeLabel: "Home",
  navTeamInfoLabel: "Team Info",
  navShowcaseLabel: "Shiny Showcase",
  navShinyDexLabel: "Shiny Dex",
  navRecruitmentLabel: "Recruitment",
  teamInfoTitle: "Team Fate",
  teamInfoDescription: "Welcome to Team Fate, a shiny hunting community.",
  teamInfoButtonLabel: "Go to Recruitment",
  recruitmentTitle: "Recruitment",
  recruitmentRequirements: "Add your recruitment requirements from Admin.",
  recruitmentDiscordButtonLabel: "Team Fate Discord Server",
  recruitmentDiscordUrl: "https://discord.gg/your-server",
};

const REGION_RANGES = [
  { gen: 1, region: "Kanto", start: 1, end: 151 },
  { gen: 2, region: "Johto", start: 152, end: 251 },
  { gen: 3, region: "Hoenn", start: 252, end: 386 },
  { gen: 4, region: "Sinnoh", start: 387, end: 493 },
  { gen: 5, region: "Unova", start: 494, end: 649 },
  { gen: 6, region: "Kalos", start: 650, end: 721 },
  { gen: 7, region: "Alola", start: 722, end: 809 },
  { gen: 8, region: "Galar", start: 810, end: 905 },
  { gen: 9, region: "Paldea", start: 906, end: 1025 },
];

function createInitialState() {
  return {
    counters: {
      members: 1,
      shinyTypes: 1,
      shinies: 1,
      bounties: 1,
      events: 1,
    },
    members: [],
    shinyTypes: [],
    shinies: [],
    bounties: [],
    nextEvent: null,
    siteSettings: { ...DEFAULT_SETTINGS },
  };
}

async function loadState() {
  const store = getStore(STATE_STORE);
  const existing = await store.get(STATE_KEY, { type: "json" });
  return existing || createInitialState();
}

async function saveState(state) {
  const store = getStore(STATE_STORE);
  await store.setJSON(STATE_KEY, state);
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function noContent(headers = {}) {
  return new Response(null, {
    status: 204,
    headers,
  });
}

function error(message, status = 400, details) {
  return json(
    details ? { error: message, details: String(details) } : { error: message },
    status,
  );
}

function parseCookies(request) {
  const raw = request.headers.get("cookie") || "";
  return Object.fromEntries(
    raw
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index < 0) return [part, ""];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function isAdmin(request) {
  return parseCookies(request).admin_session === "authenticated";
}

function requireAdmin(request) {
  if (!isAdmin(request)) {
    return error("Unauthorized", 401);
  }
  return null;
}

function getRequestPath(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.startsWith(FUNCTION_PREFIX)
    ? url.pathname.slice(FUNCTION_PREFIX.length) || "/"
    : url.pathname;
  return { pathname, searchParams: url.searchParams };
}

function getWeekRange(offset = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return { start: monday, end: nextMonday };
}

function formatShinyRecord(state, shiny) {
  const member = state.members.find((item) => item.id === shiny.memberId) || null;
  const shinyType =
    state.shinyTypes.find((item) => item.id === shiny.shinyTypeId) || null;

  return {
    id: shiny.id,
    pokemonId: shiny.pokemonId,
    pokemonName: shiny.pokemonName,
    pokemonSpriteUrl: shiny.pokemonSpriteUrl,
    memberId: shiny.memberId,
    memberUsername: member?.username || "",
    memberDisplayName: member?.displayName || "",
    shinyTypeId: shiny.shinyTypeId,
    shinyTypeName: shinyType?.name || null,
    shinyTypeEmoji: shinyType?.emoji || null,
    shinyTypeIconUrl: shinyType?.iconUrl || null,
    caughtAt: shiny.caughtAt,
    catchMethod: shiny.catchMethod,
    encounterNumber: shiny.encounterNumber,
    location: shiny.location,
    notes: shiny.notes,
    isAlpha: shiny.isAlpha,
    isSecret: shiny.isSecret,
  };
}

function sortMembers(members) {
  return [...members].sort((a, b) => {
    if (b.shinyPoints !== a.shinyPoints) return b.shinyPoints - a.shinyPoints;
    return a.displayName.localeCompare(b.displayName);
  });
}

function findRegionInfo(pokemonId) {
  return (
    REGION_RANGES.find((range) => pokemonId >= range.start && pokemonId <= range.end) || {
      gen: 1,
      region: "Unknown",
    }
  );
}

function updateMemberCounts(state) {
  const counts = new Map();

  for (const shiny of state.shinies) {
    const current = counts.get(shiny.memberId) || { shinyCount: 0, shinyPoints: 0 };
    current.shinyCount += 1;
    current.shinyPoints += 1;
    counts.set(shiny.memberId, current);
  }

  state.members = state.members.map((member) => {
    const next = counts.get(member.id) || { shinyCount: 0, shinyPoints: 0 };
    return {
      ...member,
      shinyCount: next.shinyCount,
      shinyPoints: next.shinyPoints,
    };
  });
}

function nextId(state, key) {
  const id = state.counters[key];
  state.counters[key] += 1;
  return id;
}

function normalizeString(value, fallback = null) {
  if (value == null || value === "") return fallback;
  return String(value);
}

function normalizeBoolean(value, fallback = false) {
  if (value == null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return Boolean(value);
}

function parseInteger(value, fallback = null) {
  if (value == null || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function handleHealth() {
  return json({ status: "ok" });
}

async function handleAdmin(request, path) {
  if (request.method === "POST" && path === "/admin/login") {
    const body = await readJsonBody(request);
    if (body.password !== ADMIN_PASSWORD) {
      return json({ success: false, message: "Invalid password" }, 401);
    }

    return json(
      { success: true, message: "Logged in" },
      200,
      {
        "set-cookie":
          "admin_session=authenticated; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax; Secure",
      },
    );
  }

  if (request.method === "POST" && path === "/admin/logout") {
    return json(
      { success: true, message: "Logged out" },
      200,
      {
        "set-cookie":
          "admin_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure",
      },
    );
  }

  if (request.method === "GET" && path === "/admin/me") {
    return json({ authenticated: isAdmin(request) });
  }

  return null;
}

async function handleMembers(request, state, path) {
  if (request.method === "GET" && path === "/members") {
    return json(sortMembers(state.members));
  }

  if (request.method === "POST" && path === "/members") {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const body = await readJsonBody(request);
    if (!body.username || !body.displayName || !body.role) {
      return error("Missing required fields", 400);
    }

    const member = {
      id: nextId(state, "members"),
      username: String(body.username),
      displayName: String(body.displayName),
      avatarUrl: normalizeString(body.avatarUrl),
      role: String(body.role),
      joinedAt: new Date().toISOString(),
      shinyCount: 0,
      shinyPoints: 0,
    };

    state.members.push(member);
    await saveState(state);
    return json(member, 201);
  }

  const memberMatch = path.match(/^\/members\/(\d+)$/);
  if (!memberMatch) return null;

  const id = Number.parseInt(memberMatch[1], 10);
  const memberIndex = state.members.findIndex((item) => item.id === id);
  const member = memberIndex >= 0 ? state.members[memberIndex] : null;

  if (request.method === "GET") {
    return member ? json(member) : error("Not found", 404);
  }

  const authError = requireAdmin(request);
  if (authError) return authError;

  if (request.method === "PUT") {
    if (!member) return error("Not found", 404);

    const body = await readJsonBody(request);
    state.members[memberIndex] = {
      ...member,
      username: String(body.username ?? member.username),
      displayName: String(body.displayName ?? member.displayName),
      avatarUrl: normalizeString(body.avatarUrl),
      role: String(body.role ?? member.role),
    };
    await saveState(state);
    return json(state.members[memberIndex]);
  }

  if (request.method === "DELETE") {
    if (memberIndex >= 0) {
      state.members.splice(memberIndex, 1);
      state.shinies = state.shinies.filter((item) => item.memberId !== id);
      updateMemberCounts(state);
      await saveState(state);
    }
    return noContent();
  }

  return null;
}

async function handleShinyTypes(request, state, path) {
  if (request.method === "GET" && path === "/shiny-types") {
    return json([...state.shinyTypes].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  if (request.method === "POST" && path === "/shiny-types") {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const body = await readJsonBody(request);
    if (!body.name || !body.code) {
      return error("Missing required fields", 400);
    }

    const shinyType = {
      id: nextId(state, "shinyTypes"),
      name: String(body.name),
      code: String(body.code),
      emoji: normalizeString(body.emoji),
      iconUrl: normalizeString(body.iconUrl),
      isEnabled: normalizeBoolean(body.isEnabled, true),
      sortOrder: parseInteger(body.sortOrder, 0) || 0,
    };

    state.shinyTypes.push(shinyType);
    await saveState(state);
    return json(shinyType, 201);
  }

  const match = path.match(/^\/shiny-types\/(\d+)$/);
  if (!match) return null;

  const authError = requireAdmin(request);
  if (authError) return authError;

  const id = Number.parseInt(match[1], 10);
  const index = state.shinyTypes.findIndex((item) => item.id === id);

  if (request.method === "PUT") {
    if (index < 0) return error("Not found", 404);
    const body = await readJsonBody(request);
    const current = state.shinyTypes[index];
    state.shinyTypes[index] = {
      ...current,
      name: String(body.name ?? current.name),
      code: String(body.code ?? current.code),
      emoji: normalizeString(body.emoji),
      iconUrl: normalizeString(body.iconUrl),
      isEnabled: normalizeBoolean(body.isEnabled, current.isEnabled),
      sortOrder: parseInteger(body.sortOrder, current.sortOrder) || 0,
    };
    await saveState(state);
    return json(state.shinyTypes[index]);
  }

  if (request.method === "DELETE") {
    if (index >= 0) {
      state.shinyTypes.splice(index, 1);
      state.shinies = state.shinies.map((item) =>
        item.shinyTypeId === id ? { ...item, shinyTypeId: null } : item,
      );
      await saveState(state);
    }
    return noContent();
  }

  return null;
}

async function handleShinies(request, state, path, searchParams) {
  if (request.method === "GET" && path === "/shinies") {
    const timeRange = searchParams.get("timeRange");
    const memberId = parseInteger(searchParams.get("memberId"));
    const pokemonId = parseInteger(searchParams.get("pokemonId"));
    const shinyTypeId = parseInteger(searchParams.get("shinyTypeId"));
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const limit = parseInteger(searchParams.get("limit"), 50) || 50;
    const offset = parseInteger(searchParams.get("offset"), 0) || 0;

    let shinies = [...state.shinies];

    if (timeRange === "week" || timeRange === "lastWeek") {
      const range = getWeekRange(timeRange === "lastWeek" ? -1 : 0);
      shinies = shinies.filter((item) => {
        const caughtAt = new Date(item.caughtAt);
        return caughtAt >= range.start && caughtAt < range.end;
      });
    }

    if (memberId != null) {
      shinies = shinies.filter((item) => item.memberId === memberId);
    }
    if (pokemonId != null) {
      shinies = shinies.filter((item) => item.pokemonId === pokemonId);
    }
    if (shinyTypeId != null) {
      shinies = shinies.filter((item) => item.shinyTypeId === shinyTypeId);
    }
    if (search) {
      shinies = shinies.filter((item) => {
        return (
          item.pokemonName.toLowerCase().includes(search) ||
          (item.location || "").toLowerCase().includes(search)
        );
      });
    }

    shinies.sort((a, b) => new Date(b.caughtAt) - new Date(a.caughtAt));
    const total = shinies.length;
    const page = shinies.slice(offset, offset + limit).map((item) => formatShinyRecord(state, item));
    return json({ shinies: page, total });
  }

  if (request.method === "POST" && path === "/shinies") {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const body = await readJsonBody(request);
    if (!body.pokemonId || !body.pokemonName || !body.pokemonSpriteUrl || !body.memberId) {
      return error("Missing required fields", 400);
    }

    const shiny = {
      id: nextId(state, "shinies"),
      pokemonId: parseInteger(body.pokemonId, 0) || 0,
      pokemonName: String(body.pokemonName),
      pokemonSpriteUrl: String(body.pokemonSpriteUrl),
      memberId: parseInteger(body.memberId, 0) || 0,
      shinyTypeId: parseInteger(body.shinyTypeId),
      caughtAt: normalizeString(body.caughtAt, new Date().toISOString()),
      catchMethod: normalizeString(body.catchMethod),
      encounterNumber: parseInteger(body.encounterNumber),
      location: normalizeString(body.location),
      notes: normalizeString(body.notes),
      isAlpha: normalizeBoolean(body.isAlpha),
      isSecret: normalizeBoolean(body.isSecret),
    };

    state.shinies.push(shiny);
    updateMemberCounts(state);
    await saveState(state);
    return json(formatShinyRecord(state, shiny), 201);
  }

  const match = path.match(/^\/shinies\/(\d+)$/);
  if (!match) return null;

  const id = Number.parseInt(match[1], 10);
  const index = state.shinies.findIndex((item) => item.id === id);
  const shiny = index >= 0 ? state.shinies[index] : null;

  if (request.method === "GET") {
    return shiny ? json(formatShinyRecord(state, shiny)) : error("Not found", 404);
  }

  const authError = requireAdmin(request);
  if (authError) return authError;

  if (request.method === "PUT") {
    if (!shiny) return error("Not found", 404);
    const body = await readJsonBody(request);
    state.shinies[index] = {
      ...shiny,
      pokemonId: parseInteger(body.pokemonId, shiny.pokemonId) || shiny.pokemonId,
      pokemonName: String(body.pokemonName ?? shiny.pokemonName),
      pokemonSpriteUrl: String(body.pokemonSpriteUrl ?? shiny.pokemonSpriteUrl),
      memberId: parseInteger(body.memberId, shiny.memberId) || shiny.memberId,
      shinyTypeId: parseInteger(body.shinyTypeId),
      caughtAt: normalizeString(body.caughtAt, shiny.caughtAt),
      catchMethod: normalizeString(body.catchMethod),
      encounterNumber: parseInteger(body.encounterNumber),
      location: normalizeString(body.location),
      notes: normalizeString(body.notes),
      isAlpha: normalizeBoolean(body.isAlpha, shiny.isAlpha),
      isSecret: normalizeBoolean(body.isSecret, shiny.isSecret),
    };
    updateMemberCounts(state);
    await saveState(state);
    return json(formatShinyRecord(state, state.shinies[index]));
  }

  if (request.method === "DELETE") {
    if (index >= 0) {
      state.shinies.splice(index, 1);
      updateMemberCounts(state);
      await saveState(state);
    }
    return noContent();
  }

  return null;
}

async function handleBounties(request, state, path, searchParams) {
  if (request.method === "GET" && path === "/bounties") {
    const month = searchParams.get("month");
    const bounties = month
      ? state.bounties.filter((item) => item.month === month)
      : state.bounties;
    return json(bounties);
  }

  if (request.method === "POST" && path === "/bounties") {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const body = await readJsonBody(request);
    if (!body.title || !body.description || !body.month) {
      return error("Missing required fields", 400);
    }

    const bounty = {
      id: nextId(state, "bounties"),
      title: String(body.title),
      description: String(body.description),
      imageUrl: normalizeString(body.imageUrl),
      month: String(body.month),
      isActive: normalizeBoolean(body.isActive, true),
      points: parseInteger(body.points),
    };
    state.bounties.push(bounty);
    await saveState(state);
    return json(bounty, 201);
  }

  const match = path.match(/^\/bounties\/(\d+)$/);
  if (!match) return null;

  const authError = requireAdmin(request);
  if (authError) return authError;

  const id = Number.parseInt(match[1], 10);
  const index = state.bounties.findIndex((item) => item.id === id);

  if (request.method === "PUT") {
    if (index < 0) return error("Not found", 404);
    const body = await readJsonBody(request);
    const current = state.bounties[index];
    state.bounties[index] = {
      ...current,
      title: String(body.title ?? current.title),
      description: String(body.description ?? current.description),
      imageUrl: normalizeString(body.imageUrl),
      month: String(body.month ?? current.month),
      isActive: normalizeBoolean(body.isActive, current.isActive),
      points: parseInteger(body.points),
    };
    await saveState(state);
    return json(state.bounties[index]);
  }

  if (request.method === "DELETE") {
    if (index >= 0) {
      state.bounties.splice(index, 1);
      await saveState(state);
    }
    return noContent();
  }

  return null;
}

async function handleEvents(request, state, path) {
  if (request.method === "GET" && path === "/events/next") {
    return state.nextEvent ? json(state.nextEvent) : error("No event", 404);
  }

  if (request.method === "PUT" && path === "/events/next") {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const body = await readJsonBody(request);
    if (!body.title || !body.description) {
      return error("Missing required fields", 400);
    }

    state.nextEvent = {
      id: state.nextEvent?.id || nextId(state, "events"),
      title: String(body.title),
      description: String(body.description),
      imageUrl: normalizeString(body.imageUrl),
      externalUrl: normalizeString(body.externalUrl),
      eventDate: normalizeString(body.eventDate),
    };
    await saveState(state);
    return json(state.nextEvent);
  }

  return null;
}

async function handleStats(request, state, path) {
  if (request.method !== "GET" || path !== "/stats") return null;

  const recentCatches = [...state.shinies]
    .sort((a, b) => new Date(b.caughtAt) - new Date(a.caughtAt))
    .slice(0, 10)
    .map((item) => formatShinyRecord(state, item));

  const shinyPoints = state.members.reduce((sum, member) => sum + member.shinyPoints, 0);

  return json({
    memberCount: state.members.length,
    totalShinies: state.shinies.length,
    shinyPoints,
    recentCatches,
  });
}

async function handlePokedex(request, state, path, searchParams) {
  if (request.method !== "GET" || path !== "/pokedex") return null;

  const region = searchParams.get("region");
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const memberId = parseInteger(searchParams.get("memberId"));
  const alphaOnly = searchParams.get("alphaOnly") === "true";
  const secretOnly = searchParams.get("secretOnly") === "true";

  const grouped = new Map();
  const sortedShinies = [...state.shinies].sort(
    (a, b) => new Date(b.caughtAt) - new Date(a.caughtAt),
  );

  for (const shiny of sortedShinies) {
    if (!grouped.has(shiny.pokemonId)) {
      grouped.set(shiny.pokemonId, []);
    }
    grouped.get(shiny.pokemonId).push(shiny);
  }

  let entries = Array.from(grouped.entries()).map(([pokemonId, catches]) => {
    const first = catches[0];
    const regionInfo = findRegionInfo(pokemonId);
    let ownedBy = catches;

    if (memberId != null) {
      ownedBy = ownedBy.filter((item) => item.memberId === memberId);
    }
    if (alphaOnly) {
      ownedBy = ownedBy.filter((item) => item.isAlpha);
    }
    if (secretOnly) {
      ownedBy = ownedBy.filter((item) => item.isSecret);
    }

    const records = ownedBy.map((item) => formatShinyRecord(state, item));
    const ownershipStatus = records.length === 0 ? "missing" : "owned";

    return {
      pokemonId,
      name: first.pokemonName,
      spriteUrl: first.pokemonSpriteUrl,
      types: [],
      generation: regionInfo.gen,
      region: regionInfo.region,
      ownedBy: records,
      ownershipStatus,
      evolutionLineStatus: ownershipStatus === "owned" ? "complete" : "missing",
    };
  });

  if (region && region !== "all") {
    entries = entries.filter((entry) => entry.region.toLowerCase() === region.toLowerCase());
  }
  if (search) {
    entries = entries.filter((entry) => {
      return (
        entry.name.toLowerCase().includes(search) ||
        String(entry.pokemonId) === search
      );
    });
  }

  entries.sort((a, b) => a.pokemonId - b.pokemonId);

  const totalOwned = entries.filter((entry) => entry.ownershipStatus === "owned").length;
  const totalPokemon = entries.length;
  const completionPercent =
    totalPokemon > 0 ? Math.round((totalOwned / totalPokemon) * 1000) / 10 : 0;

  return json({
    entries,
    totalOwned,
    totalPokemon,
    completionPercent,
  });
}

async function handleSiteSettings(request, state, path) {
  if (request.method === "GET" && path === "/site-settings") {
    return json(state.siteSettings || { ...DEFAULT_SETTINGS });
  }

  if (request.method === "PUT" && path === "/site-settings") {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const body = await readJsonBody(request);
    state.siteSettings = {
      navHomeLabel: String(body.navHomeLabel ?? DEFAULT_SETTINGS.navHomeLabel),
      navTeamInfoLabel: String(
        body.navTeamInfoLabel ?? DEFAULT_SETTINGS.navTeamInfoLabel,
      ),
      navShowcaseLabel: String(
        body.navShowcaseLabel ?? DEFAULT_SETTINGS.navShowcaseLabel,
      ),
      navShinyDexLabel: String(
        body.navShinyDexLabel ?? DEFAULT_SETTINGS.navShinyDexLabel,
      ),
      navRecruitmentLabel: String(
        body.navRecruitmentLabel ?? DEFAULT_SETTINGS.navRecruitmentLabel,
      ),
      teamInfoTitle: String(body.teamInfoTitle ?? DEFAULT_SETTINGS.teamInfoTitle),
      teamInfoDescription: String(
        body.teamInfoDescription ?? DEFAULT_SETTINGS.teamInfoDescription,
      ),
      teamInfoButtonLabel: String(
        body.teamInfoButtonLabel ?? DEFAULT_SETTINGS.teamInfoButtonLabel,
      ),
      recruitmentTitle: String(
        body.recruitmentTitle ?? DEFAULT_SETTINGS.recruitmentTitle,
      ),
      recruitmentRequirements: String(
        body.recruitmentRequirements ?? DEFAULT_SETTINGS.recruitmentRequirements,
      ),
      recruitmentDiscordButtonLabel: String(
        body.recruitmentDiscordButtonLabel ??
          DEFAULT_SETTINGS.recruitmentDiscordButtonLabel,
      ),
      recruitmentDiscordUrl: String(
        body.recruitmentDiscordUrl ?? DEFAULT_SETTINGS.recruitmentDiscordUrl,
      ),
    };
    await saveState(state);
    return json(state.siteSettings);
  }

  return null;
}

function getUploadContentType(file, metadata) {
  return metadata?.contentType || file?.type || "application/octet-stream";
}

async function handleUploads(request, path) {
  const uploads = getStore(UPLOADS_STORE);

  if (request.method === "POST" && path === "/uploads") {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return error("No file uploaded", 400);
    }

    const extension = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf("."))
      : "";
    const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;

    await uploads.set(filename, file, {
      metadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    return json({ url: `/api/uploads/${filename}`, filename });
  }

  const match = path.match(/^\/uploads\/([^/]+)$/);
  if (!match || request.method !== "GET") return null;

  const filename = match[1];
  const file = await uploads.get(filename, { type: "blob" });
  if (!file) {
    return error("Not found", 404);
  }

  const metadata = await uploads.getMetadata(filename);
  return new Response(file, {
    headers: {
      "content-type": getUploadContentType(file, metadata),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "GET,POST,PUT,DELETE,OPTIONS",
      },
    });
  }

  const { pathname, searchParams } = getRequestPath(request);

  try {
    if (pathname === "/healthz") return handleHealth();

    const adminResponse = await handleAdmin(request, pathname);
    if (adminResponse) return adminResponse;

    const uploadResponse = await handleUploads(request, pathname);
    if (uploadResponse) return uploadResponse;

    const state = await loadState();

    const handlers = [
      () => handleMembers(request, state, pathname),
      () => handleShinyTypes(request, state, pathname),
      () => handleShinies(request, state, pathname, searchParams),
      () => handleBounties(request, state, pathname, searchParams),
      () => handleEvents(request, state, pathname),
      () => handleStats(request, state, pathname),
      () => handlePokedex(request, state, pathname, searchParams),
      () => handleSiteSettings(request, state, pathname),
    ];

    for (const route of handlers) {
      const response = await route();
      if (response) return response;
    }

    return error("Not found", 404);
  } catch (err) {
    return error("Internal server error", 500, err);
  }
}
