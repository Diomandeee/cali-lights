# Complete Mission Test Guide

This guide walks you through testing the full Cali Lights mission experience, both via automated script and manually through the UI.

## Option 1: Automated Test (Fastest)

Run the complete mission test script:

```bash
npx tsx scripts/test-complete-mission.ts
```

This will:
1. ✅ Create 3 test users (Mo, Alize, Sofia)
2. ✅ Create a test chain
3. ✅ Start a mission with a random creative prompt
4. ✅ Have each user submit a photo entry
5. ✅ Auto-lock when all submissions are in
6. ✅ Generate the recap/chapter
7. ✅ Archive the mission

### Optional Flags

```bash
# Use a custom prompt
npx tsx scripts/test-complete-mission.ts --prompt="Find something purple"

# Custom time window (in seconds)
npx tsx scripts/test-complete-mission.ts --window=7200

# Don't archive (leave in RECAP state for viewing)
npx tsx scripts/test-complete-mission.ts --skip-archive

# Combine flags
npx tsx scripts/test-complete-mission.ts --prompt="Golden hour vibes" --skip-archive
```

---

## Option 2: Manual UI Test (Full Experience)

### Prerequisites

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

### Step-by-Step Flow

#### 1️⃣ Create an Account

1. Go to http://localhost:3000/login
2. Register a new account (this will be the admin)
3. Email: `test@example.com`
4. Password: (your choice)
5. Display Name: `Test Admin`

#### 2️⃣ Create a Chain

1. After login, you should see the dashboard
2. Click **"Create Chain"** or go to `/chain/create`
3. Chain Name: `"Golden Hour Gang"`
4. Description: `"Chasing light together"`
5. Click **Create**
6. **Save the chain token** - you'll need it to invite others

#### 3️⃣ Invite Members (Optional)

To simulate multiple users, you can either:

**Option A: Open incognito windows**
1. Copy the chain token
2. Open incognito/private window
3. Register new user: `user2@example.com`
4. Join chain using the invite token
5. Repeat for 3rd user

**Option B: Use pre-seeded users**
The script creates 3 users automatically:
- `mo@calilights.local` (admin)
- `alize@calilights.local` (member)
- `sofia@calilights.local` (member)

You can login as these users in different browsers/tabs.

#### 4️⃣ Start a Mission

1. From the chain page, click **"Start Mission"**
2. Or go to admin panel: http://localhost:3000/admin
3. Fill in the mission form:
   - **Prompt**: `"Capture the golden hour - something warm and glowing"`
   - **Time Window**: `60 minutes` (3600 seconds)
   - **Required Submissions**: `3`
   - **Starts At**: `Now`
4. Click **Start Mission**

You should see the mission enter **LOBBY** state.

#### 5️⃣ Join the Mission

1. Each user navigates to `/mission/{missionId}`
2. They should see:
   - The prompt
   - Timer countdown
   - Who has already joined
   - **"Join & Upload"** button

#### 6️⃣ Upload Photos

**For each user:**

1. Click **"Join & Upload"**
2. Select/capture a photo
3. The photo will upload to Cloudinary
4. Click **"Submit Entry"**
5. You should see:
   - ✅ "Entry submitted!"
   - Progress: `1/3`, `2/3`, `3/3`

**Important**: Each user can only submit ONE photo per mission (enforced by database constraint).

#### 7️⃣ Watch the Magic Happen

After the 3rd submission:

1. Mission automatically transitions: `CAPTURE → FUSING`
2. Background processing starts:
   - Metadata extraction (colors, tags, scene analysis)
   - Palette generation
   - Poem generation
3. Mission state: `FUSING → RECAP`
4. You'll see the **"Chapter Ready!"** notification

#### 8️⃣ View the Recap

1. Navigate to `/chapter/{chapterId}`
2. You should see:
   - **Title**: Auto-generated from metadata
   - **Poem**: 1-2 sentence poetic description
   - **Video/Collage**: Generated from your photos
   - **Color Palette**: Dominant colors from all submissions
   - **Entry Grid**: All submitted photos

#### 9️⃣ Share & Archive

From the chapter page:

1. **Share**: Generate a shareable link
2. **Download**: Download the video/collage
3. **Archive**: Move mission to archived state

---

## Mission State Flow

