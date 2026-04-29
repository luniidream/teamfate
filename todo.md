# Team Fate Tracker - Development TODO

## Phase 1: Design System & Database Schema
- [x] Set up retro-neon design tokens and Tailwind CSS customization
- [x] Create global CSS with scanline texture and dark theme
- [x] Design database schema (members, shinies, shiny_types, bounties, events, site_settings)
- [x] Generate and apply database migrations
- [x] Set up seed data scripts

## Phase 2: Backend - Auth & Core API
- [x] Implement admin JWT authentication (login/logout/me)
- [x] Implement member session-based authentication (login/logout/me)
- [x] Create password hashing and reset functionality
- [x] Build database query helpers for all entities
- [x] Implement tRPC procedures for members, shinies, shiny_types, bounties, events, site_settings
- [x] Set up S3 file upload system
- [x] Implement auto-increment logic for shiny counts and points
- [x] Create API endpoints for stats and pokedex data

## Phase 3: Frontend - Global Layout & Public Pages
- [x] Create global layout with sticky navbar
- [x] Build navbar with desktop links and mobile hamburger menu
- [x] Implement responsive container and spacing system
- [x] Build Home page with hero, stats cards, latest catches tabs, bounties, next event
- [x] Build Team Info page with member roster
- [x] Build Recruitment page with configurable content
- [x] Add admin icon to navbar (visible only when authenticated)

## Phase 4: Frontend - Shiny Showcase & Dex
- [x] Integrate PokeAPI for sprite data (Gen 1-5, ID 1-649)
- [x] Build Shiny Showcase page with member filtering and sorting
- [x] Implement sprite grid with hover tooltips and sparkle effects
- [x] Build Shiny Dex page with sidebar filters (region, alpha, secret)
- [x] Implement dex card states (owned, evolution line active, missing)
- [x] Add evolution line tracking logic

## Phase 5: Frontend - Member Portal
- [x] Create member login page
- [x] Build /my-shinies protected route
- [x] Create shiny form with Pokemon picker and search
- [x] Build personal shiny list with edit/delete
- [x] Implement session management and logout

## Phase 6: Frontend - Admin Terminal
- [x] Create admin login page
- [x] Build admin dashboard with tabbed interface
- [x] Members tab: CRUD operations, password generation/reset
- [x] Shinies tab: admin can manage all shinies
- [x] Shiny Types tab: manage custom types with image upload
- [x] Bounties tab: create/edit/delete with image upload
- [x] Next Event tab: edit single event with image upload
- [x] Site Content tab: manage all CMS settings and logo

## Phase 7: Polish & Delivery
- [x] Add toast notifications for all CRUD operations
- [x] Implement loading states and error handling
- [x] Test all authentication flows
- [x] Test responsive design on mobile
- [x] Populate seed data
- [x] Create comprehensive README
- [x] Final UI polish and visual refinement
- [x] Create checkpoint and deliver to user
