# Cali Lights Architecture

## Overview

The system is a Next.js 14 application with server components and Vercel API routes. It combines:

1. **Auth + Chains:** Users register/login (password + API key). Chains group users via memberships.
2. **Triad Missions:** Each chain runs one mission at a time. Mission states: `LOBBY → CAPTURE → FUSING → RECAP → ARCHIVED`.
3. **Entries + Metadata:** Submissions stored in `entries`. Vision API enriches palette/tags/motion, used for gallery filters and bridge detection.
4. **Chapter Generation:** When capture completes, prompt builder (metadata-driven) calls Vertex AI Veo. Results stored in `chapters` + `video_operations`.
5. **Gallery & Orbit:** Users browse network (Orbit view), gallery (tabs, filters), chain dashboards, admin controls.

## Data Flow

```
users ─┬─ memberships ─ chains ─ active mission
       │
       └─ entries ─ metadata → missions → chapters → gallery
                                   │
                              video_operations
```

### Tables

| Table | Purpose |
| --- | --- |
| `users` | Auth, roles, notification preferences |
| `chains` | Group metadata (palette, streak) |
| `memberships` | User ↔ chain role | 
| `invites` | Tokenized join links (QR) |
| `connections` | Bridge graph edges |
| `missions` | Prompt/state/time window per chain |
| `entries` | User submissions + metadata |
| `chapters` | Mission recap (video/palette/share state) |
| `video_operations` | Veo job tracking |

### KV & Realtime

- `mission:schedule:{chainId}`: cron config
- `mission:{id}:countdown` (future): lobby timers
- Ably channel `mission:{id}` for presence + progress (WIP)

## Services

| File | Description |
| --- | --- |
| `lib/data/*.ts` | Typed SQL helpers per table |
| `lib/services/metadata.ts` | Vision API client |
| `lib/services/video.ts` | Vertex AI Veo client |
| `lib/services/notifications.ts` | OneSignal push wrappers |
| `lib/api-client.ts` | SSR-friendly fetch with bearer token |
| `lib/session.ts` | Cookie parsing + redirect helpers |

## Front-End Routes

- `/login`: Auth form, issues `cali_token`
- `(app)/layout`: Protected shell (nav + sign out)
- `/network`: Orbit map (R3F-friendly) showing chains + bridges
- `/chain/[id]`: Mission card, entries, latest chapter, invite CTA
- `/mission/[id]`: State-specific UI (Lobby/Capture/Fusing/Recap)
- `/gallery`: Tabs for media/chapters (map/calendar upcoming)
- `/admin`: Start mission, mint invite, configure schedule, see metrics
- `/invite/[token]`: Accept invite CTA (requires login)

## Mission Lifecycle

1. **Start**: `/api/mission/start` sets `LOBBY`, notifies trio, updates `chains.active_mission_id`.
2. **Join**: `/api/mission/join` returns upload info + presence.
3. **Commit**: `/api/entry/commit` upserts entry, increments count, triggers metadata job.
4. **Lock**: Timer or admin hits `/api/mission/lock` → state `FUSING`.
5. **Recap**: `/api/mission/recap` builds prompt + chapter record + Veo job.
6. **Video status**: `/api/video/status` polls Vertex, updates `chapters`, notifies trio.
7. **Archive**: `/api/mission/archive` finalizes mission, clears `active_mission_id`, updates streaks (future).

## Notifications

- `notifyMissionStart`: Fire when mission begins.
- `notifyRecapReady`: Fire when Veo job succeeds (once chapter updated).

Currently uses OneSignal REST (`ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY`). Extend to Expo/FCM if mobile.

## Deployment Notes

- Vercel project with Postgres + KV enabled.
- Google Cloud service account needs Vertex/Storage/Vision scopes.
- `npm run db:migrate` should run in build or migration pipeline.
- Monitor `video_operations` for cost/time; add alerting for `FAILED` status.
