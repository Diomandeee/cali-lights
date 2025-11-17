# 📅 Calendar & Location Features

**Created:** December 2024  
**Status:** ✅ Complete

---

## 🎉 New Features Added

### 1. Enhanced Mission Calendar ✅
**Route:** `/missions/calendar`

A comprehensive calendar view that shows:
- **Mission schedules** - When missions are scheduled to start
- **Start times** - Exact start times for each mission
- **End times** - When missions end
- **Mission states** - Visual indicators for LOBBY, CAPTURE, FUSING, RECAP, ARCHIVED
- **Daily mission details** - Click any date to see all missions for that day

**Features:**
- Color-coded indicators:
  - 🔵 Blue = Missions starting
  - 🟢 Green = Missions ending
  - 🟣 Purple = Scheduled missions
- Expandable date cards showing mission details
- Links to individual mission pages

**API:** `/api/missions/calendar`

---

### 2. Location-Based Recommendations ✅
**Component:** `LocationRecommendations`

Shows recommended missions based on:
- **City** - Filter by city name
- **Coordinates** - Filter by latitude/longitude with radius
- **Distance** - Shows distance from your location

**Features:**
- Real-time recommendations
- Distance calculations
- Mission state indicators
- Quick links to mission pages

**API:** `/api/missions/recommendations`

**Query Parameters:**
- `city` - Filter by city name (e.g., "New York")
- `lat` - Latitude for radius search
- `lon` - Longitude for radius search
- `radiusKm` - Search radius in kilometers (default: 50)
- `limit` - Max results (default: 10, max: 50)

---

### 3. New York City Map View ✅
**Component:** `NYCMapView`

Interactive map showing:
- **Mission markers** - All missions in NYC
- **Location pins** - Exact locations of missions
- **Mission details** - Click markers to see mission info
- **Mission links** - Quick access to mission pages

**Features:**
- Mapbox integration
- Animated markers
- Popup details on click
- Mission count display
- Centered on NYC (40.7831°N, 73.9712°W)

**Requirements:**
- `NEXT_PUBLIC_MAPBOX_TOKEN` environment variable

---

### 4. Pre-Populated NYC Missions ✅
**Script:** `npm run db:seed-nyc`

Creates a "NYC Lights" chain with:
- **10 NYC locations:**
  - Central Park
  - Brooklyn Bridge
  - Times Square
  - High Line
  - DUMBO
  - Williamsburg
  - SoHo
  - East Village
  - Greenwich Village
  - Chelsea

- **15 unique mission prompts:**
  - "Golden hour reflections on the Hudson"
  - "Neon signs after dark"
  - "Street art and murals"
  - And more...

- **Scheduled missions** - Spread over the next 30 days
- **Sample entries** - For completed missions

**Usage:**
```bash
npm run db:seed-nyc
```

---

## 📁 Files Created

### API Routes
- `app/api/missions/calendar/route.ts` - Calendar data endpoint
- `app/api/missions/recommendations/route.ts` - Location-based recommendations

### Components
- `components/missions/MissionCalendar.tsx` - Enhanced calendar component
- `components/missions/NYCMapView.tsx` - NYC map with mission markers
- `components/missions/LocationRecommendations.tsx` - Recommendations component

### Pages
- `app/(app)/missions/calendar/page.tsx` - Calendar page

### Scripts
- `scripts/seed-nyc-missions.ts` - NYC missions seed script

---

## 🚀 How to Use

### 1. Seed NYC Missions

```bash
npm run db:seed-nyc
```

This creates:
- A "NYC Lights" chain
- 10 missions at different NYC locations
- Missions scheduled over the next 30 days
- Sample entries for completed missions

### 2. View Calendar

Navigate to `/missions/calendar` to see:
- Monthly calendar view
- Mission schedules
- Click dates to see mission details

### 3. View NYC Map

The calendar page includes:
- Interactive NYC map
- Mission markers
- Location recommendations

### 4. Get Recommendations

Use the API or component:

```typescript
// In a component
<LocationRecommendations city="New York" />

// Or via API
fetch('/api/missions/recommendations?city=New York')
```

---

## 🎨 UI Features

### Calendar View
- **Visual indicators** - Color-coded mission states
- **Interactive dates** - Click to expand mission details
- **Mission cards** - Shows prompt, chain, times, submissions
- **State badges** - Color-coded mission states

### Map View
- **Animated markers** - Pulsing indicators for active missions
- **Popup details** - Click markers for mission info
- **Mission links** - Quick navigation to mission pages
- **Mission count** - Shows total missions in area

### Recommendations
- **Distance display** - Shows how far missions are
- **City filtering** - Filter by city name
- **State indicators** - Visual mission state badges
- **Quick links** - Direct links to mission pages

---

## 📊 Data Structure

### Calendar Day
```typescript
{
  day: "2024-12-15",
  completed: 2,
  total: 5,
  starting: 1,
  ending: 1,
  scheduled: 2,
  missions: [...]
}
```

### Mission (in calendar)
```typescript
{
  id: string;
  prompt: string;
  chain_name: string;
  state: "LOBBY" | "CAPTURE" | "FUSING" | "RECAP" | "ARCHIVED";
  starts_at: string;
  ends_at: string | null;
  submissions_received: number;
  submissions_required: number;
}
```

### Recommended Mission
```typescript
{
  id: string;
  prompt: string;
  chain_name: string;
  state: string;
  starts_at: string;
  ends_at: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  distance_km: number | null;
  submissions_received: number;
  submissions_required: number;
}
```

---

## 🔧 Configuration

### Required Environment Variables

```bash
# For map view
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Database (already configured)
POSTGRES_URL=your_postgres_url
```

### Mapbox Setup

1. Sign up at https://mapbox.com
2. Get your access token
3. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
   ```

---

## 🎯 Next Steps

### To Add More Cities

1. Create a new seed script (similar to `seed-nyc-missions.ts`)
2. Define locations and prompts
3. Run the seed script

### To Add Mission Scheduling UI

The calendar shows scheduled missions, but you can add:
- Date/time picker in mission start form
- Recurring mission schedules
- Mission templates

### To Enhance Map

- Add clustering for many markers
- Add filters (by state, date, etc.)
- Add route visualization
- Add heat maps

---

## 📝 Notes

- **Calendar** shows missions from all chains the user is a member of
- **Recommendations** filter by entries' GPS data (missions need entries to show location)
- **NYC Map** requires Mapbox token (gracefully degrades if missing)
- **Seed script** creates missions over 30 days with varied times

---

**Status:** All features implemented and ready to use! 🚀

