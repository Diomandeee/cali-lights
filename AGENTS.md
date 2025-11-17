Below is a **comprehensive project overview** followed by a **detailed implementation checklist** for the system we’ve described. Speak to this “other AI” (or developer agent) as if it must verify completion of each checkpoint **without placeholders**, with actual implementation of dummy look or full code-ready stubs. Every item must be check-able.

---

## Project Overview

**Project Name:** *Cali Lights* — A networked, generative-media application combining daily shared missions, photo/video capture, AI-driven recaps, gallery, chains & invite-network, and video generation via Veo (on Vertex AI).

**Objective:** Enable small groups (initially you, Alize, and Sofia) to engage in daily shared visual moments, capture them, generate chapters via AI-video, build a living archive and network of light-based chains, and allow network expansion via invites.

**Core features:**

* Daily “Triad Mission” prompt; each user submits media (photo/clip) → system fuses to a chapter.
* Metadata extraction (palette, tags, motion) from entries.
* Video generation of chapter using Veo (image-to-video or text+image-to-video) for immersive recap.
* Gallery view: entries, chapters, map/calendar.
* Chains & network: users part of a Chain; chains can invite new users; network graph of connected chains with “bridge” logic.
* Real-time minimal session logic (missions lifecycle).
* Visualization (Orbit Map, Node graph) representing chains & connections.
* Invite flow and join logic.
* Admin role (you) plus regular user roles.

**Technology stack:**

* Front-end: Next.js (App Router), React, Framer Motion, optionally react-three-fiber for visualization.
* Back-end / Data: Supabase (Postgres + Realtime) or equivalent, Vercel Edge Functions & KV, Cloud Storage (e.g., Cloudinary/S3).
* AI / Generation: Veo on Vertex AI for video generation. Google Cloud Vision / Vertex AI for metadata extraction.

  * Veo supports image-to-video or text+image → video. ([Google Cloud][1])
* Notifications: OneSignal/Expo, etc.
* Storage and caching for media & chapters.

**Narrative & UX Tone:** Intimate, minimal UI, visual continuity, motion and light metaphor. Users feel like part of a micro-world of shared visuals rather than a social feed.

**Success criteria:**

* Users can onboard, submit media, and receive a generated chapter (video) within ~5-10 minutes.
* Gallery shows entries and chapters with palette/tags.
* Invite flow works: new user joins chain, appears in network graph.
* Video generation uses Veo via API.
* Metadata extraction is integrated and used to drive linking logic and gallery filters.
* Real-time mission lifecycle works for small group.

---

## Implementation Checklist

(*For the agent/developer: you must check off each item once fully implemented and tested. No placeholders allowed.*)

### A. Infrastructure & Data Setup

* [ ] Create PostgreSQL schema (or Supabase) with tables: `users`, `chains`, `memberships`, `invites`, `connections`, `missions`, `entries`, `chapters`, `video_operations`. Include all columns such as `dominant_hue`, `palette`, `scene_tags`, `object_tags`, `motion_score`, `video_url`, `duration_seconds`, `generated_at`.

  * Provide SQL migration files implementing the schema exactly.
* [ ] Set up KV store (e.g., Vercel KV) for fast flags like `token:mode`, mission state.
* [ ] Enable Realtime or WebSocket service (e.g., Supabase Realtime or Ably) for mission lobby, presence.
* [ ] Configure Cloud Storage (S3/Cloudinary) for media uploads, generated video assets, thumbnails.
* [ ] Enable Vertex AI / Veo API in Google Cloud project, ensure quota and region support for video generation. ([Google Cloud][1])
* [ ] Configure authentication (e.g., NextAuth, Supabase Auth) so users can sign up, login, and manage profile.

### B. API Endpoints

