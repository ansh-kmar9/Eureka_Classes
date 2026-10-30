# Eureka Classes

An installable, mobile-first web app (PWA) for a coaching institute teaching classes 6 to 12.
Students, teachers and one admin each get their own side. English and Hindi, light and dark.

**Stack:** Next.js (App Router) and TypeScript, Tailwind CSS, Supabase (Postgres, Auth, row-level
security), Gemini for the AI features, Web Push, IndexedDB for offline practice tests.

## What it does

| Area | Features |
|---|---|
| **Students** | Google sign-in, required profile, locked until a teacher approves, dashboard (scores, rank, badges, progress), courses and study material (PDFs open inside the app), practice test series by board / class / subject / topic with AI analysis and offline download, strict scheduled tests, community, EurekaBot, Spoken English course |
| **Teachers** | Approve and block students, filters, announcements, courses and study material, practice-test catalog and MCQ import, scheduled tests with results, community moderation |
| **Admin** (`/admin`) | Choose teachers, read contact messages. Only the configured admin Google account can enter |

## Run it locally

```bash
npm install
cp .env.example .env.local     # then fill in the values (see below)
npm run dev                    # http://localhost:3000
```

Sign-in redirects to `http://localhost:3000`, so use that exact address (not `127.0.0.1`).

### Database

Run every file in `supabase/migrations/`, **in numeric order**, in the Supabase SQL Editor.
Each file can be run again safely.

| File | Adds |
|---|---|
| `0001_core.sql` | Profiles, roles, approvals, announcements, contact messages, push subscriptions |
| `0002_content.sql` | Courses, lessons, progress, study material |
| `0003_announcement_seen.sql` | "Unread" tracking for announcements |
| `0004_tests.sql` | First version of the test tables (replaced by 0005) |
| `0005_catalog_tests.sql` | Board (CBSE / BSEB), subject and topic catalog, practice tests, leaderboard |
| `0006_catalog_seed.sql` | Starting subjects and chapters (generated, see below) |
| `0007_scheduled_tests.sql` | Scheduled tests, attempts, answer keys |
| `0008_ai_analysis.sql` | AI usage tracking on attempts |
| `0009_community.sql` | Community messages, replies, likes, AI usage log |
| `0010_spoken_english.sql` | Spoken English progress and XP log |

Needs Postgres 15 or newer (Supabase's current default).

### Environment variables

| Variable | Needed for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Links, sitemap, previews | `https://eurekaclasses.live` in production |
| `NEXT_PUBLIC_SUPABASE_URL` | Everything | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Everything | Safe to expose |
| `SUPABASE_SECRET_KEY` | Server only | **Never expose.** Full database access |
| `ADMIN_EMAIL` | `/admin` | The single admin Google account |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Push notifications | `npx web-push generate-vapid-keys` |
| `GEMINI_API_KEY` | AI analysis, EurekaBot | Server only |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-3.1-flash-lite` |

Keep the same VAPID pair forever. Changing it silently stops every student's notifications.

## Deploying (Vercel + Supabase)

1. **Push the code** to a GitHub repository and import it in Vercel.
2. **Add every environment variable** above in Vercel (Project, Settings, Environment Variables).
   Set `NEXT_PUBLIC_SITE_URL` to `https://eurekaclasses.live`.
3. **Domain:** in Vercel add `eurekaclasses.live` (and `www.eurekaclasses.live`) and set the DNS
   records Vercel shows at your domain registrar.
4. **Supabase, Authentication, URL Configuration:**
   - Site URL: `https://eurekaclasses.live`
   - Redirect URLs: `https://eurekaclasses.live/**` (keep `http://localhost:3000/**` for development)
5. **Google Cloud, OAuth client:**
   - Authorised JavaScript origins: `https://eurekaclasses.live` (and `http://localhost:3000`)
   - Authorised redirect URI stays `https://<project>.supabase.co/auth/v1/callback`
   - On the consent screen, **publish** the app, otherwise only listed test users can sign in.
6. **Deploy**, then run the checklist below.

### After the first deploy

- [ ] Sign in with the admin Google account: you should land on `/admin`.
- [ ] From `/admin`, make a trusted person a teacher (they must sign in once first).
- [ ] Sign in as a test student, complete the profile, approve them as a teacher.
- [ ] Turn on notifications and approve another student: the welcome push should arrive.
- [ ] Install the app from the browser menu and open it from the home screen.
- [ ] Download a practice test, switch on airplane mode, take it, then reconnect: the score should sync.
- [ ] Replace the placeholder phone, WhatsApp and email in `src/lib/site.ts`.

## Everyday operations

- **Practice tests:** Teacher panel, Tests. Pick a board and class, open a topic, create its test and
  add 20 MCQs (one by one, or paste many). A sample set is in
  `supabase/seed/sample-questions-class9-number-systems.txt`.
- **Subjects and chapters:** edit `supabase/seed/catalog-data.mjs`, run
  `node scripts/generate-catalog-seed.mjs`, then run the new `0006_catalog_seed.sql`. Teachers can also
  add, hide or delete subjects and topics from the panel. Review the preloaded chapter lists: they follow
  the NCERT books and should be checked against what you actually teach.
- **Spoken English:** the course lives in `src/lib/spoken/course.ts`. Add lessons at the end of a unit and
  never renumber an existing lesson id, because students' progress is saved against it.
- **Gemini models change over time.** If AI features stop working, set `GEMINI_MODEL` to a current model.
- **Scheduled-test reminders:** students are notified when a test is scheduled or cancelled. A reminder at
  start time would need a scheduled job (for example Vercel Cron), which is not set up.

## Project layout

```
src/app/            Routes: (public), (student), teacher, admin, api
src/features/       One folder per feature: actions, queries, schemas, components
src/components/     Shared UI (ui/) and layout (layout/)
src/lib/            Supabase clients, push, Gemini, schedule and spoken-English logic
messages/           English and Hindi text (every user-facing string lives here)
supabase/           migrations/ and seed/
public/sw.js        Service worker: push, offline pages, caching
```

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

To try offline behaviour, use a production build (`npm run build && npm start`). The service worker
does not cache anything in development.

## Known limits

- iPhones cannot enter fullscreen for web pages, so scheduled tests there rely on the "leaving the app"
  warnings only.
- Practice tests keep their answer key on the student's device when downloaded for offline use.
  Scheduled tests never do.
- Speech recognition for Spoken English works best in Chrome on Android; elsewhere it falls back to a
  manual "I said it" button.
