# 🎯 Remaining Features & Connections

**Last Updated:** December 2024  
**Status:** Core features implemented, some integrations and configurations needed

---

## ✅ What's Already Implemented

### Core Features (100%)
- ✅ User authentication & registration
- ✅ Chain creation & management
- ✅ Mission lifecycle (LOBBY → CAPTURE → FUSING → RECAP → ARCHIVED)
- ✅ Entry submission & metadata extraction
- ✅ Video generation (Veo API + fallback)
- ✅ Chapter creation & sharing
- ✅ Gallery with filters
- ✅ Network/Orbit map visualization
- ✅ Admin panel & admin mode
- ✅ Dashboard
- ✅ Bridge detection between chains
- ✅ Daily mission scheduling (cron jobs)
- ✅ Analytics & metrics

### API Endpoints (95%)
- ✅ All core endpoints implemented
- ✅ Mission flow endpoints
- ✅ Gallery endpoints
- ✅ Admin endpoints
- ✅ Video generation endpoints

---

## 🔴 CRITICAL: Must Configure (Blocks Functionality)

### 1. Cloudinary Setup ⚠️ REQUIRED
**Status:** Not configured  
**Impact:** Blocks image/video uploads  
**Time:** 15 minutes

**Steps:**
1. Sign up at https://cloudinary.com
2. Get credentials (Cloud Name, API Key, API Secret)
3. Create unsigned upload preset: `cali_lights_unsigned`
4. Add to `.env.local`:
   ```bash
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

**Files:** `lib/cloudinary.ts`, `app/api/upload/route.ts`

---

### 2. Google Vision API ⚠️ REQUIRED
**Status:** Not configured  
**Impact:** No metadata extraction (tags, colors, objects)  
**Time:** 20 minutes

**Steps:**
1. Enable Vision API in Google Cloud Console
2. Create API key
3. Add to `.env.local`:
   ```bash
   GOOGLE_VISION_API_KEY=your_api_key
   ```

**Files:** `lib/services/metadata.ts`, `app/api/metadata/analyse/route.ts`

---

## 🟡 MISSING FEATURES: Need Implementation

### 1. Automatic Mission Propagation 🔴 HIGH PRIORITY
**Status:** Endpoint exists but not integrated  
**Impact:** Missions don't automatically propagate to connected chains  
**Time:** 30 minutes

**What's Missing:**
- `POST /api/mission/propagate` exists but isn't called automatically
- Need to integrate into `POST /api/mission/start` route
- Should optionally propagate to connected chains when starting a mission

**Files to Update:**
- `app/api/mission/start/route.ts` - Add optional propagation flag
- Add UI toggle in admin panel for "Propagate to connected chains"

**Implementation:**
```typescript
// In app/api/mission/start/route.ts
const body = schema.parse(await request.json());
const { propagateToConnectedChains = false } = body;

