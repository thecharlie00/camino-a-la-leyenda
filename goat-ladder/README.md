# GOAT LADDER

GOAT LADDER is an optional shared ranking for the browser game and Android WebView. Both clients read the same public rankings for complete player/manager career runs and individual achievements; the app opens on careers and lets players switch between career and achievement boards. A career snapshot contains aggregate metrics and a sanitized season-by-season history, never the raw save file. Nothing is uploaded until the user enters a public alias, reviews the disclosure, accepts it and presses **Publish complete career**.

## Deploy the API

The API is a Cloudflare Worker backed by D1. It is not deployed by the GitHub Pages workflow.

1. Install/authenticate Wrangler with a Cloudflare account, then create the database:

   ```powershell
   npx wrangler d1 create camino-goat-ladder
   ```

2. Copy the returned database ID into `goat-ladder/wrangler.toml`, then apply both schemas and deploy:

   ```powershell
   npx wrangler d1 execute camino-goat-ladder --file=goat-ladder/migrations/0001_create_entries.sql
   npx wrangler d1 execute camino-goat-ladder --file=goat-ladder/migrations/0002_create_careers.sql
   npx wrangler deploy --config goat-ladder/wrangler.toml
   ```

   For an existing deployment that already has the achievements table, apply only the new migration before deploying the updated Worker:

   ```powershell
   npx wrangler d1 execute camino-goat-ladder --file=goat-ladder/migrations/0002_create_careers.sql
   npx wrangler deploy --config goat-ladder/wrangler.toml
   ```

3. Set `ALLOWED_ORIGINS` in `goat-ladder/wrangler.toml` to the exact origins that will use the API. Keep `null` for the Android `file://` WebView origin. The default includes the custom domain, GitHub Pages and `null`.

4. Set `goat_api_url` in `web/config.json` to the deployed Worker origin (for example, `https://camino-goat-ladder.<account>.workers.dev`), then rebuild the game and website. The same setting must be used when building Android assets. `CAMINO_GOAT_API_URL` can override the config for a build. It must be an HTTPS origin without a path.

Until an API origin is configured, the GOAT LADDER screen clearly reports that the global service is unavailable; local play continues to work. Setting the origin also adds that exact origin to the generated game's `connect-src` CSP. Do not loosen the rest of the policy.

## API

- `GET /api/goat-ladder?mode=player|manager&timeframe=all-time|30d|7d` returns up to 50 public records.
- `POST /api/goat-ladder` validates a record, computes the score server-side and returns its ID plus a one-time deletion token.
- `DELETE /api/goat-ladder?id=<entry-id>` accepts that token as a Bearer credential and removes the record. The client stores the token locally on the publishing device; clearing app/site data before deleting an entry loses the token.

`GET /api/goat-ladder/careers?mode=player|manager&metric=<metric>&timeframe=all-time|30d|7d` returns up to 50 career snapshots ranked by a mode-specific allowlisted metric. `POST /api/goat-ladder/careers` creates or updates a snapshot for that save; republishing replaces the prior snapshot and its deletion token. `DELETE /api/goat-ladder/careers?id=<career-id>` removes one with its one-time deletion token.

Player career rankings can be ordered by appearances, goals, assists, clean sheets, trophies, awards, international caps/goals, clubs or seasons. Manager rankings can be ordered by wins, draws, losses, trophies, unbeaten seasons, promotions, win percentage, clubs or seasons. The public history includes season, club(s), competition, season statistics and trophies/awards; the alias is the only user-provided identity field.

The Worker validates lengths, types, ranges and event requirements, uses prepared D1 statements, scopes cross-origin access, rate-limits reads/submissions and deduplicates submissions per hashed career/event key. Monitor the Worker and D1 usage after deployment. The client has no account or authoritative match server: players can alter their local save or forge a submission. Scores and career metrics are client-reported; records are visibly marked **community-reported / unverified**. This implementation is not an anti-cheat system.

## Scoring

Every score is capped at 1,000. Match score components are returned as a breakdown:

- **Player match:** rating (0–250), goals/assists (0–150), minutes (0–100), opponent strength (0–150), match importance/final (0–200), comeback/final/late-winner moment (0–130), and result (0–50).
- **Manager match:** win/draw (0–220), margin (0–60), clean sheet (0–25), minutes (100), opponent strength (0–150), importance/final (0–200), comeback/final/late-winner moment (0–130), and result (0–50).
- **Manager season:** win rate (0–300), unbeaten season (120), division/team-strength challenge (0–250), goal difference (0–100), trophies (0–240), and league title (180).

The game currently does not generate possession, xG or key passes. Those schema fields remain nullable and are not fabricated in client submissions. `test/goat.js` checks input validation, score boundaries, CORS, and create/delete API behavior.
