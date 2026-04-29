# Team Fate Tracker - Pokemon Shiny Hunting Guild Platform

## 🎮 Overview

Team Fate Tracker is a full-stack web application for managing a Pokemon shiny hunting guild. It features a retro-neon aesthetic with glass-morphism UI components, real-time shiny tracking, member management, and an admin terminal for guild configuration.

## 🏗️ Architecture

### Backend (tRPC + Express)
- **Authentication**: JWT-based admin auth + session-based member auth
- **Database**: MySQL with Drizzle ORM
- **API**: tRPC procedures for type-safe client-server communication
- **Storage**: S3 integration for images and media

### Frontend (React + Tailwind)
- **Framework**: React 19 with Wouter for routing
- **Styling**: Tailwind CSS 4 with custom retro-neon components
- **State Management**: tRPC + React Query for data fetching
- **UI Components**: shadcn/ui + custom glass-morphism panels

### Database Schema
- **members**: Guild members with roles (admin/staff/member)
- **member_sessions**: Session management for member login
- **shinies**: Caught shiny Pokemon records
- **shiny_types**: Custom shiny type definitions (Standard, Secret, Alpha, etc.)
- **bounties**: Monthly bounty challenges
- **events**: Guild events and announcements
- **site_settings**: CMS configuration
- **users**: Manus OAuth integration

## 🚀 Getting Started

### Development
```bash
cd /home/ubuntu/team-fate-tracker
pnpm install
pnpm dev
```

The dev server runs on `http://localhost:3000`

### Database Setup
```bash
# Generate migrations from schema
pnpm drizzle-kit generate

# Apply migrations via webdev_execute_sql tool
# Then seed the database
node seed-db.mjs
```

## 🔐 Authentication

### Admin Login
- **Endpoint**: `/api/trpc/admin.login`
- **Credentials**: 
  - Username: `admin`
  - Password: Set via `ADMIN_PASSWORD` env var
- **Response**: JWT token (stored in cookie)

### Member Login
- **Endpoint**: `/api/trpc/member.login`
- **Credentials**: Username + Password
- **Response**: Session token (30-day expiry)

### Protected Routes
- `/admin` - Admin terminal (requires admin JWT)
- `/my-shinies` - Member portal (requires member session)

## 📊 API Endpoints

### Public Procedures
- `stats.getGuildStats()` - Guild-wide statistics
- `members.list()` - List all members
- `shinies.list()` - List all shinies with filters
- `shinyTypes.list()` - List shiny type definitions
- `siteSettings.get()` - Get site configuration

### Protected Procedures (Admin)
- `admin.login(username, password)` - Admin authentication
- `admin.me()` - Get current admin user
- `admin.logout()` - Clear admin session
- `members.create(data)` - Create new member
- `members.update(id, data)` - Update member
- `members.delete(id)` - Delete member
- `shinyTypes.create(data)` - Create shiny type
- `siteSettings.update(data)` - Update site config
- `bounties.create(data)` - Create bounty
- `events.create(data)` - Create event

### Protected Procedures (Member)
- `member.login(username, password)` - Member authentication
- `member.me()` - Get current member
- `member.logout()` - Clear member session
- `shinies.create(data)` - Log a new shiny
- `shinies.update(id, data)` - Edit shiny entry
- `shinies.delete(id)` - Delete shiny entry

## 🎨 Design System