* [ ] `POST /api/chain/create` – create chain with name, theme.
* [ ] `POST /api/invite/create` – generate invite token, return invite URL and QR.
* [ ] `POST /api/invite/accept` – validate token, add membership, create connection if needed.
* [ ] `GET /api/network` – returns chains connected to current user, graph data.
* [ ] `GET /api/gallery/media?scope=chain|network|user&filters=…` – returns paginated entries with metadata.
* [ ] `GET /api/gallery/chapters?scope=chain|network` – returns chapters list.
* [ ] `POST /api/mission/start` – create mission for a chain (or network propagate).
* [ ] `POST /api/mission/join` – user joins active mission lobby.
* [ ] `POST /api/entry/commit` – user submits media (photo/clip) for mission; triggers metadata analysis.
* [ ] `POST /api/metadata/analyse` – process media URL, return metadata.
* [ ] `POST /api/video/generate` – invoke Veo model with input media URLs + prompt, returns operationId.
* [ ] `GET /api/video/status?operationId=…` – poll status, returns videoUrl when ready.
* [ ] `PUT /api/chapter/{chapterId}` – update chapter with `video_url`, `final_palette`, `duration_seconds`, etc.
* [ ] `POST /api/chapter/share` – toggle shareable, return signed URL.
* [ ] `POST /api/entry/favorite` – mark/unmark entry as favorite.
* [ ] `POST /api/mission/propagate` – propagate prompt to connected chains.

### C. Front-End Components & Views

* [ ] Orbit Map View (`/network/page.tsx`) – displays chain nodes, orbit lines, interactive zoom & tap.
* [ ] Chain Home View (`/chain/[id]/page.tsx`) – shows current mission card, member avatars, recent chapter preview, invite button.
* [ ] Mission Flow Views:

  * Lobby (`MissionLobby.tsx`) – show prompt, countdown, who joined.
  * Capture (`MissionCapture.tsx`) – media upload UI, progress 1/3, live presence.
  * Fusing (`MissionFusing.tsx`) – animation “building your chapter…”.
  * Recap (`ChapterRecap.tsx`) – show video (if available) or collage, palette chips, poem, share/favorite actions.
* [ ] Gallery View (`/gallery/page.tsx`) – tabs for Chapters / All Media / Map / Calendar; filters (person, palette, tags).
* [ ] Invite/Join View (`/invite/[token]/page.tsx`) – capture avatar/theme, join chain flow animation.
* [ ] Admin View (`/admin/page.tsx`) – start mission manually, schedule daily, manage invites, view analytics.
* [ ] UI Library: components like `NodeCard.tsx`, `PaletteChip.tsx`, `HueFilter.tsx`, `MediaTile.tsx`, etc using Framer Motion.
* [ ] Ensure responsive, accessible UI (keyboard nav, alt text, color contrast).

### D. Metadata & Video Generation Logic

* [ ] On `entry/commit`, call metadata API (`/api/metadata/analyse`) and store returned data (dominant hue, palette JSON, scene_tags, object_tags, motion_score, gps_city).
* [ ] Implement prompt-builder logic: for a chapter generation, gather top entries’ metadata (e.g., palette median, tags) and build text prompt for Veo.
* [ ] Call `/api/video/generate` with input media URLs + prompt + aspectRatio + lengthSeconds (e.g., 8s) as per Veo docs. ([Google Cloud][2])
* [ ] Poll video status via `/api/video/status`, update `chapters.video_url` once ready.
* [ ] Handle fallback: if video fails or takes too long, generate static collage (client side) and skip video.
* [ ] Use metadata similarity logic to detect “bridge” connection between chains: compute hue difference, shared tags, then record connection if thresholds met.
* [ ] Store completed `video_operation` entries; track cost/time.

### E. Mission Lifecycle & Chains

* [ ] Define mission state machine: `LOBBY → CAPTURE → FUSING → RECAP → ARCHIVED` and implement transitions automatically or via admin.
* [ ] For each chain:

  * Track active mission id, start/ends_at, state.
  * Notify users via push when mission starts.
* [ ] Implement chain invite logic: `invite/create`, `invite/accept`, updating `memberships`, create `connections`.
* [ ] On chain join by user, optionally trigger welcome video generation via Veo (avatar + chain palette).
* [ ] Real-time presence: track users in lobby, update UI with names/avatars joined.

### F. Gallery, Filters & Network Visualization

