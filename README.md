# 🎮 Team Fate Tracker - Pokemon Shiny Hunting Guild Platform

A full-stack web application for managing a Pokemon shiny hunting guild with a retro-neon aesthetic, featuring real-time shiny tracking, member management, and comprehensive admin controls.

## ✨ Features

### Public Pages
- **Home**: Guild statistics, active bounties, next event
- **Team Info**: Member roster sorted by shiny points
- **Recruitment**: Configurable recruitment status with Discord invite
- **Shiny Showcase**: Gallery of all caught shinies (ready to implement)
- **Shiny Dex**: Gen 1-5 Pokemon tracker (ID 1-649)

### Member Portal
- Member login with session management
- Personal shiny log with add/edit/delete
- Pokemon picker with search functionality
- Automatic shiny count and points tracking

### Admin Terminal
- Admin authentication with JWT
- Member management (CRUD + password reset)
- Shiny type management with custom icons
- Bounty creation and management
- Event scheduling
- Site settings and CMS configuration
- S3 image uploads for all media assets

### Design System
- **Aesthetic**: Retro-neon with glass-morphism panels
- **Colors**: Neon pink (#ec4899) + Teal (#22c55e) on dark navy background
- **Typography**: "Press Start 2P" for headings, "Courier Prime" for body
- **Effects**: Scanline texture, glow shadows, pixelated sprite rendering

---

## 🚀 Quick Start

### Installation
```bash
cd /home/ubuntu/team-fate-tracker
pnpm install
```

### Development
```bash
pnpm dev
```
Server runs on `http://localhost:3000`

### Database Setup
```bash
# Generate migrations
pnpm drizzle-kit generate

# Apply migrations via webdev_execute_sql tool

# Seed sample data
node seed-db.mjs
```

### Testing
```bash
pnpm test
```

---

## 📊 Architecture

### Tech Stack
- **Frontend**: React 19 + Tailwind CSS 4 + Wouter
- **Backend**: Express + tRPC 11 + Drizzle ORM
- **Database**: MySQL with 8 tables
- **Storage**: S3 for images and media
- **Auth**: JWT (admin) + Session (members)

### Database Schema
```
members              - Guild members with roles
member_sessions     - Session management
shinies             - Caught shiny Pokemon
shiny_types         - Custom shiny type definitions
bounties            - Monthly challenges
events              - Guild events
site_settings       - CMS configuration
users               - Manus OAuth integration
```

---

## 🔐 Authentication

### Admin Login
```
Username: admin
Password: (set via ADMIN_PASSWORD env var)
```

### Member Login
- Username + Password
- Session expires after 30 days
- Stored in secure HTTP-only cookies

---

## 📁 Project Structure

```
team-fate-tracker/
├── client/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable UI
│   │   ├── lib/trpc.ts      # tRPC client
│   │   ├── App.tsx          # Router
│   │   └── index.css        # Global styles
│   ├── index.html           # Entry point
│   └── public/              # Static files
├── server/
│   ├── routers.ts           # tRPC procedures
│   ├── db.ts                # Query helpers
│   ├── auth.ts              # Auth utilities
│   ├── storage.ts           # S3 helpers
│   └── _core/               # Framework internals
├── drizzle/
│   ├── schema.ts            # Database schema
│   └── migrations/          # SQL migrations
├── shared/                  # Shared types
├── seed-db.mjs              # Seed script
├── PROJECT_GUIDE.md         # Project overview
└── IMPLEMENTATION_GUIDE.md  # Extension guide
```

---

## 🎯 Current Implementation Status

### ✅ Completed
- Database schema and migrations
- Backend authentication (admin + member)
- tRPC API layer with all procedures
- Frontend design system (black & pink neon theme)
- Global navigation (navbar)
- Home page with stats, bounties, events
- Team Info page with member roster
- Recruitment page with configurable status
- **Shiny Showcase page** with sorting and member filtering
- **Shiny Dex page** (Gen 1-5 tracking with ownership states, ID 1-649)
- **Member Portal** (/my-shinies) with full CRUD for shinies
- **Admin Terminal** (/admin) with full management capabilities
- Comprehensive documentation

### 📋 Future Enhancements
- S3 image upload integration
- Real-time notifications
- Export functionality for shiny data

See **IMPLEMENTATION_GUIDE.md** for detailed instructions on extending these pages.

---

## 🔧 Configuration

### Environment Variables
```
DATABASE_URL=mysql://user:password@host/database
JWT_SECRET=your-secret-key
ADMIN_PASSWORD=admin-password
VITE_APP_ID=manus-oauth-app-id
OAUTH_SERVER_URL=https://api.manus.im
```

### Site Settings (Configurable via Admin)
- Logo URL
- Navigation labels
- Team info content
- Recruitment status and details
- Discord invite link
- Bounty configuration
- Event scheduling

---

## 🎨 Design Tokens

### Colors
```
Primary:    #ec4899 (Neon Pink)
Secondary:  #22c55e (Neon Teal)
Background: #1a1a2e (Deep Navy)
Glass:      rgba(30, 41, 59, 0.4) with blur
```

### Typography
```
Headings:   Press Start 2P (pixelated)
Body:       Courier Prime (monospace)
```

### Effects
```
Glow:       text-shadow with pink/teal
Glass:      backdrop-filter: blur(12px)
Scanlines:  repeating-linear-gradient overlay
Sprites:    image-rendering: pixelated
```

---

## 📚 API Reference

### Public Endpoints
```ts
GET  /api/trpc/stats.getGuildStats
GET  /api/trpc/members.list
GET  /api/trpc/shinies.list
GET  /api/trpc/shinyTypes.list
GET  /api/trpc/bounties.list
GET  /api/trpc/events.getNext
GET  /api/trpc/siteSettings.get
```

### Admin Endpoints
```ts
POST /api/trpc/admin.login
GET  /api/trpc/admin.me
POST /api/trpc/admin.logout
POST /api/trpc/members.create
PUT  /api/trpc/members.update
DEL  /api/trpc/members.delete
// ... and more
```

### Member Endpoints
```ts
POST /api/trpc/member.login
GET  /api/trpc/member.me
POST /api/trpc/member.logout
POST /api/trpc/shinies.create
PUT  /api/trpc/shinies.update
DEL  /api/trpc/shinies.delete
```

---

## 🧪 Testing

### Run All Tests
```bash
pnpm test
```

### Test Coverage
- Authentication flows (admin + member)
- Database operations
- tRPC procedures
- API error handling

### Writing Tests
Tests use Vitest. See `server/auth.logout.test.ts` for examples.

---

## 🚀 Deployment

### Pre-Deployment Checklist
- [ ] All pages load without errors
- [ ] All tRPC calls connected (no mock data)
- [ ] Authentication flows tested
- [ ] Mobile responsive design verified
- [ ] All tests passing (`pnpm test`)
- [ ] Database seeded with sample data

### Deploy to Manus
1. Create checkpoint: `webdev_save_checkpoint`
2. Click "Publish" button in Management UI
3. Configure custom domain (optional)

---

## 📖 Documentation

- **PROJECT_GUIDE.md** - Overview, architecture, setup
- **IMPLEMENTATION_GUIDE.md** - How to extend with new pages
- **DEPLOYMENT.md** - Vercel & GitHub deployment guide
- **API Reference** - All tRPC procedures
- **Design System** - Colors, typography, components

---

## 🆘 Troubleshooting

### Build Errors
```
Error: Cannot apply unknown utility class
→ Use inline styles with style={{}} prop
```

### Database Connection Issues
```
Error: Cannot connect to database
→ Verify DATABASE_URL is correct
→ Check MySQL server is running
```

### Authentication Failures
```
Error: Invalid credentials
→ Check ADMIN_PASSWORD env var
→ Verify user exists in database
```

### tRPC Calls Return Undefined
```
Error: Query returns undefined
→ Check procedure exists in server/routers.ts
→ Verify database helper in server/db.ts
→ Check browser console for errors
```

---

## 💡 Development Tips

### Adding a New Feature
1. Update schema in `drizzle/schema.ts`
2. Run `pnpm drizzle-kit generate`
3. Apply migration via `webdev_execute_sql`
4. Add query helper to `server/db.ts`
5. Create tRPC procedure in `server/routers.ts`
6. Build UI component in `client/src/pages/`
7. Write tests in `server/*.test.ts`
8. Run `pnpm test` to verify

### Using S3 Storage
```ts
import { storagePut } from "./server/storage";

const { url } = await storagePut(
  `admin-uploads/${filename}`,
  fileBuffer,
  "image/png"
);
```

### Optimistic Updates
```tsx
const mutation = trpc.shinies.create.useMutation({
  onMutate: async (newShiny) => {
    // Update cache immediately
    queryClient.setQueryData(['shinies'], (old) => [...old, newShiny]);
  },
  onError: () => {
    // Rollback on error
    queryClient.invalidateQueries(['shinies']);
  },
});
```

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review IMPLEMENTATION_GUIDE.md
3. Check browser console for errors
4. Review server logs in `.manus-logs/`

---

## 📄 License

MIT

---

## 🎉 Credits

Built with:
- React 19
- tRPC 11
- Tailwind CSS 4
- Drizzle ORM
- PokeAPI

---

**Last Updated**: April 9, 2026  
**Version**: 1.0.0  
**Status**: MVP Ready for Extension