### Color Palette
- **Primary**: Neon Pink (#ec4899) with glow effects
- **Secondary**: Teal (#22c55e) for accents
- **Background**: Deep Navy (#1a1a2e) with scanline texture
- **Glass**: Semi-transparent dark blue with backdrop blur

### Typography
- **Headings**: "Press Start 2P" (pixelated retro font)
- **Body**: "Courier Prime" (monospace)

### Components
- **Glass Panels**: Semi-transparent cards with pink borders
- **Neon Text**: Pink text with glow shadow
- **Stat Cards**: Centered stats with large numbers
- **Buttons**: Pink with hover glow and scale animation

## 📁 Project Structure

```
team-fate-tracker/
├── client/
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/            # tRPC client setup
│   │   ├── App.tsx         # Router and layout
│   │   └── index.css       # Global styles
│   ├── index.html          # HTML entry point
│   └── public/             # Static assets
├── server/
│   ├── routers.ts          # tRPC procedure definitions
│   ├── db.ts               # Database query helpers
│   ├── auth.ts             # Authentication utilities
│   ├── _core/              # Framework internals
│   └── storage.ts          # S3 storage helpers
├── drizzle/
│   ├── schema.ts           # Database schema
│   └── migrations/         # SQL migrations
├── shared/                 # Shared types and constants
└── seed-db.mjs             # Database seeding script
```

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Secret for signing JWT tokens
- `ADMIN_PASSWORD`: Admin login password
- `VITE_APP_ID`: Manus OAuth app ID
- `OAUTH_SERVER_URL`: Manus OAuth server URL

### Site Settings (CMS)
Configure via Admin Terminal > Site Settings:
- Logo URL
- Navigation labels
- Team info content
- Recruitment status and details
- Discord invite link

## 📝 Database Seeding

The `seed-db.mjs` script creates:
- Site settings with default configuration
- 3 shiny types (Standard, Secret, Alpha)
- 3 sample members (admin, staff, member)
- 2 sample shinies
- 1 bounty challenge
- 1 event

**Credentials for testing:**
- Admin: `admin` / `password123`
- Staff: `collector2` / `password123`
- Member: `trainer3` / `password123`

## 🧪 Testing

Run unit tests with:
```bash
pnpm test
```

Tests are located in `server/*.test.ts` files using Vitest.

## 📦 Deployment

1. Create a checkpoint: `webdev_save_checkpoint`
2. Click the "Publish" button in the Management UI
3. Configure custom domain in Settings > Domains (optional)

## 🎯 Features Implemented

### Phase 1: Foundation ✅
- [x] Database schema with 8 tables
- [x] Backend authentication (admin + member)
- [x] tRPC API procedures
- [x] Retro-neon design system
- [x] Home page with stats display
- [x] Navbar with navigation

### Phase 2-7: Frontend Pages (In Progress)
- [ ] Team Info page - Member roster
- [ ] Recruitment page - Status toggle
- [ ] Shiny Showcase - PokeAPI integration
- [ ] Shiny Dex - Gen 1-5 tracking (ID 1-649)
- [ ] Member Portal - Personal shiny log
- [ ] Admin Terminal - Full management UI

## 🛠️ Development Tips

### Adding a New Feature
1. Update schema in `drizzle/schema.ts`
2. Run `pnpm drizzle-kit generate`
3. Apply migration via `webdev_execute_sql`
4. Add query helpers in `server/db.ts`
5. Create tRPC procedures in `server/routers.ts`
6. Build UI components in `client/src/pages/` or `client/src/components/`
7. Write tests in `server/*.test.ts`
8. Run `pnpm test` to verify

### Debugging
- Server logs: Check `.manus-logs/devserver.log`
- Client logs: Check `.manus-logs/browserConsole.log`
- Network requests: Check `.manus-logs/networkRequests.log`

## 🚨 Known Limitations

- Custom CSS classes in Tailwind 4 require inline styles or separate CSS files
- PokeAPI sprite URLs may have CORS restrictions (use proxy if needed)
- S3 storage requires proper bucket configuration
- Member sessions expire after 30 days

## 📚 Resources

- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tailwind CSS 4](https://tailwindcss.com)
- [PokeAPI](https://pokeapi.co)
- [React Documentation](https://react.dev)

## 🤝 Contributing

This is a Manus project. All changes should follow the existing code style and include appropriate tests.

---

**Last Updated**: April 8, 2026  
**Version**: 1.0.0  
**Status**: MVP Ready
