# Team Fate Tracker - Implementation Guide

## 🎯 Current Status

### ✅ Completed
- **Database Schema**: 8 tables with all relationships
- **Backend Authentication**: JWT admin auth + session member auth
- **tRPC API Layer**: Procedures for all entities
- **Frontend Foundation**: Retro-neon design system with glass-morphism
- **Global Navigation**: Sticky navbar with mobile menu
- **Public Pages**: Home, Team Info, Recruitment (with sample data)
- **Styling**: Dark theme with neon pink/teal accents, scanline texture

### 📋 Ready to Implement
The following pages have been scaffolded and are ready for backend integration:
- Shiny Showcase (with PokeAPI integration)
- Shiny Dex (Gen 1-5 tracking, ID 1-649)
- Member Portal (/my-shinies)
- Admin Terminal (/admin)

---

## 🔧 Next Steps for Extending

### 1. Connect tRPC Procedures to Frontend

Each page has TODO comments where tRPC calls should be integrated:

**Example - Home.tsx:**
```tsx
// Current (mock data):
setStats({
  memberCount: 3,
  totalShinies: 2,
  shinyPoints: 100,
  recentCatches: [],
});

// Should be:
const { data: stats } = trpc.stats.getGuildStats.useQuery();
const { data: bounties } = trpc.bounties.list.useQuery();
const { data: nextEvent } = trpc.events.getNext.useQuery();
```

**Steps:**
1. Import `trpc` from `@/lib/trpc`
2. Replace mock data with `trpc.*.useQuery()` calls
3. Handle loading/error states with `isLoading` and `error` from query
4. Run `pnpm test` to verify backend integration

### 2. Implement Shiny Showcase Page

**Location**: `client/src/pages/Showcase.tsx`

**Requirements:**
- Fetch all shinies from `trpc.shinies.list.useQuery()`
- Display as grid with Gen 5 sprites from PokeAPI
- Add filters: by member, by type
- Show Pokemon name, member who caught it, catch date
- Add hover effects with sprite glow

