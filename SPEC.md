# SPOON RESEARCH — Application Specification

**Domain:** spoonresearch.app
**Purpose:** Prep engine for "Knives and Spoons" — a weekly video podcast analyzing US Supreme Court and federal appellate court cases through a Lysander Spooner natural law framework. The show airs Tuesdays, timed to capture the full weekly cycle: Monday orders (from Friday conference), prior week's oral arguments, and any opinions issued. The show is conversational, not scripted. The app's job is to make the hosts well-informed enough to have an organic discussion, not to assign segments or script a production.
**Target users:** 2–5 (show hosts, collaborators, friends). Not a public product at this stage.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js (React) | Server-side rendering, built-in API routes, single codebase for frontend and backend |
| Database | Vercel Postgres (Neon) | Native Vercel integration, full-text search, relational queries |
| Hosting | Vercel | Already in use (Trial By Jury project), native Next.js deployment target |
| Repo | GitHub | Existing workflow |
| Styling | Tailwind CSS | Utility-based, dark mode built-in, clean defaults |
| Notifications | Telegram Bot API | Free, per-user case flagging |
| AI Models | Anthropic API (tiered) | See Model Routing below |

---

## Data Model

Core entities. This section is the contract — Claude Code should not invent alternative schemas. Fields listed are minimums, not exhaustive.

**Case**
- `id` (internal PK)
- `docket_number` (SCOTUS docket where applicable, e.g., "24-1025")
- `courtlistener_id` (CourtListener cluster/docket ID)
- `title` (canonical case name)
- `court` (SCOTUS, circuit, district)
- `status` (cert pending, cert granted, argued, decided, etc.)
- `scotus_bound` (boolean — user-applied tag for lower court cases)
- `flagged_by` (per-user flag list for notifications)

**FeedItem**
- `id`, `source_id`, `url`, `title`, `published_at`, `ingested_at`
- `summary` (Haiku-generated)
- `case_id` (nullable FK — many feed items reference no specific case)

**Source**
- `id`, `name`, `type` (RSS / API / scrape), `url`, `lean` (liberty / state-power / unclassified), `lean_overridden` (boolean — see Source Management), `health_threshold_days`

**EpisodeSnapshot**
- `id`, `episode_date`, `content` (frozen JSON of the weekly episode view), `briefs_generated` (case IDs with Generate Brief run that week)

**CalendarEvent**
- `id`, `date`, `type` (argument / conference / order / opinion / recess), `cases` (linked case IDs where known)

**Entity resolution (case matching across sources):**
1. **Primary key:** SCOTUS docket number. Extract from feed item text/URL where present.
2. **Secondary:** CourtListener docket/cluster ID when the item originates from CourtListener.
3. **Fallback:** Normalized title fuzzy match (strip "v.", punctuation, party abbreviations) with a confidence threshold. Below threshold → item remains unlinked rather than mislinked.
4. **Manual merge:** Admin UI to link an unmatched feed item to a case, or merge duplicate case records. Mislinking is worse than not linking — bias toward unlinked.

---

## Model Routing (Cost Optimization)

Hardcoded by task type — no runtime router.

| Tier | Model | Tasks |
|---|---|---|
| Cheap | Haiku | RSS feed summaries, headline extraction, notification text, feed health checks |
| Mid | Sonnet | Case summaries, thinker analyses, steelman arguments, Generate Brief (v1) |
| Heavy | Opus | Generate Brief synthesis — ONLY if Sonnet brief quality visibly falls short after real use |

**Model strings:** Do NOT hardcode model names from training data — they go stale. At build time, check the current model list at https://docs.claude.com and put the strings in a single config file so upgrades are one-line changes.