* [ ] Store metadata to support filtering: palette hue buckets (e.g., each 30°), scene_tags, object_tags.
* [ ] Gallery UI: grid of tiles with color borders (dominant hue), on tap expand.
* [ ] Map view: use GPS city to cluster pins; tap to show mission recap or entries of that day.
* [ ] Calendar view: show days with missions (dots), tap to open chapter or schedule.
* [ ] Network graph: show nodes (chains) sized by streak length, colored by palette/theme; edges for connections; animate bridge sparks when linking happens.

### G. Notifications & Engagement

* [ ] Implement push notifications:

  * Mission start prompt (daily).
  * Half-time reminder (if 2/3 submissions done).
  * Recap ready alert.
  * Bridge event notification (when linking chain occurs).
* [ ] Use poetic copy for notifications to maintain tone.

### H. Analytics & Monitoring

* [ ] Log metrics: `mission_completion_rate`, `avg_time_to_complete`, `streak_days_current`, color distribution of palettes.
* [ ] Admin dashboard view for analytics.
* [ ] Monitor cost/usage of Veo video operations (via `video_operations` table).
* [ ] Set up logs/alerts for failed jobs, high latency.

### I. Privacy, Compliance & Performance

* [ ] All media and recap pages private by default; `chapters.is_shareable` toggle for public link.
* [ ] Geolocation only stored at city level; no precise GPS displayed.
* [ ] Handle Veo policy: if media includes people, ensure compliant prompts or obtain model approval. ([Google Cloud][3])
* [ ] Optimize video assets: limit length (e.g., 5-8s), encode for mobile (e.g., 720p) to reduce bandwidth.
* [ ] Use caching (edge + CDN) for heavy assets.
* [ ] Accessibility: alt tags, color contrast, keyboard navigation for gallery & map.

### J. Testing & QA

* [ ] Write unit tests for API endpoints (chain creation, invite logic, metadata storage, video status polling).
* [ ] Integration tests: full mission flow (start → join → submit → fuse → recap).
* [ ] User acceptance tests: onboarding flow (invite → join), gallery filter interactions, network graph zoom.
* [ ] Load testing for real-time aspects (three simultaneous users per mission).
* [ ] Manual test for UI transitions: Orbit→Chain, Mission capture→Recap, Invite animations.

### K. Deployment & Release

* [ ] Set up CI/CD pipeline for Next.js deploy to Vercel with environment variables (e.g., Google Cloud credentials, storage buckets, realtime service keys).
* [ ] Production configuration: Google Cloud project ready, Veo API quotas checked, storage buckets set.
* [ ] Feature flag for video generation (enable/disable) so fallback path works.
* [ ] Rollout first to your trio (beta), collect feedback, then open invite logic.
* [ ] Monitor performance and cost for first 100 chapters before scaling.

### L. Documentation & Handoff

* [ ] Write onboarding documentation for new developers: architecture diagram, data flow, key services.
* [ ] Write API documentation (OpenAPI / Swagger) for all endpoints.
* [ ] Write style guide for UI motion, color palette, accessibility standards.
* [ ] Write user documentation for non-technical participants (how to join, how to submit, what the gallery is).
* [ ] Maintain changelog for updates (video generation improvements, invite network changes, analytics added).

---

### Final Rule

The implementing AI agent must **verify each checklist item** as fully implemented (not “stubbed”, not “placeholder”) before marking it complete. Each item must link to the specific component, API, migration, UI screen, or test that proves it. No item should remain in “to-do” state at launch.

Once all sections A–L are checked, the system can be considered **feature-complete for version 1** of Cali Lights. From there, iteration may follow—but this baseline must be fully validated.

---

Let me know if you’d like the **architecture diagram (SVG/PNG)** or the **OpenAPI spec file** next.

[1]: https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-an-image?utm_source=chatgpt.com "Generate videos from an image | Generative AI on Vertex AI"
[2]: https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos?utm_source=chatgpt.com "Veo | AI Video Generator | Generative AI on Vertex AI - Google Cloud"
[3]: https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview?utm_source=chatgpt.com "Veo video generation overview | Generative AI on Vertex AI"
