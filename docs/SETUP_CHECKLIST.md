# Cali Lights - Complete Setup & Feature Checklist

**Last Updated:** December 2024  
**Status:** Core app functional, services need configuration

---

## 🎯 PRIORITY 1: REQUIRED FOR BASIC FUNCTIONALITY

### ✅ Already Completed
- [x] PostgreSQL database schema and migrations
- [x] User authentication system
- [x] Core API endpoints structure
- [x] Front-end components (Mission flow, Gallery, Network, Admin)
- [x] Mobile-responsive UI
- [x] Database client (supports pooled & direct connections)
- [x] Sample data seeding scripts

### 🔴 CRITICAL: Must Configure to Run

#### 1. Cloudinary Setup (REQUIRED - Blocks image uploads)
**Priority:** 🔴 CRITICAL  
**Time:** 15 minutes  
**Status:** ⚠️ Not configured

**Steps:**
1. Sign up at https://cloudinary.com (free tier available)
2. Get credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret
3. Create unsigned upload preset:
   - Go to Settings → Upload → Upload presets
   - Create new preset: `cali_lights_unsigned`
   - Set signing mode to "Unsigned"
   - Set folder to `cali-lights/`
   - Save preset
4. Add to `.env.local`:
   ```bash
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```
5. Test upload:
   ```bash
   curl -X POST http://localhost:3000/api/cloudinary/signature
   ```

**Files affected:**
- `lib/cloudinary.ts`
- `app/api/cloudinary/signature/route.ts`
- `app/api/upload/route.ts`

---

#### 2. Google Cloud Vision API (REQUIRED - For metadata extraction)
**Priority:** 🔴 CRITICAL  
**Time:** 20 minutes  
**Status:** ⚠️ Not configured

**Steps:**
1. Go to https://console.cloud.google.com
2. Create new project or select existing: `cali-lights`
3. Enable Vision API:
   - Navigate to APIs & Services → Library
   - Search "Cloud Vision API"
   - Click Enable
4. Create API Key:
   - APIs & Services → Credentials
   - Create Credentials → API Key
   - Restrict key to "Cloud Vision API" (optional but recommended)
   - Copy API key
5. Add to `.env.local`:
   ```bash
   GOOGLE_VISION_API_KEY=your_api_key_here
   ```
6. Test metadata extraction:
   ```bash
   curl -X POST http://localhost:3000/api/metadata/analyse \
     -H "Content-Type: application/json" \
     -d '{"mediaUrl": "https://example.com/image.jpg"}'
   ```

**Files affected:**
- `lib/services/metadata.ts`
- `app/api/metadata/analyse/route.ts`

**Cost:** Free tier: 1,000 requests/month, then $1.50 per 1,000 requests

---

#### 3. PostgreSQL Database (REQUIRED - Already configured)
**Priority:** ✅ DONE  
**Status:** ✅ Configured

**Verify:**
```bash
# Check connection
npm run db:migrate
```

---

## 🟡 PRIORITY 2: ENHANCED FEATURES

### 4. Google Cloud Vertex AI / Veo (OPTIONAL - For video generation)
**Priority:** 🟡 HIGH (for full experience)  
**Time:** 45 minutes  
**Status:** ⚠️ Not configured  
**Fallback:** App uses collage if not configured

**Steps:**
1. Enable Vertex AI API:
   - Google Cloud Console → APIs & Services → Library
   - Search "Vertex AI API"
   - Click Enable
2. Request Veo Access:
   - Go to Vertex AI → Generative AI → Models
   - Look for "Veo" model
   - Request access (may require approval - can take days)
   - Alternative: Use `publishers/google/models/veo-2.0-generate` if available
3. Create Service Account:
   - IAM & Admin → Service Accounts
   - Create Service Account: `cali-lights-veo`
   - Grant roles:
     - `Vertex AI User`
     - `Storage Object Viewer` (if using GCS)
   - Create JSON key → Download
4. Base64 encode credentials:
   ```bash
   # macOS/Linux
   cat service-account.json | base64 | pbcopy
   
   # Or use online tool: https://www.base64encode.org/
   ```
5. Add to `.env.local`:
   ```bash
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS_JSON=paste_base64_encoded_json_here
   VEO_MODEL_NAME=publishers/google/models/veo-3.0-generate
   ```
6. Test video generation:
   ```bash
   curl -X POST http://localhost:3000/api/video/generate \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "A beautiful sunset over mountains",
       "inputMediaUrls": ["https://example.com/image.jpg"],
       "aspectRatio": "9:16",
       "lengthSeconds": 8
     }'
   ```