**Cost principles:**
- **Global cache, single generation.** Any AI-generated artifact (article summary, thinker analysis, steelman, case summary) is generated once and cached globally — never per-user. Per-user settings control which cached artifacts *display*, not what gets generated.
- **Lazy summarization for commentary tier.** Priority and court-coverage tier feed items are Haiku-summarized at ingest. Commentary-tier items (Volokh, Lawfare, HLR Blog, etc.) are summarized on first view, not at ingest — an unread summary is pure waste, and commentary is the highest-volume tier.
- **Batch API for all ingest-time summarization.** Nothing in a 15–30 minute polling cycle needs real-time responses; Anthropic's batch processing runs at a discount (verify current pricing at docs.claude.com). All ingest summaries go through batch.
- Generate on demand, not on ingest. Deep analysis only when a user opens the case detail page.
- **Judicial prediction is a button, never auto-run.** It's an expensive generation wanted on a minority of cases.
- Generate Brief assembles cached components and synthesizes — does not re-derive. Ship on Sonnet; add an Opus config toggle only if brief quality proves insufficient.
- Telegram polling: every 15–30 minutes, aligned with CourtListener rate limits.

**Estimated cost:** $20–60/month at 2–5 users with the above levers. (Assumes feed volume in the low hundreds of items/day; if volume grows substantially, lazy summarization becomes the critical lever.)

---

## Build Order

1. Aggregator feed (landing page)
2. SCOTUS calendar (seed file + display)
3. Weekly episode view
4. Case detail page (timeline, thinker arguments, precedent graph, oral argument links/notes)
5. Generate Brief
6. Telegram notifications
7. Source ingestion (upload new sources)
8. Episode archive
9. Exportable visual assets (lower priority)

---

## Feature Specifications

### 1. Landing Page — Aggregator Feed

The primary view. A feed showing the latest from each monitored source.

**Structure:**
- **Priority tier:** Official SCOTUS announcements, cert grants, opinion releases.
- **Court coverage tier:** SCOTUSblog, How Appealing, Law Dork, CourtListener alerts.
- **Commentary tier:** Volokh Conspiracy, Lawfare, Harvard Law Review Blog, Reuters Legal, Bloomberg Law, One First (Vladeck), Res Ipsa Loquitur (Turley), Bench Memos (Whelan), Empirical SCOTUS (Feldman).
- **Litigation org tier:** Institute for Justice case tracker, Pacific Legal Foundation case tracker, Liberty Justice Center.
- **Podcast tier (episode feeds, no AI summary needed — titles/show notes only):** Divided Argument (Baude/Epps), Advisory Opinions (Isgur/French), Amarica's Constitution (Amar).

Each feed entry shows: source name as heading, headline/title, date, and a Haiku-generated one-paragraph AI summary. **Summarization timing:** priority and court-coverage tiers at ingest (via Batch API); commentary tier on first view (lazy); podcast tier never (show notes suffice).

**Lower courts section:** Highlights the most significant active cases relevant to natural rights, sovereignty, function of government, jury authority. Not a static top-10 list — editorially flexible. Users can apply a **"SCOTUS-bound"** tag to any lower court case they believe is headed to the Supreme Court. Cases with this tag:
- Appear in the weekly episode view alongside actual SCOTUS activity.
- Persist in a visible watchlist rather than competing for a slot in a fixed list.
- Carry the same notification/flagging behavior as SCOTUS cases.

**Alert triggers (always in feed):**
- SCOTUS appearances before Congress.
- Federal judicial confirmation hearings.
- Any development on user-flagged cases.

**UI behavior:**
- Dark mode default, user-selectable light mode.
- Mobile-first, responsive for desktop.
- Tap-to-dismiss navigation bar (like iOS PDF reader behavior).
- Share button on every item — copies link for posting to X, Substack, etc.

### 2. Weekly Episode View

A weekly snapshot auto-populated from the feed based on the Court's calendar. Not a production document — a table of contents for the week's SCOTUS activity with links into existing case detail pages.

**Per-user optional:** Each user toggles the weekly episode view on/off in settings. When on, it appears as a top-level view in their navigation. When off, it is hidden for that user but continues generating server-side (so the episode archive stays complete regardless of individual settings). Default: on for host-role users, off for others.