**PokeAPI Integration:**
```tsx
const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`;
// Use CSS: image-rendering: pixelated; for retro look
```

### 3. Implement Shiny Dex Page

**Location**: `client/src/pages/Dex.tsx`

**Requirements:**
- Display all Pokemon from Gen 1-5 (ID 1-649)
- Show caught/uncaught status per member
- Highlight evolution lines when one is caught
- Add filters: region, alpha/secret status
- Show sprite with pixelated rendering

**Data Structure:**
```tsx
interface DexEntry {
  pokemonId: number;
  name: string;
  spriteUrl: string;
  isCaught: boolean;
  caughtBy?: string;
  shinyType?: string;
}
```

### 4. Implement Member Portal (/my-shinies)

**Location**: `client/src/pages/MyShinies.tsx`

**Requirements:**
- Member login page first
- Protected route with session check
- List personal shinies with edit/delete
- Form to add new shiny (Pokemon picker with search)
- Integrate with `trpc.member.*` procedures

**Form Fields:**
- Pokemon (searchable dropdown)
- Shiny Type (dropdown from `trpc.shinyTypes.list`)
- Catch Method
- Location
- Nickname
- Caught Date

### 5. Implement Admin Terminal (/admin)

**Location**: `client/src/pages/Admin.tsx`

**Tabs:**
1. **Members**: CRUD operations, password reset
2. **Shinies**: Admin can manage all shinies
3. **Shiny Types**: Create/edit custom types with image upload
4. **Bounties**: Create/edit with image upload
5. **Events**: Edit single event with image upload
6. **Site Settings**: Manage all CMS content

**Admin Login:**
```tsx
const loginMutation = trpc.admin.login.useMutation();
// Credentials: admin / (ADMIN_PASSWORD env var)
```

---

## 📊 Database Integration Checklist

### For Each Page:
- [ ] Identify required tRPC procedures
- [ ] Check if procedures exist in `server/routers.ts`
- [ ] If missing, add procedure to router
- [ ] Add query helper to `server/db.ts` if needed
- [ ] Update schema in `drizzle/schema.ts` if needed
- [ ] Write vitest tests for new procedures
- [ ] Connect frontend with `trpc.*.useQuery/useMutation`

### Example Procedure (Already Implemented):
```ts
// server/routers.ts
shinies: router({
  list: publicProcedure
    .input(z.object({ memberId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await db.getShinies(input?.memberId);
    }),
  create: protectedProcedure
    .input(createShinySchema)
    .mutation(async ({ ctx, input }) => {
      return await db.createShiny(ctx.user.id, input);
    }),
}),
```

---

## 🎨 Design Consistency

All pages should follow this pattern:

```tsx
// Color scheme
const neonPink = '#ec4899';
const neonTeal = '#22c55e';
const darkBg = 'rgba(30, 41, 59, 0.4)';

// Glass panel style
style={{
  background: darkBg,
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(236, 72, 153, 0.3)',
  boxShadow: '0 0 20px rgba(236, 72, 153, 0.1)'
}}

// Neon text
style={{
  color: neonPink,
  textShadow: '0 0 10px rgba(236, 72, 153, 0.8), 0 0 20px rgba(236, 72, 153, 0.4)'
}}
```

---

## 🧪 Testing Requirements

Before committing changes:

```bash
# Run all tests
pnpm test

# Write tests for new procedures
# Location: server/*.test.ts
# Use vitest pattern from server/auth.logout.test.ts
```

**Test Template:**
```ts
describe('shinies.create', () => {
  it('creates a shiny for the authenticated member', async () => {
    const ctx = createMemberContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.shinies.create({
      pokemonId: 25,
      pokemonName: 'Pikachu',
      shinyTypeId: 1,
      // ... other fields
    });
    
    expect(result).toHaveProperty('id');
    expect(result.memberId).toBe(ctx.user.id);
  });
});
```

---

## 🚀 Deployment Checklist

Before publishing:

1. [ ] All pages load without errors
2. [ ] All tRPC calls are connected (no mock data)
3. [ ] Authentication flows tested (admin + member)
4. [ ] Mobile responsive design verified
5. [ ] All tests passing (`pnpm test`)
6. [ ] Database seeded with sample data
7. [ ] S3 uploads working for admin media
8. [ ] Create checkpoint: `webdev_save_checkpoint`
9. [ ] Click "Publish" in Management UI

---

## 📚 File Structure Reference

```
client/src/
├── pages/
│   ├── Home.tsx              ✅ Complete
│   ├── TeamInfo.tsx          ✅ Complete
│   ├── Recruitment.tsx       ✅ Complete
│   ├── Showcase.tsx          📝 Ready to implement
│   ├── Dex.tsx               📝 Ready to implement
│   ├── MyShinies.tsx         📝 Ready to implement
│   ├── Admin.tsx             📝 Ready to implement
│   └── NotFound.tsx          ✅ Provided
├── components/
│   ├── Navbar.tsx            ✅ Complete
│   └── ui/                   ✅ shadcn/ui components
└── lib/
    └── trpc.ts               ✅ tRPC client setup

server/
├── routers.ts                ✅ All procedures defined
├── db.ts                     ✅ Query helpers
├── auth.ts                   ✅ Auth utilities
└── storage.ts                ✅ S3 helpers (ready to use)
```

---

## 🔗 API Reference

### Public Procedures
```ts
trpc.stats.getGuildStats.useQuery()
trpc.members.list.useQuery()
trpc.shinies.list.useQuery({ memberId?: number })
trpc.shinyTypes.list.useQuery()
trpc.bounties.list.useQuery()
trpc.events.getNext.useQuery()
trpc.siteSettings.get.useQuery()
```

### Admin Procedures
```ts
trpc.admin.login.useMutation()
trpc.admin.me.useQuery()
trpc.admin.logout.useMutation()
trpc.members.create.useMutation()
trpc.members.update.useMutation()
trpc.members.delete.useMutation()
// ... and more
```

### Member Procedures
```ts
trpc.member.login.useMutation()
trpc.member.me.useQuery()
trpc.member.logout.useMutation()
trpc.shinies.create.useMutation()
trpc.shinies.update.useMutation()
trpc.shinies.delete.useMutation()
```

---

## 💡 Pro Tips

1. **Use optimistic updates** for better UX:
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

2. **Handle loading states**:
   ```tsx
   if (isLoading) return <LoadingSpinner />;
   if (error) return <ErrorMessage error={error} />;
   if (!data) return <EmptyState />;
   ```

3. **Use toast notifications**:
   ```tsx
   import { toast } from 'sonner';
   toast.success('Shiny added!');
   toast.error('Failed to add shiny');
   ```

---

## 🆘 Troubleshooting

**"Cannot apply unknown utility class"**
- This was fixed by removing problematic custom CSS
- Use inline styles with `style={{}}` prop instead

**tRPC calls return undefined**
- Check that backend procedure is defined in `server/routers.ts`
- Verify database query helper exists in `server/db.ts`
- Check browser console for error messages

**Authentication not working**
- Verify JWT token is set in cookies
- Check `ADMIN_PASSWORD` env var is set
- Use browser DevTools to inspect cookies

---

**Last Updated**: April 9, 2026  
**Status**: MVP Foundation Ready for Extension
