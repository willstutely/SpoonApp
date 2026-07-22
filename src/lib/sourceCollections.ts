export type SourceCollectionKind = "thinker" | "reference_text" | "historical_case";
export type ThinkerGroup = "founder" | "founders_reading" | "historical";

export type SourceCollectionSeed = {
  slug: string;
  name: string;
  kind: SourceCollectionKind;
  thinkerGroup?: ThinkerGroup;
  isCoreFramework?: boolean;
  /** Folder name under Sources/, exact match (including odd spacing/quotes). */
  folder: string;
};

// One entry per folder currently in Sources/. Maps the user's hand-curated
// primary text library onto the app's thinker roster + citable reference
// material. New folders need an entry here before ingestion will pick them
// up — see scripts/ingest-sources.ts.
export const SOURCE_COLLECTIONS: SourceCollectionSeed[] = [
  // --- Thinkers (generate on-demand commentary per case) ---
  {
    slug: "spooner",
    name: "Lysander Spooner",
    kind: "thinker",
    thinkerGroup: "historical",
    isCoreFramework: true,
    folder: "Lysander Spooner",
  },
  { slug: "jefferson", name: "Thomas Jefferson", kind: "thinker", thinkerGroup: "founder", folder: "Thomas Jefferson" },
  { slug: "madison", name: "James Madison", kind: "thinker", thinkerGroup: "founder", folder: "James Madison" },
  { slug: "mason", name: "George Mason", kind: "thinker", thinkerGroup: "founder", folder: "George Mason" },
  { slug: "blackstone", name: "William Blackstone", kind: "thinker", thinkerGroup: "founders_reading", folder: "Blackstone" },
  { slug: "aquinas", name: "Thomas Aquinas", kind: "thinker", thinkerGroup: "historical", folder: "Thomas Aquinas" },
  { slug: "sidney", name: "Algernon Sidney", kind: "thinker", thinkerGroup: "founders_reading", folder: "Algernon Sidney" },
  { slug: "coke", name: "Edward Coke", kind: "thinker", thinkerGroup: "founders_reading", folder: "Edward Coke" },
  { slug: "la-boetie", name: "Étienne de La Boétie", kind: "thinker", thinkerGroup: "historical", folder: "Etienne de la Boetie" },
  { slug: "cicero", name: "Cicero", kind: "thinker", thinkerGroup: "founders_reading", folder: "Cicero" },
  { slug: "montesquieu", name: "Montesquieu", kind: "thinker", thinkerGroup: "founders_reading", folder: "Montesquieu" },
  { slug: "suarez", name: "Francisco Suárez", kind: "thinker", thinkerGroup: "historical", folder: "Francisco Suarez" },
  { slug: "pufendorf", name: "Samuel Pufendorf", kind: "thinker", thinkerGroup: "founders_reading", folder: "Samuel Pufendorf" },
  { slug: "aristotle", name: "Aristotle", kind: "thinker", thinkerGroup: "founders_reading", folder: "Aristotle" },
  { slug: "levellers", name: "The Levellers", kind: "thinker", thinkerGroup: "historical", folder: "Leveller Tracts" },
  { slug: "douglass", name: "Frederick Douglass", kind: "thinker", thinkerGroup: "historical", folder: "Frederick Douglass" },
  { slug: "garrison", name: "William Lloyd Garrison", kind: "thinker", thinkerGroup: "historical", folder: "William Lloyd Garrison" },
  { slug: "rothbard", name: "Murray Rothbard", kind: "thinker", thinkerGroup: "historical", folder: "Murray Rothbard" },
  { slug: "bastiat", name: "Frédéric Bastiat", kind: "thinker", thinkerGroup: "historical", folder: "Friedric Bastiat" },
  { slug: "nock", name: "Albert Jay Nock", kind: "thinker", thinkerGroup: "historical", folder: "Albert Jay Nock " },
  { slug: "spencer", name: "Herbert Spencer", kind: "thinker", thinkerGroup: "historical", folder: "Herbert Spencer" },
  { slug: "paine", name: "Thomas Paine", kind: "thinker", thinkerGroup: "historical", folder: "Thomas Paine" },
  { slug: "augustine", name: "Augustine", kind: "thinker", thinkerGroup: "historical", folder: "Augustine" },
  { slug: "story", name: "Joseph Story", kind: "thinker", thinkerGroup: "historical", folder: "Justice Joseph Story" },
  { slug: "barnett", name: "Randy Barnett", kind: "thinker", thinkerGroup: "historical", folder: "Randy Barnett" },
  { slug: "kramer", name: "Larry Kramer", kind: "thinker", thinkerGroup: "historical", folder: "Larry Kramer" },
  { slug: "phillips", name: "Wendell Phillips", kind: "thinker", thinkerGroup: "historical", folder: "Wendell Phillips" },

  // --- Collective / founding reference texts (citable, not a single voice) ---
  { slug: "federalist-papers", name: "The Federalist Papers", kind: "reference_text", folder: "Federalist Papers" },
  { slug: "anti-federalist-papers", name: "The Anti-Federalist Papers", kind: "reference_text", folder: "Anti Federalist Papers" },
  { slug: "catos-letters", name: "Cato's Letters", kind: "reference_text", folder: "Cato’s Letters" },
  { slug: "founding-documents", name: "Founding Documents", kind: "reference_text", folder: "Founding Documents" },
  { slug: "magna-carta", name: "Magna Carta", kind: "reference_text", folder: "Magna Carta" },
  { slug: "ratification-debates", name: "Ratification Debates", kind: "reference_text", folder: "Ratification Debates" },
  {
    slug: "stephen-langton-studies",
    name: "Studies on the Commentaries of Cardinal Stephen Langton (Lacombe)",
    kind: "reference_text",
    folder: "untitled folder",
  },

  // --- Historical case law (jury-authority precedent, per FIJA/Spooner's "Trial By Jury") ---
  { slug: "sparf-v-united-states", name: "Sparf v. United States", kind: "historical_case", folder: "Sparf v United States" },
  { slug: "us-v-battiste", name: "United States v. Battiste", kind: "historical_case", folder: "United States v. Battiste" },
  { slug: "bushells-case", name: "Bushell's Case", kind: "historical_case", folder: "Bushell’s Case" },
  { slug: "georgia-v-brailsford", name: "Georgia v. Brailsford", kind: "historical_case", folder: "Georgia v. Brailsford" },
];