**Organized by activity type:**
- **Monday orders:** Cert grants, cert denials of note, summary dispositions.
- **Opinions issued** that week.
- **Oral arguments heard** that week.
- **Developments in user-flagged cases** (including SCOTUS-bound tagged lower court cases).
- **Looking Ahead:** What's on the SCOTUS calendar for the coming week (populated from the SCOTUS Calendar feature).

**Generation behavior:**
- **Trigger:** Cron job Monday at 6:00 PM ET — after Monday orders have dropped and been ingested, before Tuesday show prep.
- **Live until archived:** The generated view remains live (re-queries the feed) until the episode date passes, then freezes into an EpisodeSnapshot on Wednesday 12:01 AM ET. Late-breaking Monday-evening or Tuesday-morning items appear without regeneration.
- **Recess weeks:** The view still generates. Sections with no activity display "No activity this week" rather than disappearing (empty sections are information — they tell the hosts it's a quiet week). Developments in flagged cases and Looking Ahead carry recess-week episodes.

No cohost assignment, no segment structure — just a comprehensive "here's what happened" organized for easy review before Tuesday's show.

### 3. SCOTUS Calendar

The Court's calendar structurally drives the show — argument weeks vs. recess weeks vs. opinion season change what there is to cover.

**Data source decision:** supremecourt.gov publishes the calendar as HTML/PDF, not an API. Scraping it is fragile and fails silently. Instead:
- **Primary: manually maintained seed file** (`calendar.json` in the repo). The Court publishes the full term schedule in advance — argument sessions, conference days, and recesses are ~40–50 dated entries per term, entered once at the start of the term and amended rarely. This is deliberate: a human-verified seed file cannot silently drift.
- **Supplement: CourtListener API** for scheduled oral argument dates per case (links CalendarEvents to specific cases automatically).
- **Order days** are derived: the Monday following each conference day.
- Opinion days are announced with short notice; admin can add them to the seed file, and the feed's priority tier catches opinion releases regardless.

**Display:** The Court's schedule displayed prominently in the app — argument days, conference days, order days, opinion days, recess periods.

**Integration:**
- Auto-populates the "Looking Ahead" section of the weekly episode view.
- Integrated with the existing Telegram notification system for calendar events (subscribable as a category, on/off).

### 4. Case Detail Page

Accessed by clicking any case in the feed or via search.

**Case overview:**
- AI summary of the case.
- Links to all court documents (filings, opinions, motions) via CourtListener/RECAP.
- AI summaries of each court document.

**Case timeline:** Chronological visual progression — filed → motion → ruling → appeal → cert petition. Sourced from CourtListener API. Shows where the case stands procedurally at a glance.

**Oral argument audio and transcripts** (for any argued case):
- Link to oral argument audio (supremecourt.gov).
- Link to the oral argument transcript (supremecourt.gov PDF; CourtListener as backup).
- **v1 scope decision: links + manual timestamped notes.** Users add free-text notes with a typed timestamp (e.g., "22:14 — Gorsuch question re: standing"). Transcript ingestion, parsing, and audio-aligned timestamps are deferred (see Future Considerations) — the parsing/alignment engineering is disproportionate to the v1 need, which is "help the hosts find the exchange again."

**People involved:**
- Bios and background for parties, judges/justices, prosecutors, defense counsel.
- Jury information from lower courts where available.
- Judicial prediction: how the judge/justices are likely to rule based on prior case history, writings, and published opinions. **On-demand only — a "Generate Prediction" button, never auto-run on page load** (expensive generation, wanted on a minority of cases). Output labeled as inference, not prediction. Cached globally once generated.

**Arguments section — "For the Plaintiff" / "For the Defense":**

Each side gets structured historical and philosophical analysis.

**Default five thinkers (always generated):**
User-configurable. Each user selects which five thinkers auto-generate on every case detail page. System defaults (used until the user customizes):
1. **Spooner** — the core framework
2. **Locke** — natural rights baseline
3. **Jefferson** — founding-era application
4. **Blackstone** — the opposition/state-power voice
5. **Aquinas** — "unjust law is no law" deep root

Users can swap any of the five for any thinker from the full roster. Selection persists in user settings.

**Cache behavior (cost-critical):** Thinker analyses are generated once per case per thinker and cached globally. A user's "default five" selection controls which cached analyses *display* automatically on their view of the page — it never triggers separate generation. If User A's selection already generated the Spooner analysis for a case, User B viewing it costs nothing.

**On-demand thinkers (presented as a tappable list, generated when clicked):**
All thinkers not in the user's default five. Full roster: Mason, Sidney, Coke, La Boétie, Cicero, Montesquieu, Suárez, Vitoria, Grotius, Pufendorf, Aristotle, the Levellers (Lilburne, Overton, Walwyn), Douglass, Garrison, Rothbard, Bastiat, Nock, Oppenheimer, Spencer, Tucker, and any user-added thinkers.

**Grouping of thinker analyses:**
- **Founder's Corner:** If the thinker is a Founding Father (Jefferson, Mason, Jay, Madison, Hamilton, Henry, etc.).
- **What the Founders Were Reading:** If the thinker was referenced or read by the Founders (Locke, Sidney, Montesquieu, Cicero, Aristotle, Coke, etc.).
- **Historical Thoughts:** Everyone else (Spooner, Rothbard, Bastiat, Nock, etc.).

Each thinker entry: short AI-generated argument summary + link to the actual source text.

**Steelman the Opposition:** Structured "strongest argument against" the liberty-oriented position. Always included.

**Precedent graph:** One-hop view — what this case cites, and what other active cases cite the same precedents. Visual, not a flat list. **Data source:** CourtListener's citation lookup API (opinions cited by / citing). If citation data is missing for a case (common for pending cert-stage cases with no opinion yet), display the graph section with "No citation data yet" rather than hiding it.

**Exportable visual assets (future):** Case timelines, precedent graphs, and vote lineup graphics exportable as PNG or SVG, or renderable in a clean full-screen "show mode" suitable for screen capture during video recording. Lower priority — noted for future implementation.

### 5. Generate Brief

The core show-prep deliverable. Produces a comprehensive PDF briefing document.

**Contents:**
- Case summary.
- Case timeline.
- All thinker arguments (default five + any the user generated on-demand).
- Steelman the opposition.
- Precedent graph summary.
- Historical review of relevant case law.
- Philosophical perspectives organized for/against.
- Hyperlinked citations throughout.

**Citation linking strategy (three tiers):**
1. **HTML sources (blogs, OLL pages, web-hosted texts):** Use browser text fragment links (`#:~:text=quoted%20phrase`) for automatic scroll-to-highlight. Works in Chrome, Edge, Safari.
2. **Self-hosted sources (uploaded PDFs converted to HTML):** Paragraph-level anchor IDs for permanent deep linking.
3. **External PDFs (CourtListener, PACER):** Link to the document + include the exact quote as copyable text adjacent to the link for manual Cmd+F.

**AI model:** Sonnet for v1 synthesis. Assembles cached components (summaries, thinker analyses already generated from case detail views) and synthesizes — does not re-derive from scratch. Because the brief is mostly assembly and formatting of already-generated analyses, Opus is likely unnecessary; keep the model as a config value and upgrade to Opus only if brief quality visibly falls short in real use.

### 6. Episode Archive

A record of past weekly episode views. Not a recording archive — a log of what SCOTUS activity was current for each episode date.

**Stores (as EpisodeSnapshot):**
- Which cases were active each week.
- Which cases had Generate Brief run on them that week.
- The frozen weekly episode view as it existed at archive time (Wednesday 12:01 AM ET).

**Purpose:** Preventing redundant coverage and enabling "previously on" callbacks. Hosts can quickly check what was covered in prior weeks before prepping the current episode. Archive is complete regardless of any user's weekly-view toggle setting.

### 7. Telegram Notifications

**Trigger:** User flags a case as "of interest."

**Notification scope:** Court filings, official court announcements, news articles published, blog entries — anything that appears in the aggregator about that case.

**Controls:**
- Per-case opt-in/opt-out.
- Discontinue notifications via reply within the Telegram bot itself.
- SCOTUS calendar events (oral arguments, opinion days, conference days, confirmation hearings) — subscribable as a category, on/off.

**Polling cadence:** Every 15–30 minutes.

### 8. Source Management

Lives on a dedicated **Sources** page.

**Source catalogue:** All sources listed with:
- Short summary describing each.
- Political lean classification: liberty-oriented vs. state-power-oriented. Haiku classifies on ingest; **any user can override the classification**, and an override is permanent until manually changed (never re-classified by AI). Overridden entries are marked as human-set.
- All referenced titles listed under each source name, each clickable with a hyperlink to the hosted/external document.

**Adding new sources — three input types:**
- **PDF upload:** Stored, text extracted, indexed for search and citation. Converted to searchable HTML for hosting (enables deep linking).
- **Blog/news URL:** Fetched, stored, added to aggregator. If RSS-capable, offer option to subscribe (ongoing) vs. one-time add.
- **RSS feed URL:** Added to polling pipeline. New entries appear in aggregator like existing sources.

**On ingest:** Every new source gets a Haiku-generated summary and political lean classification.

**Quality control:** New user-submitted sources enter a "pending review" state — usable immediately but visually distinguished from the vetted core library until confirmed by an admin user.

### 9. Feed Health Monitoring

Internal dashboard (admin-only or visible to all users — decide during build).

Flags when any source hasn't returned new content in X days (configurable threshold per source, since some publish daily and others weekly). Distinguishes "the pipe is broken" from "the source is quiet."

### 10. Search

Global search across all cases, sources, documents, thinker analyses. Powered by PostgreSQL full-text search.

---

## Failure Behavior

Default posture: degrade visibly, never silently. Claude Code should build these behaviors in from the start, not as an afterthought.

- **Cached content always serves.** A dead feed or failed API call never blanks a page section that has cached content.
- **Failed AI generation** shows an inline error with a retry button. It never blocks the rest of the page (per Design Principles) and never silently shows stale content as if fresh.
- **Feed failures** surface in the health dashboard and, if a priority-tier source fails, as a banner on the landing page. A section with a broken pipe shows "Source unavailable since [date]" — not an empty section indistinguishable from a quiet news day.
- **CourtListener rate limiting:** Back off exponentially, queue the requests, surface the delay in the health dashboard. Never drop requests silently.
- **Entity resolution failures** leave items unlinked (visible in an admin "unmatched items" queue), never guessed-linked.
- **Weekly episode view generation failure:** Telegram alert to admin. The view falls back to a live query rather than showing nothing.

---

## Source Library

### Live Monitoring Sources
- CourtListener (courtlistener.com) — case alerts, opinion search, RECAP archive
- SCOTUSblog (scotusblog.com) — daily SCOTUS coverage, RSS
- How Appealing (howappealing.abovethelaw.com) — daily appellate roundup
- Institute for Justice (ij.org/cases) — active litigation tracker
- Pacific Legal Foundation (pacificlegal.org/cases) — case tracker
- Volokh Conspiracy (reason.com/volokh) — doctrinal commentary
- Lawfare (lawfaremedia.org) — executive power, separation of powers
- Federal Register (federalregister.gov) — proposed/final agency rules
- Harvard Law Review Blog (blog.harvardlawreview.org) — case commentary
- Law Dork (lawdork.com) — SCOTUS and federal courts
- Reuters Legal (reuters.com/legal) — breaking legal news
- FIJA (fija.org, fija.substack.com) — jury nullification advocacy
- One First — Steve Vladeck (stevevladeck.com) — weekly SCOTUS newsletter; best available coverage of the emergency/shadow docket; left-of-center counterweight
- Res Ipsa Loquitur — Jonathan Turley (jonathanturley.org) — constitutional law, free speech, executive power; high volume, column-driven rather than docket-driven
- Bench Memos — Ed Whelan (nationalreview.com/bench-memos) — judicial nominations and confirmation battles; also Confirmation Tales Substack
- Empirical SCOTUS — Adam Feldman (empiricalscotus.com; Legalytics Substack; recurring SCOTUSblog column) — quantitative voting-pattern and argument analysis; data layer for the judicial prediction feature

### Podcast Sources (monitor for coverage awareness and steelman material; show-note ingestion only)
- Divided Argument — Will Baude & Dan Epps (dividedargument.com) — rigorous two-host SCOTUS podcast; Baude's originalist scholarship is directly framework-relevant; also format research for a conversational two-host show
- Advisory Opinions — Sarah Isgur & David French (thedispatch.com) — the largest show in the genre; tracks what mainstream-adjacent coverage looks like
- Amarica's Constitution — Akhil Amar (Yale) — liberal originalism; Ninth Amendment and unenumerated-rights work overlaps Spooner territory from the opposite direction; prime steelman material

### Primary Text Library
See `Spoon_Source_Library.pdf` for complete list with links. Key repositories:
- Online Library of Liberty (oll.libertyfund.org)
- Mises Institute (mises.org/library)
- Internet Archive (archive.org)
- Project Gutenberg (gutenberg.org)
- Constitution Society (constitution.org)

---

## Design Principles

- **Dark mode default**, light mode available.
- **Mobile-first**, desktop-responsive.
- **Not flashy.** Functional. Common-sense button placement and sizing.
- **Tap-to-dismiss navigation** — full-screen reading mode, nav reappears on tap.
- **Share button** on every piece of content — copies link for social posting.
- **Speed.** Pages load fast. Cached content serves instantly. AI generation shows loading state but doesn't block the rest of the page.

---

## Authentication

- User-based, password-protected.
- No public access.
- Roles: **host** (full access, weekly view on by default) and **member** (full read access, weekly view off by default).
- Per-user customization: case notification preferences, thinker defaults, weekly episode view toggle, light/dark mode.

---

## Future Considerations (Not v1)

- **Spoon Ratings (learned system):** Scrapped from v1. Previously specced: 1–11 spoon scale applied to cases, user ratings + one-sentence reasons stored as few-shot training data, retrieval-based consistency scoring after ~30–50 rated cases, and an optional blind-reveal mode for on-air rating comparisons between hosts. Preserved here in full so it can be reintroduced without re-deriving the design.
- **Transcript ingestion & audio-aligned timestamps:** Parse oral argument transcript PDFs, align to audio, make timestamped notes clickable to jump audio position. v1 ships links + manual notes.
- **Extensibility to other topics:** Core engine (aggregator, AI summary, source catalogue, notifications) is topic-agnostic. A future version could let any user upload source material, define an ideology statement, and get a custom-rated aggregator. Deferred — build the specific Spooner version first.
- **Native iOS app:** Web app is v1. Native could follow if push notifications or offline access become needed.
- **Google/Apple Calendar sync:** Direct calendar integration so SCOTUS schedule appears in the user's personal calendar app. The calendar data itself is a core feature (see §3); external sync is the deferred piece.
- **Public product / App Store:** If the tool proves useful beyond the core group. Changes auth, abuse prevention, cost allocation, content moderation requirements significantly.
- **Exportable visual assets:** Full implementation of PNG/SVG export and "show mode" rendering for case timelines, precedent graphs, and vote lineup graphics (see §4).