// After creating mission:
if (propagateToConnectedChains) {
  const connectedIds = await listConnectedChainIds(body.chainId);
  // Create missions in connected chains...
}
```

---

### 2. Welcome Video Generation 🔴 MEDIUM PRIORITY
**Status:** Not implemented  
**Impact:** No welcome video when users join a chain  
**Time:** 1 hour

**What's Missing:**
- When a user joins a chain via invite, generate a welcome video
- Use Veo API with user avatar + chain palette
- Store in `chapters` table with special flag

**Files to Create:**
- `app/api/chain/welcome-video/route.ts` - Generate welcome video
- Call from `app/api/invite/accept/route.ts` after user joins

**Implementation:**
```typescript
// After user joins chain in invite/accept
if (process.env.VEO_MODEL_NAME) {
  await generateWelcomeVideo({
    userId: user.id,
    chainId: chain.id,
    chainPalette: chain.theme_palette,
  });
}
```

---

### 3. Enhanced Gallery Map View 🟡 LOW PRIORITY
**Status:** Basic implementation exists  
**Impact:** Map view is basic, needs enhancement  
**Time:** 2 hours

**What's Missing:**
- Better clustering of pins by city
- Tap to show mission recap or entries
- Filter by date range
- Show mission paths/connections

**Files to Update:**
- `app/(app)/gallery/page.tsx` - Enhance map tab
- `app/api/gallery/map/route.ts` - Add clustering logic

---

### 4. Real-time Presence Indicators 🟡 MEDIUM PRIORITY
**Status:** Ably integration exists but not fully connected  
**Impact:** No live presence in mission lobbies  
**Time:** 1 hour

**What's Missing:**
- Connect Ably presence to mission lobby UI
- Show who's currently viewing/participating
- Update in real-time as users join/leave

**Files to Update:**
- `components/missions/MissionLobby.tsx` - Add real-time presence
- `lib/realtime.ts` - Enhance presence tracking

**Note:** Requires Ably configuration

---

### 5. Push Notifications Integration 🟡 MEDIUM PRIORITY
**Status:** OneSignal service exists but not fully integrated  
**Impact:** No push notifications for mission events  
**Time:** 1.5 hours

**What's Missing:**
- User device token registration endpoint
- Notification preferences UI
- Enhanced notification triggers:
  - Mission start (daily)
  - Half-time reminder (2/3 submissions)
  - Recap ready alert
  - Bridge event notification

**Files to Create:**
- `app/api/notifications/register/route.ts` - Register device tokens
- `app/api/notifications/preferences/route.ts` - User preferences
- `components/settings/NotificationSettings.tsx` - UI component

**Files to Update:**
- `lib/services/notifications.ts` - Enhance with more triggers
- `app/api/mission/start/route.ts` - Add notification triggers
- `app/api/mission/recap/route.ts` - Notify when recap ready

**Note:** Requires OneSignal configuration

---

### 6. Mission Archive Auto-Cleanup 🟡 LOW PRIORITY
**Status:** Not implemented  
**Impact:** Old missions accumulate in database  
**Time:** 30 minutes

**What's Missing:**
- Cron job to archive old missions (30+ days)
- Option to delete very old missions (90+ days)
- Admin UI to manage archived missions

**Files to Create:**
- `app/api/admin/archive/cleanup/route.ts` - Cleanup endpoint
- Add to `vercel.json` cron jobs

**Implementation:**
```typescript
// Archive missions older than 30 days
// Delete missions older than 90 days (with confirmation)
```

---

### 7. Enhanced Analytics Dashboard 🟡 LOW PRIORITY
**Status:** Basic analytics exist  
**Impact:** Limited insights  
**Time:** 2 hours

**What's Missing:**
- Color distribution charts
- Mission completion trends over time
- User engagement metrics
- Chain growth metrics
- Export analytics data (CSV/JSON)

**Files to Update:**
- `components/dashboard/CreativeDashboard.tsx` - Add more charts
- `app/api/admin/analytics/route.ts` - Add more metrics
- `components/admin/AnalyticsBoard.tsx` - Enhanced visualizations

---

### 8. Entry Favorite/Collection System 🟡 LOW PRIORITY
**Status:** Endpoint exists but UI incomplete  
**Impact:** Users can't easily favorite entries  
**Time:** 1 hour

**What's Missing:**
- Gallery filter for "Favorites only"
- Collection/folder system for entries
- Share collections with other users

**Files to Update:**
- `app/(app)/gallery/page.tsx` - Add favorites filter
- `components/gallery/EntryCard.tsx` - Add favorite button
- `app/api/entry/favorite/route.ts` - Already exists ✅

---

### 9. Chapter Poem Generation 🟡 LOW PRIORITY
**Status:** Field exists but not auto-generated  
**Impact:** Chapters don't have poetic summaries  
**Time:** 2 hours

**What's Missing:**
- Integrate with AI (OpenAI/Anthropic) to generate poems
- Use mission prompt + metadata to create poetic recap
- Store in `chapters.poem` field

**Files to Create:**
- `lib/services/poetry.ts` - Poem generation service
- Update `app/api/mission/recap/route.ts` to generate poem

**Note:** Requires OpenAI or Anthropic API key

---

### 10. Video Polling Status UI 🟡 LOW PRIORITY
**Status:** Polling works but no UI feedback  
**Impact:** Users don't see video generation progress  
**Time:** 1 hour

**What's Missing:**
- Show video generation status in mission recap view
- Progress indicator for video operations
- Auto-refresh when video is ready

**Files to Update:**
- `components/missions/MissionRecap.tsx` - Add status indicator
- `app/api/video/status/route.ts` - Already exists ✅

---

## 🟢 OPTIONAL: Nice-to-Have Features

### 1. Export Data (CSV/JSON)
- Export missions, entries, chapters
- Admin panel export button

### 2. Mission Templates
- Save mission prompts as templates
- Quick-start from templates

### 3. Chain Themes & Customization
- Custom color palettes per chain
- Chain avatars/icons
- Chain descriptions

### 4. Social Sharing
- Share chapters to Instagram/Twitter
- Generate share cards with chapter preview

### 5. Advanced Search
- Full-text search across missions/entries
- Search by color, tags, date range
- Search within specific chains

### 6. Mission Comments/Reactions
- Comment on missions/chapters
- React with emojis
- Threaded discussions

### 7. Mission Challenges/Streaks
- Track consecutive mission completions
- Badges/achievements
- Leaderboards

### 8. Video Editing Tools
- Trim video chapters
- Add filters/effects
- Custom soundtracks

---

## 📋 Integration Checklist

### High Priority Integrations
- [ ] **Mission Propagation** - Auto-propagate to connected chains
- [ ] **Welcome Videos** - Generate on chain join
- [ ] **Push Notifications** - Full OneSignal integration
- [ ] **Real-time Presence** - Ably presence in lobbies

### Medium Priority Integrations
- [ ] **Enhanced Map View** - Better clustering and interactions
- [ ] **Analytics Export** - CSV/JSON export
- [ ] **Favorites UI** - Complete favorites system
- [ ] **Video Status UI** - Show generation progress

### Low Priority Integrations
- [ ] **Poem Generation** - AI-generated chapter poems
- [ ] **Auto-Archive** - Cleanup old missions
- [ ] **Mission Templates** - Save and reuse prompts
- [ ] **Social Sharing** - Share to social media

---

## 🚀 Quick Wins (Can Do Now)

1. **Mission Propagation** (30 min) - Add flag to mission start
2. **Favorites Filter** (30 min) - Add to gallery
3. **Video Status Indicator** (1 hour) - Show in recap view
4. **Auto-Archive Cron** (30 min) - Cleanup old missions

---

## 📊 Priority Summary

### 🔴 Critical (Blocks Functionality)
1. Cloudinary setup
2. Google Vision API setup

### 🟡 High Priority (Enhances UX)
1. Mission propagation integration
2. Welcome video generation
3. Push notifications (full)
4. Real-time presence

### 🟢 Medium Priority (Nice Features)
1. Enhanced map view
2. Analytics export
3. Favorites UI
4. Video status UI

### ⚪ Low Priority (Future)
1. Poem generation
2. Auto-archive
3. Mission templates
4. Social sharing

---

## 🎯 Recommended Next Steps

1. **Configure Cloudinary** (15 min) - Unblocks uploads
2. **Configure Google Vision API** (20 min) - Enables metadata
3. **Integrate Mission Propagation** (30 min) - Auto-propagate missions
4. **Add Welcome Videos** (1 hour) - On chain join
5. **Complete Push Notifications** (1.5 hours) - Full integration
6. **Add Real-time Presence** (1 hour) - Live updates in lobbies

**Total Time to Full Integration:** ~4-5 hours

---

**Status:** Core app is production-ready. Remaining work is integrations and configurations.

