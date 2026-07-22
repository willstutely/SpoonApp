export type SourceTier =
  | "priority"
  | "court_coverage"
  | "commentary"
  | "litigation_org"
  | "podcast";

export type SeedSource = {
  slug: string;
  name: string;
  /** Homepage — used for the clickable source-name link, human-friendly. */
  url: string;
  /**
   * The actual RSS/Atom endpoint, if known — this is what ingestSource.ts
   * stores as a DB `sources.url` when the feed is added, so it's what
   * getFeedData.ts matches against to find that source's ingested items.
   * A source with no feedUrl here just won't show ingested content on the
   * landing page until someone adds it via /sources with the right feed
   * URL (verify each one before adding — sites' feed paths vary).
   */
  feedUrl?: string;
  tier: SourceTier;
  lean: "liberty" | "state_power" | "unclassified";
  summary: string;
};

export const TIER_LABELS: Record<SourceTier, string> = {
  priority: "Priority",
  court_coverage: "Court Coverage",
  commentary: "Commentary",
  litigation_org: "Litigation Trackers",
  podcast: "Podcasts",
};

// Seed catalog per SPEC.md §"Source Library". AI summaries are generated
// at ingest (priority/court_coverage) or on first view (commentary) —
// see src/lib/models.ts. Podcast tier never gets AI summaries.
export const SEED_SOURCES: SeedSource[] = [
  {
    slug: "courtlistener",
    name: "CourtListener",
    url: "https://www.courtlistener.com",
    tier: "priority",
    lean: "unclassified",
    summary: "Case alerts, opinion search, and the RECAP archive.",
  },

  {
    slug: "scotusblog",
    name: "SCOTUSblog",
    url: "https://www.scotusblog.com",
    tier: "court_coverage",
    lean: "unclassified",
    summary: "Daily SCOTUS coverage.",
  },
  {
    slug: "how-appealing",
    name: "How Appealing",
    url: "https://howappealing.abovethelaw.com",
    tier: "court_coverage",
    lean: "unclassified",
    summary: "Daily appellate roundup.",
  },
  {
    slug: "law-dork",
    name: "Law Dork",
    url: "https://www.lawdork.com",
    tier: "court_coverage",
    lean: "liberty",
    summary: "SCOTUS and federal courts.",
  },

  {
    slug: "volokh",
    name: "Volokh Conspiracy",
    url: "https://reason.com/volokh",
    feedUrl: "https://reason.com/volokh/feed/",
    tier: "commentary",
    lean: "liberty",
    summary: "Doctrinal commentary.",
  },
  {
    slug: "lawfare",
    name: "Lawfare",
    url: "https://www.lawfaremedia.org",
    tier: "commentary",
    lean: "state_power",
    summary: "Executive power, separation of powers.",
  },
  {
    slug: "federal-register",
    name: "Federal Register",
    url: "https://www.federalregister.gov",
    tier: "commentary",
    lean: "unclassified",
    summary: "Proposed and final agency rules.",
  },
  {
    slug: "hlr-blog",
    name: "Harvard Law Review Blog",
    url: "https://blog.harvardlawreview.org",
    tier: "commentary",
    lean: "unclassified",
    summary: "Case commentary.",
  },
  {
    slug: "reuters-legal",
    name: "Reuters Legal",
    url: "https://www.reuters.com/legal",
    tier: "commentary",
    lean: "unclassified",
    summary: "Breaking legal news.",
  },
  {
    slug: "fija",
    name: "FIJA",
    url: "https://fija.org",
    tier: "commentary",
    lean: "liberty",
    summary: "Jury nullification advocacy.",
  },
  {
    slug: "one-first",
    name: "One First — Steve Vladeck",
    url: "https://www.stevevladeck.com",
    tier: "commentary",
    lean: "state_power",
    summary:
      "Weekly SCOTUS newsletter; best available coverage of the emergency/shadow docket; left-of-center counterweight.",
  },
  {
    slug: "res-ipsa-loquitur",
    name: "Res Ipsa Loquitur — Jonathan Turley",
    url: "https://jonathanturley.org",
    tier: "commentary",
    lean: "liberty",
    summary:
      "Constitutional law, free speech, executive power; high volume, column-driven rather than docket-driven.",
  },
  {
    slug: "bench-memos",
    name: "Bench Memos — Ed Whelan",
    url: "https://www.nationalreview.com/bench-memos",
    tier: "commentary",
    lean: "state_power",
    summary: "Judicial nominations and confirmation battles.",
  },
  {
    slug: "empirical-scotus",
    name: "Empirical SCOTUS — Adam Feldman",
    url: "https://empiricalscotus.com",
    tier: "commentary",
    lean: "unclassified",
    summary:
      "Quantitative voting-pattern and argument analysis; data layer for the judicial prediction feature.",
  },

  {
    slug: "institute-for-justice",
    name: "Institute for Justice",
    url: "https://ij.org/cases",
    tier: "litigation_org",
    lean: "liberty",
    summary: "Active litigation tracker.",
  },
  {
    slug: "pacific-legal-foundation",
    name: "Pacific Legal Foundation",
    url: "https://pacificlegal.org/cases",
    tier: "litigation_org",
    lean: "liberty",
    summary: "Case tracker.",
  },
  {
    slug: "liberty-justice-center",
    name: "Liberty Justice Center",
    url: "https://libertyjusticecenter.org",
    tier: "litigation_org",
    lean: "liberty",
    summary: "Case tracker.",
  },

  {
    slug: "divided-argument",
    name: "Divided Argument",
    url: "https://www.dividedargument.com",
    tier: "podcast",
    lean: "unclassified",
    summary: "Will Baude & Dan Epps — rigorous two-host SCOTUS podcast.",
  },
  {
    slug: "advisory-opinions",
    name: "Advisory Opinions",
    url: "https://thedispatch.com",
    tier: "podcast",
    lean: "unclassified",
    summary: "Sarah Isgur & David French — the largest show in the genre.",
  },
  {
    slug: "amaricas-constitution",
    name: "Amarica's Constitution",
    url: "https://amaricasconstitution.com",
    tier: "podcast",
    lean: "unclassified",
    summary: "Akhil Amar — liberal originalism, prime steelman material.",
  },
];

export const TIER_ORDER: SourceTier[] = [
  "priority",
  "court_coverage",
  "commentary",
  "litigation_org",
  "podcast",
];