**Files affected:**
- `lib/services/video.ts`
- `lib/google/auth.ts`
- `app/api/video/generate/route.ts`
- `app/api/video/status/route.ts`

**Cost:** ~$0.05-0.10 per 8-second video (varies by region/model)

**Note:** Without Veo, app will use collage fallback (first entry's image)

---

### 5. Vercel KV (OPTIONAL - For mission state caching)
**Priority:** 🟡 MEDIUM  
**Time:** 10 minutes  
**Status:** ⚠️ Not configured  
**Fallback:** Works without it (uses database)

**Steps:**
1. Go to Vercel Dashboard → Your Project
2. Storage → Create Database → KV
3. Copy connection details:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
4. Add to `.env.local`:
   ```bash
   KV_URL=your_kv_url
   KV_REST_API_URL=your_kv_rest_url
   KV_REST_API_TOKEN=your_kv_token
   ```

**Files affected:**
- `lib/kv.ts`
- Used for mission state caching (optional optimization)

**Cost:** Free tier: 256MB storage, then $0.20/GB/month

---

### 6. Ably (OPTIONAL - For realtime presence)
**Priority:** 🟡 MEDIUM  
**Time:** 10 minutes  
**Status:** ⚠️ Not configured  
**Fallback:** Works without it (no live presence)

**Steps:**
1. Sign up at https://ably.com (free tier available)
2. Create new app: `cali-lights`
3. Copy API Key from dashboard
4. Add to `.env.local`:
   ```bash
   ABLY_API_KEY=your_ably_api_key
   NEXT_PUBLIC_ABLY_CLIENT_ID=your_client_id
   ```
5. Test realtime:
   - Join a mission lobby
   - Should see live presence updates

**Files affected:**
- `lib/realtime.ts`
- `lib/hooks/useMissionRealtime.ts`
- `components/missions/MissionLobby.tsx`

**Cost:** Free tier: 2M messages/month, then $0.25 per 1M messages

---

### 7. OneSignal (OPTIONAL - For push notifications)
**Priority:** 🟢 LOW  
**Time:** 20 minutes  
**Status:** ⚠️ Not configured  
**Fallback:** Works without it (no notifications)

**Steps:**
1. Sign up at https://onesignal.com (free tier available)
2. Create new app: `Cali Lights`
3. Choose platform: Web Push
4. Configure:
   - Site URL: `http://localhost:3000` (dev) or your production URL
   - Get App ID and API Key
5. Add to `.env.local`:
   ```bash
   ONESIGNAL_APP_ID=your_app_id
   ONESIGNAL_API_KEY=your_api_key
   ```
6. Test notification:
   - Start a mission via admin
   - Should receive push notification

**Files affected:**
- `lib/services/notifications.ts`
- `app/api/mission/start/route.ts`

**Cost:** Free tier: 10,000 subscribers, unlimited notifications

---

### 8. Mapbox (OPTIONAL - For gallery map view)
**Priority:** 🟢 LOW  
**Time:** 5 minutes  
**Status:** ⚠️ Not configured  
**Fallback:** Map view disabled without it

**Steps:**
1. Sign up at https://mapbox.com (free tier available)
2. Get access token from Account → Tokens
3. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
   ```

**Files affected:**
- `components/gallery/GalleryMapView.tsx`

**Cost:** Free tier: 50,000 map loads/month

---

## 🟢 PRIORITY 3: MISSING FEATURES & ENHANCEMENTS

### 9. Automatic Metadata Extraction on Entry Commit
**Priority:** 🟡 MEDIUM  
**Status:** ⚠️ Not implemented

**Current:** Metadata extraction is manual via `/api/metadata/analyse`  
**Needed:** Auto-trigger on `entry/commit`

**Implementation:**
- [ ] Modify `app/api/entry/commit/route.ts`
- [ ] After successful entry commit, call `/api/metadata/analyse`
- [ ] Update entry record with metadata
- [ ] Handle errors gracefully (don't fail entry commit if metadata fails)

**Files to modify:**
- `app/api/entry/commit/route.ts`
- `lib/data/entries.ts`

---

### 10. Video Status Polling & Auto-Update
**Priority:** 🟡 MEDIUM  
**Status:** ⚠️ Partially implemented

**Current:** Manual polling via `/api/video/status`  
**Needed:** Automatic polling and chapter update

**Implementation:**
- [ ] Create background job or API route for polling
- [ ] Poll `/api/video/status` every 10-30 seconds
- [ ] Update chapter when video is ready
- [ ] Notify users when video is complete
- [ ] Handle timeout (max 5 minutes)

**Files to create/modify:**
- `app/api/video/poll/route.ts` (new)
- `lib/services/video.ts` (enhance)
- `app/api/mission/recap/route.ts` (enhance)

---

### 11. Bridge Detection Logic
**Priority:** 🟢 LOW  
**Status:** ⚠️ Not implemented

**Current:** Connections are manual  
**Needed:** Auto-detect bridges between chains based on metadata

**Implementation:**
- [ ] Create `lib/services/bridge.ts` (exists but needs logic)
- [ ] Compare palette hues between chains
- [ ] Compare scene_tags and object_tags
- [ ] Create connection if similarity threshold met
- [ ] Trigger on chapter completion

**Files to modify:**
- `lib/services/bridge.ts`
- `app/api/mission/recap/route.ts` (add bridge detection)

---

### 12. Daily Mission Scheduling
**Priority:** 🟢 LOW  
**Status:** ⚠️ Not implemented

**Current:** Manual mission start via admin  
**Needed:** Automatic daily missions

**Implementation:**
- [ ] Create Vercel Cron job or external scheduler
- [ ] Use KV store to store schedule config
- [ ] API endpoint: `POST /api/admin/schedule`
- [ ] Cron job calls `/api/mission/start` at scheduled time
- [ ] Support different schedules per chain

**Files to create:**
- `app/api/admin/schedule/route.ts` (exists, needs enhancement)
- `vercel.json` (add cron config)

---

### 13. Gallery Filters & Search
**Priority:** 🟡 MEDIUM  
**Status:** ⚠️ Partially implemented

**Current:** Basic gallery view  
**Needed:** Full filtering by hue, tags, person, date

**Implementation:**
- [ ] Enhance `app/api/gallery/media/route.ts` filters
- [ ] Add hue bucket filtering (30° buckets)
- [ ] Add tag-based filtering
- [ ] Add person/user filtering
- [ ] Add date range filtering
- [ ] Update `components/gallery/GalleryShell.tsx` UI

**Files to modify:**
- `app/api/gallery/media/route.ts`
- `components/gallery/GalleryShell.tsx`
- `app/api/search/route.ts` (enhance)

---

### 14. Chapter Sharing & Signed URLs
**Priority:** 🟡 MEDIUM  
**Status:** ⚠️ Partially implemented

**Current:** Basic share toggle  
**Needed:** Proper signed URLs with expiration

**Implementation:**
- [ ] Generate signed URLs for shareable chapters
- [ ] Set expiration (e.g., 7 days)
- [ ] Create public chapter view page
- [ ] Handle expired links gracefully

**Files to modify:**
- `app/api/chapter/share/route.ts`
- Create `app/chapter/[chapterId]/public/page.tsx` (new)

---

### 15. Analytics Dashboard
**Priority:** 🟢 LOW  
**Status:** ⚠️ Partially implemented

**Current:** Basic analytics endpoint  
**Needed:** Full admin dashboard with charts

**Implementation:**
- [ ] Enhance `app/api/admin/analytics/route.ts`
- [ ] Add mission completion rate
- [ ] Add average time to complete
- [ ] Add streak tracking
- [ ] Add palette distribution charts
- [ ] Add Veo cost tracking
- [ ] Update `components/admin/AnalyticsBoard.tsx`

**Files to modify:**
- `app/api/admin/analytics/route.ts`
- `components/admin/AnalyticsBoard.tsx`

---

## 🧪 PRIORITY 4: TESTING & QA

### 16. End-to-End Testing
**Priority:** 🟡 MEDIUM  
**Status:** ⚠️ Script exists, needs verification

**Test Flow:**
- [ ] Start mission
- [ ] Join mission (3 users)
- [ ] Upload entries (3 photos)
- [ ] Verify metadata extraction
- [ ] Generate chapter recap
- [ ] Verify video generation (or collage fallback)
- [ ] Check gallery display
- [ ] Test sharing

**Files:**
- `scripts/test-e2e.ts` (exists, run and verify)

---

### 17. Unit Tests
**Priority:** 🟢 LOW  
**Status:** ⚠️ Not implemented

**Needed:**
- [ ] API endpoint tests
- [ ] Data layer tests
- [ ] Service tests (metadata, video, bridge)
- [ ] Component tests (critical flows)

**Setup:**
- [ ] Install Jest/Vitest
- [ ] Create test structure
- [ ] Write tests for critical paths

---

### 18. Load Testing
**Priority:** 🟢 LOW  
**Status:** ⚠️ Not implemented

**Test:**
- [ ] 3 simultaneous users per mission
- [ ] Multiple missions running
- [ ] Gallery with 100+ entries
- [ ] Realtime presence updates

---

## 🚀 PRIORITY 5: DEPLOYMENT

### 19. Production Environment Setup
**Priority:** 🟡 MEDIUM  
**Status:** ⚠️ Not configured

**Steps:**
- [ ] Set up Vercel project
- [ ] Configure production environment variables
- [ ] Set up production database (Vercel Postgres)
- [ ] Configure production Cloudinary account
- [ ] Set up production Google Cloud project
- [ ] Configure custom domain
- [ ] Set up SSL certificates

---

### 20. CI/CD Pipeline
**Priority:** 🟢 LOW  
**Status:** ⚠️ Not configured

**Setup:**
- [ ] GitHub Actions or Vercel Git integration
- [ ] Automated tests on PR
- [ ] Automated deployment on merge
- [ ] Environment variable management

---

### 21. Monitoring & Logging
**Priority:** 🟢 LOW  
**Status:** ⚠️ Not configured

**Setup:**
- [ ] Error tracking (Sentry or similar)
- [ ] Performance monitoring
- [ ] Log aggregation
- [ ] Alerts for critical errors

---

## 📋 QUICK START CHECKLIST

### Minimum Viable Setup (Basic Functionality)
1. ✅ PostgreSQL database configured
2. ⚠️ **Cloudinary** - REQUIRED for uploads
3. ⚠️ **Google Vision API** - REQUIRED for metadata
4. ✅ User authentication working
5. ✅ Front-end components ready

**Time to MVP:** ~30 minutes

### Full Feature Setup (All Cool Features)
1. ✅ Minimum viable setup
2. ⚠️ **Veo API** - For video generation
3. ⚠️ **Vercel KV** - For caching
4. ⚠️ **Ably** - For realtime presence
5. ⚠️ **OneSignal** - For notifications
6. ⚠️ **Mapbox** - For map view

**Time to Full Setup:** ~2 hours

---

## 🎯 CURRENT STATUS SUMMARY

### ✅ What Works Right Now
- Database schema and migrations
- User authentication
- Chain creation and management
- Mission flow UI (all states)
- Gallery view (basic)
- Network/Orbit map visualization
- Admin panel structure
- Mobile-responsive design
- Sample data seeding

### ⚠️ What Needs Configuration
- **Cloudinary** (blocks uploads)
- **Google Vision API** (blocks metadata)
- **Veo API** (optional, uses collage fallback)
- **Vercel KV** (optional, uses database)
- **Ably** (optional, no realtime)
- **OneSignal** (optional, no notifications)
- **Mapbox** (optional, map disabled)

### 🔨 What Needs Implementation
- Automatic metadata extraction
- Video status polling
- Bridge detection logic
- Daily mission scheduling
- Enhanced gallery filters
- Chapter sharing with signed URLs
- Full analytics dashboard
- Testing suite

---

## 📝 NEXT STEPS (Recommended Order)

1. **Set up Cloudinary** (15 min) - Unblocks image uploads
2. **Set up Google Vision API** (20 min) - Enables metadata extraction
3. **Test complete mission flow** (30 min) - Verify everything works
4. **Set up Veo API** (45 min) - Enable video generation
5. **Set up Ably** (10 min) - Enable realtime presence
6. **Implement auto metadata extraction** (1 hour) - Improve UX
7. **Implement video polling** (1 hour) - Auto-update chapters
8. **Deploy to production** (2 hours) - Make it live

---

## 💰 ESTIMATED COSTS (Monthly)

### Free Tier (MVP)
- Cloudinary: Free (25GB storage, 25GB bandwidth)
- Google Vision: Free (1,000 requests/month)
- PostgreSQL: Free (Vercel Postgres free tier)
- **Total: $0/month**

### With All Features
- Cloudinary: Free tier
- Google Vision: ~$5-10/month (assuming 5,000 requests)
- Veo: ~$10-20/month (assuming 200 videos)
- Vercel KV: Free tier
- Ably: Free tier
- OneSignal: Free tier
- Mapbox: Free tier
- **Total: ~$15-30/month**

---

## 🆘 TROUBLESHOOTING

### Common Issues

**1. Image upload fails**
- Check Cloudinary credentials
- Verify upload preset is unsigned
- Check CORS settings

**2. Metadata extraction fails**
- Verify Google Vision API key
- Check API is enabled
- Verify image URL is accessible

**3. Video generation fails**
- Check Veo access is approved
- Verify service account permissions
- Check base64 encoding of credentials
- App will use collage fallback automatically

**4. Realtime not working**
- Check Ably API key
- Verify client ID is set
- Check browser console for errors

---

**Last Updated:** December 2024  
**Maintained by:** Development Team

