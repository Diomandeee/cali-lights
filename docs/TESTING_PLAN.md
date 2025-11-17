# Testing Plan

## Unit Tests (Vitest/Jest)

| Area | Files | Notes |
| --- | --- | --- |
| Prompt builder | `packages/lib/src/prompt.ts` | Validate hue bucket + tag concatenation. |
| Hue math | `packages/lib/src/color.ts` | Circular mean edge cases (wrap-around). |
| Chain data helpers | `lib/data/chains.ts` | Mock `@vercel/postgres` to ensure inserts enforce uniqueness (use Jest mocks). |
| Mission service | `lib/data/missions.ts` | Validate state transitions, submission increments. |

Run (after adding Vitest config):

```bash
npm run test
```

## Integration Tests (Jest + Supertest)

1. **Auth + chain creation**  
   - Register user → token cookie  
   - `POST /api/chain/create` (auth header) → membership inserted
2. **Mission flow**  
   - Start mission  
   - Submit entry (mock Cloudinary URL)  
   - Run metadata endpoint (mock Vision JSON)  
   - Trigger recap (mock Veo)  
   - Poll video status (mock Veo response)  
   - Archive mission  
   - Assert chapter + mission states.
3. **Invite bridge**  
   - Chain A invites user (token)  
   - User already in Chain B; accept invite → connections table has both edges.

Use `NODE_ENV=test` with transaction rollbacks per test.

## Playwright (E2E)

Scenarios:

1. Login flow → `/network` → `/chain/:id` → `/gallery`
2. Admin start mission → Mission card shows new prompt.
3. Invite acceptance (simulate logged-in user) → redirected to `/network`.
4. Gallery filters (hue slider, favorites) update grid.

Run:

```bash
npx playwright test
```

## Load / Realtime (Future)

- Ably presence: simulate 3 clients joining same mission channel; assert presence updates.
- Mission scheduler: call cron endpoint repeatedly; ensure no duplicate missions created.

## Coverage Targets

- Unit: 80%
- Integration: cover mission flow + invite logic
- Playwright: smoke tests for main nav

> Actual test files to be added under `tests/unit`, `tests/integration`, `tests/e2e`.