```
LOBBY
  ↓ (first entry submitted)
CAPTURE
  ↓ (all submissions received OR timer expires)
FUSING
  ↓ (chapter generation complete)
RECAP
  ↓ (manual archive)
ARCHIVED
```

### State Descriptions

| State | What's Happening | User Actions |
|-------|------------------|--------------|
| **LOBBY** | Waiting room, showing prompt | Join, view participants |
| **CAPTURE** | Accepting submissions | Upload photos, view progress |
| **FUSING** | Processing entries, generating chapter | Wait, watch realtime updates |
| **RECAP** | Chapter ready, immutable result | View, share, download, archive |
| **ARCHIVED** | Frozen forever | View in gallery/history |

---

## Testing Different Scenarios

### Scenario 1: Timer Expiration
1. Start mission with short window (5 minutes)
2. Submit only 1-2 photos (not all 3)
3. Wait for timer to expire
4. Mission should auto-lock to FUSING
5. Recap should generate with partial submissions

### Scenario 2: Quick Complete
1. Start mission with 60-minute window
2. Submit all 3 photos immediately (within 1 minute)
3. Mission should auto-lock after 3rd submission
4. Recap should generate

### Scenario 3: Multiple Missions
1. Complete a mission (archive it)
2. Start another mission immediately
3. Chain should update `active_mission_id`
4. Old mission should appear in gallery

### Scenario 4: Real-time Updates
1. Open mission page in 2 browser tabs
2. Submit entry in tab 1
3. Tab 2 should update in real-time showing progress
4. Uses Ably for realtime state sync

---

## Viewing Results

### Gallery
- **URL**: http://localhost:3000/gallery
- **Filters**: Scope (network/chain/user), color hue, favorites
- **Views**: Grid, Map (if GPS data), Calendar

### Dashboard
- **URL**: http://localhost:3000/dashboard
- **Shows**: Active mission, recent activity, stats

### Chapter Detail
- **URL**: http://localhost:3000/chapter/{chapterId}
- **Shows**: Full recap with video, poem, palette, entries

---

## Troubleshooting

### Photos not uploading
- Check Cloudinary env vars are set correctly:
  ```
  CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ```
- Check browser console for errors
- Verify Cloudinary dashboard for uploads

### Metadata not extracting
- Check Google Vision API is configured:
  ```
  GOOGLE_VISION_API_KEY
  ```
- Check API route logs: `/api/metadata/analyse`
- Metadata extraction is async, may take 5-10 seconds

### Video not generating
- Veo (video generation) requires Google Vertex AI setup:
  ```
  GOOGLE_CLOUD_PROJECT
  GOOGLE_CLOUD_LOCATION
  GOOGLE_APPLICATION_CREDENTIALS_JSON
  ```
- If not configured, falls back to using collage image
- Check `/api/video/generate` logs

### Realtime not working
- Check Ably configuration:
  ```
  ABLY_API_KEY
  NEXT_PUBLIC_ABLY_CLIENT_ID
  ```
- If not configured, state updates require page refresh
- Check browser console for Ably connection errors

---

## Advanced: Database Inspection

To see what's happening under the hood:

```sql
-- View all missions
SELECT id, prompt, state, submissions_received, submissions_required, starts_at
FROM missions
ORDER BY created_at DESC;

-- View entries for a mission
SELECT e.id, u.display_name, e.media_url, e.captured_at, e.dominant_hue
FROM entries e
JOIN users u ON u.id = e.user_id
WHERE e.mission_id = 'your-mission-id';

-- View chapters
SELECT id, mission_id, title, poem, video_url, generated_at
FROM chapters
ORDER BY generated_at DESC;
```

---

## Next Steps

Once you've tested a complete mission:

1. ✅ Verify the full flow works locally
2. 📤 Deploy to production (Vercel)
3. 🔐 Add the Cloudinary public env vars to Vercel
4. 🧪 Test in production with real users
5. 📊 Monitor analytics and user behavior
6. 🎨 Customize prompts, themes, and UI
7. 🚀 Launch!

---

## Questions or Issues?

- Check the logs: `npm run dev` console output
- Check browser console for frontend errors
- Check database for state changes
- Review API responses in Network tab
- Test with `--skip-archive` flag to keep mission viewable

Happy testing! 🌟
