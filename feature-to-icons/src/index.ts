import type {
  FeatureIconInput,
  FeatureIconOutput,
  IconMetadata,
  ValidationError,
} from "./types.js";
import type { IconStyle } from "./types.js";
import { validateSvgArtifact, writeIconFamily } from "./delivery.js";
import { buildPhosphorIconFamily as buildLibraryFamily, searchPhosphorIcons } from "./phosphor.js";
import type {
  DeliveredIconFamily,
  IconArtifact,
  IconDesignSystem,
  IconOverrides,
} from "./types.js";

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const VALID_STYLES: IconStyle[] = ["outline", "filled", "duotone"];
const VALID_GRID_SIZES = [24, 32, 48] as const;
const VALID_CORNER_RADII = ["sharp", "rounded", "round"] as const;
const VALID_WEIGHTS = ["light", "regular", "bold"] as const;
const MIN_FEATURES = 3;
const MAX_FEATURES = 20;

const DEFAULTS = {
  style: "outline" as IconStyle,
  gridSize: 24 as const,
  strokeWidth: 2,
  cornerRadius: "rounded" as const,
  visualWeight: "regular" as const,
} as const;

/**
 * Validate user input and return a clean FeatureIconInput with defaults applied,
 * or a list of ValidationErrors.
 */
export function validate(raw: unknown): { data?: FeatureIconInput; errors?: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (raw === null || raw === undefined || typeof raw !== "object") {
    return { errors: [{ field: "root", message: "Input must be an object" }] };
  }

  const obj = raw as Record<string, unknown>;

  // features
  if (!Array.isArray(obj["features"])) {
    errors.push({ field: "features", message: "features must be an array of strings" });
  } else {
    const features = obj["features"] as unknown[];
    if (features.length === 0) {
      errors.push({ field: "features", message: "features must not be empty" });
    } else if (features.length < MIN_FEATURES) {
      errors.push({
        field: "features",
        message: `features must have at least ${MIN_FEATURES} items`,
      });
    } else if (features.length > MAX_FEATURES) {
      errors.push({
        field: "features",
        message: `features must have at most ${MAX_FEATURES} items`,
      });
    }
    for (let i = 0; i < features.length; i++) {
      if (typeof features[i] !== "string" || (features[i] as string).trim().length === 0) {
        errors.push({
          field: `features[${i}]`,
          message: "each feature must be a non-empty string",
        });
      }
    }
    const normalizedFeatures = features
      .filter((feature): feature is string => typeof feature === "string")
      .map((feature) => feature.trim().toLocaleLowerCase());
    if (new Set(normalizedFeatures).size !== normalizedFeatures.length) {
      errors.push({ field: "features", message: "feature names must be unique" });
    }
  }

  // style
  let style: IconStyle = DEFAULTS.style;
  if (obj["style"] !== undefined) {
    if (
      typeof obj["style"] !== "string" ||
      !(VALID_STYLES as readonly string[]).includes(obj["style"])
    ) {
      errors.push({ field: "style", message: `style must be one of: ${VALID_STYLES.join(", ")}` });
    } else {
      style = obj["style"] as IconStyle;
    }
  }

  // colors
  let colors: { primary: string; secondary?: string } | undefined;
  if (obj["colors"] !== undefined) {
    if (typeof obj["colors"] !== "object" || obj["colors"] === null) {
      errors.push({
        field: "colors",
        message: "colors must be an object with a primary hex color",
      });
    } else {
      const colorsObj = obj["colors"] as Record<string, unknown>;
      if (typeof colorsObj["primary"] !== "string" || !HEX_COLOR_RE.test(colorsObj["primary"])) {
        errors.push({
          field: "colors.primary",
          message: "colors.primary must be a valid hex color (e.g. #1A2B3C)",
        });
      } else {
        colors = { primary: colorsObj["primary"] };
      }
      if (colorsObj["secondary"] !== undefined) {
        if (
          typeof colorsObj["secondary"] !== "string" ||
          !HEX_COLOR_RE.test(colorsObj["secondary"])
        ) {
          errors.push({
            field: "colors.secondary",
            message: "colors.secondary must be a valid hex color (e.g. #1A2B3C)",
          });
        } else if (colors) {
          colors.secondary = colorsObj["secondary"];
        }
      }
    }
  }

  // gridSize
  let gridSize: 24 | 32 | 48 = DEFAULTS.gridSize;
  if (obj["gridSize"] !== undefined) {
    if (
      typeof obj["gridSize"] !== "number" ||
      !(VALID_GRID_SIZES as readonly number[]).includes(obj["gridSize"])
    ) {
      errors.push({
        field: "gridSize",
        message: `gridSize must be one of: ${VALID_GRID_SIZES.join(", ")}`,
      });
    } else {
      gridSize = obj["gridSize"] as 24 | 32 | 48;
    }
  }

  // strokeWidth
  let strokeWidth: number = DEFAULTS.strokeWidth;
  if (obj["strokeWidth"] !== undefined) {
    if (
      typeof obj["strokeWidth"] !== "number" ||
      obj["strokeWidth"] <= 0 ||
      !Number.isFinite(obj["strokeWidth"])
    ) {
      errors.push({ field: "strokeWidth", message: "strokeWidth must be a positive number" });
    } else {
      strokeWidth = obj["strokeWidth"];
    }
  }

  // cornerRadius
  let cornerRadius: "sharp" | "rounded" | "round" = DEFAULTS.cornerRadius;
  if (obj["cornerRadius"] !== undefined) {
    if (
      typeof obj["cornerRadius"] !== "string" ||
      !(VALID_CORNER_RADII as readonly string[]).includes(obj["cornerRadius"])
    ) {
      errors.push({
        field: "cornerRadius",
        message: `cornerRadius must be one of: ${VALID_CORNER_RADII.join(", ")}`,
      });
    } else {
      cornerRadius = obj["cornerRadius"] as "sharp" | "rounded" | "round";
    }
  }

  // visualWeight
  let visualWeight: "light" | "regular" | "bold" = DEFAULTS.visualWeight;
  if (obj["visualWeight"] !== undefined) {
    if (
      typeof obj["visualWeight"] !== "string" ||
      !(VALID_WEIGHTS as readonly string[]).includes(obj["visualWeight"])
    ) {
      errors.push({
        field: "visualWeight",
        message: `visualWeight must be one of: ${VALID_WEIGHTS.join(", ")}`,
      });
    } else {
      visualWeight = obj["visualWeight"] as "light" | "regular" | "bold";
    }
  }

  // productContext
  if (obj["productContext"] !== undefined && typeof obj["productContext"] !== "string") {
    errors.push({ field: "productContext", message: "productContext must be a string" });
  }

  if (errors.length > 0) {
    return { errors };
  }

  const features = (obj["features"] as string[]).map((f: string) => f.trim());

  return {
    data: {
      features,
      style,
      ...(colors !== undefined ? { colors } : {}),
      gridSize,
      strokeWidth,
      cornerRadius,
      visualWeight,
      ...(obj["productContext"] !== undefined
        ? { productContext: obj["productContext"] as string }
        : {}),
    },
  };
}

const CONCEPT_MAP: Record<string, { concept: string; description: string }> = {
  dashboard: {
    concept: "Grid/Layout",
    description: "A grid of four squares representing a dashboard layout",
  },
  reports: {
    concept: "Document/Chart",
    description: "A document with a bar chart, representing reports and analytics",
  },
  analytics: {
    concept: "Chart/Graph",
    description: "A rising bar or line chart representing data analysis",
  },
  users: {
    concept: "People/Profile",
    description: "Two overlapping profile silhouettes representing users",
  },
  settings: {
    concept: "Gear/Cog",
    description: "A gear or cog wheel representing configuration and settings",
  },
  notifications: {
    concept: "Bell",
    description: "A bell icon representing alerts and notifications",
  },
  messages: {
    concept: "Chat bubble",
    description: "A speech bubble representing messaging and communication",
  },
  search: {
    concept: "Magnifying glass",
    description: "A magnifying glass representing search and discovery",
  },
  home: {
    concept: "House",
    description: "A simple house shape representing home or landing page",
  },
  profile: {
    concept: "Person silhouette",
    description: "A person silhouette representing user profile",
  },
  calendar: { concept: "Calendar page", description: "A calendar page with a date marker" },
  upload: {
    concept: "Up arrow with tray",
    description: "An upward arrow emerging from a tray, representing upload",
  },
  download: {
    concept: "Down arrow with tray",
    description: "A downward arrow entering a tray, representing download",
  },
  share: {
    concept: "Connected nodes",
    description: "Three connected dots with lines, representing sharing",
  },
  delete: { concept: "Trash can", description: "A trash bin representing deletion" },
  edit: { concept: "Pencil", description: "A pencil representing editing or writing" },
  lock: { concept: "Padlock", description: "A padlock representing security or authentication" },
  security: { concept: "Shield", description: "A shield representing protection and security" },
  payment: {
    concept: "Credit card",
    description: "A credit card representing payment and transactions",
  },
  cart: { concept: "Shopping cart", description: "A shopping cart representing e-commerce" },
  shop: { concept: "Storefront", description: "A storefront with awning" },
  store: { concept: "Storefront", description: "A storefront with awning" },
  help: {
    concept: "Question mark circle",
    description: "A question mark inside a circle, representing help",
  },
  info: {
    concept: "Info circle",
    description: 'An "i" inside a circle, representing information',
  },
  warning: {
    concept: "Warning triangle",
    description: "An exclamation mark inside a triangle, representing warnings",
  },
  error: { concept: "X circle", description: "An X inside a circle, representing errors" },
  success: {
    concept: "Checkmark circle",
    description: "A checkmark inside a circle, representing success",
  },
  email: { concept: "Envelope", description: "An envelope representing email" },
  phone: { concept: "Phone handset", description: "A phone handset representing calls" },
  map: { concept: "Map pin", description: "A map pin or location marker" },
  location: { concept: "Map pin", description: "A map pin or location marker" },
  time: { concept: "Clock", description: "A clock face representing time and scheduling" },
  clock: { concept: "Clock", description: "A clock face representing time and scheduling" },
  tag: {
    concept: "Price tag",
    description: "A price tag with a hole, representing labels and tags",
  },
  label: {
    concept: "Price tag",
    description: "A price tag with a hole, representing labels and tags",
  },
  bookmark: {
    concept: "Bookmark ribbon",
    description: "A ribbon bookmark representing saved items",
  },
  heart: { concept: "Heart", description: "A heart shape representing favorites and likes" },
  star: { concept: "Star", description: "A five-point star representing favorites and ratings" },
  filter: { concept: "Funnel", description: "A funnel representing filtering and sorting" },
  export: {
    concept: "Outward arrow",
    description: "An arrow pointing out of a box, representing export",
  },
  import: {
    concept: "Inward arrow",
    description: "An arrow pointing into a box, representing import",
  },
  refresh: {
    concept: "Circular arrows",
    description: "Two arrows forming a circle, representing refresh",
  },
  sync: {
    concept: "Circular arrows",
    description: "Two arrows forming a circle, representing synchronization",
  },
  menu: { concept: "Hamburger lines", description: "Three horizontal lines representing a menu" },
  more: {
    concept: "Three dots",
    description: "Three horizontal or vertical dots representing more options",
  },
  play: { concept: "Play triangle", description: "A right-pointing triangle representing play" },
  pause: { concept: "Pause bars", description: "Two vertical bars representing pause" },
  stop: { concept: "Stop square", description: "A square representing stop" },
  audio: { concept: "Speaker", description: "A speaker with sound waves, representing audio" },
  video: {
    concept: "Play button on screen",
    description: "A screen with a play triangle, representing video",
  },
  image: {
    concept: "Landscape frame",
    description: "A landscape frame with mountains, representing images",
  },
  photo: { concept: "Camera", description: "A camera body representing photography" },
  file: { concept: "Document outline", description: "A document with a folded corner" },
  folder: { concept: "Folder", description: "A folder shape for organizing files" },
  link: {
    concept: "Chain links",
    description: "Two interlocking chain links representing hyperlinks",
  },
  copy: {
    concept: "Two overlapping squares",
    description: "Two overlapping document squares representing copy",
  },
  paste: { concept: "Clipboard", description: "A clipboard representing paste" },
  clipboard: { concept: "Clipboard", description: "A clipboard with paper" },
  print: { concept: "Printer", description: "A printer device" },
  save: { concept: "Floppy disk", description: "A floppy disk representing save" },
  flag: { concept: "Flag pennant", description: "A flag on a pole representing milestones" },
  target: { concept: "Crosshair", description: "A crosshair or target reticle" },
  trophy: { concept: "Trophy cup", description: "A trophy cup representing achievements" },
  award: { concept: "Trophy cup", description: "A trophy cup representing awards" },
  badge: { concept: "Shield badge", description: "A shield-shaped badge" },
  rocket: { concept: "Rocket ship", description: "A rocket representing launch or growth" },
  cloud: { concept: "Cloud shape", description: "A cloud representing cloud services" },
  database: {
    concept: "Database cylinder",
    description: "A stacked cylinder representing a database",
  },
  server: { concept: "Server rack", description: "A server rack unit" },
  wifi: { concept: "WiFi arcs", description: "Three concentric arcs representing WiFi signal" },
  bluetooth: { concept: "Bluetooth rune", description: "The Bluetooth rune symbol" },
  battery: { concept: "Battery", description: "A battery with charge level indicator" },
  power: { concept: "Power symbol", description: "The universal power on/off symbol" },
  eye: { concept: "Eye", description: "An eye shape representing visibility" },
  "eye-off": {
    concept: "Eye with slash",
    description: "An eye with a diagonal slash, representing hidden",
  },
  visibility: { concept: "Eye", description: "An eye shape representing visibility" },
  monitor: { concept: "Computer monitor", description: "A desktop monitor" },
  laptop: { concept: "Laptop", description: "An open laptop" },
  tablet: { concept: "Tablet device", description: "A tablet device in portrait orientation" },
  mobile: { concept: "Smartphone", description: "A smartphone outline" },
  smartphone: { concept: "Smartphone", description: "A smartphone outline" },
  headphones: { concept: "Headphones", description: "Over-ear headphones" },
  mic: { concept: "Microphone", description: "A microphone on a stand" },
  camera: { concept: "Camera body", description: "A camera body with lens" },
  sun: { concept: "Sun", description: "A sun with rays" },
  moon: { concept: "Crescent moon", description: "A crescent moon" },
  "light-mode": { concept: "Sun", description: "A sun with rays representing light mode" },
  "dark-mode": {
    concept: "Crescent moon",
    description: "A crescent moon representing dark mode",
  },
  globe: { concept: "Globe", description: "A globe with meridians, representing global or web" },
  world: { concept: "Globe", description: "A globe with meridians" },
  language: {
    concept: "Globe with text",
    description: "A globe with a text indicator, representing language",
  },
  translate: {
    concept: "Two speech bubbles",
    description: "Two speech bubbles with different scripts",
  },
  code: { concept: "Angle brackets", description: "Angle brackets or code braces" },
  terminal: { concept: "Terminal prompt", description: "A terminal window with a prompt cursor" },
  git: {
    concept: "Git branch",
    description: "A branch with a circle node representing git branching",
  },
  branch: { concept: "Git branch", description: "A branch with a circle node" },
  merge: { concept: "Merging arrows", description: "Two arrows merging into one" },
  "pull-request": {
    concept: "PR icon",
    description: "A branch with an arrow, representing a pull request",
  },
  pipeline: {
    concept: "Flow nodes",
    description: "Connected dots with arrows representing a pipeline",
  },
  deploy: { concept: "Rocket or ship", description: "A rocket representing deployment" },
  build: {
    concept: "Hammer or box",
    description: "A hammer or a box with a wrench, representing build",
  },
  test: {
    concept: "Beaker or check marks",
    description: "A beaker or a checklist, representing testing",
  },
  bug: { concept: "Bug insect", description: "A simplified bug shape for bug tracking" },
  ticket: {
    concept: "Ticket stub",
    description: "A ticket stub representing issues or support tickets",
  },
  support: { concept: "Headset", description: "A headset representing customer support" },
  feedback: {
    concept: "Speech bubble with star",
    description: "A speech bubble with a star, representing feedback",
  },
  subscribe: {
    concept: "Bell with plus",
    description: "A bell with a plus sign, representing subscription",
  },
  unsubscribe: {
    concept: "Bell with slash",
    description: "A bell with a slash, representing unsubscription",
  },
  onboarding: {
    concept: "Compass",
    description: "A compass representing guidance and onboarding",
  },
  setup: { concept: "Wrench", description: "A wrench representing setup and configuration" },
  wizard: {
    concept: "Magic wand",
    description: "A magic wand with sparkles, representing wizards",
  },
  template: {
    concept: "Layered squares",
    description: "Layered document squares representing templates",
  },
  workflow: {
    concept: "Flowchart nodes",
    description: "Connected nodes forming a workflow diagram",
  },
  automation: {
    concept: "Gear with lightning",
    description: "A gear with a lightning bolt for automation",
  },
  integration: {
    concept: "Puzzle piece",
    description: "A puzzle piece representing integration",
  },
  api: {
    concept: "API brackets",
    description: "Curly braces with a connecting line, representing an API",
  },
  webhook: {
    concept: "Hook link",
    description: "A chain link shaped like a hook, representing webhooks",
  },
  permission: {
    concept: "Key with shield",
    description: "A key combined with a shield, representing permissions",
  },
  role: {
    concept: "Person with badge",
    description: "A person silhouette with a badge, representing roles",
  },
  audit: {
    concept: "Checklist with magnifier",
    description: "A checklist with a magnifying glass for audit trails",
  },
  log: {
    concept: "List with lines",
    description: "Horizontal lines on a document, representing logs",
  },
  history: {
    concept: "Clock with arrow",
    description: "A clock with a counter-clockwise arrow, representing history",
  },
  timeline: {
    concept: "Timeline nodes",
    description: "Connected dots along a line representing a timeline",
  },
  invoice: {
    concept: "Document with currency",
    description: "A document with a currency symbol, representing invoices",
  },
  billing: {
    concept: "Credit card with dollar",
    description: "A credit card with a dollar sign, representing billing",
  },
  wallet: { concept: "Wallet", description: "A folded wallet shape" },
  "shopping-bag": { concept: "Shopping bag", description: "A shopping bag with handles" },
  gift: { concept: "Gift box", description: "A wrapped gift box with a bow" },
  coupon: {
    concept: "Ticket with percent",
    description: "A ticket with a percent sign, representing coupons",
  },
  discount: {
    concept: "Price tag with percent",
    description: "A price tag with a percent sign, representing discounts",
  },
  membership: { concept: "ID card", description: "An ID card shape representing membership" },
  community: {
    concept: "Three connected people",
    description: "Three connected person icons representing community",
  },
  forum: {
    concept: "Speech bubbles grid",
    description: "A grid of speech bubbles representing a forum",
  },
  blog: {
    concept: "Pen with article",
    description: "A pen on a document, representing blog or article",
  },
  news: { concept: "Newspaper", description: "A folded newspaper" },
  feed: { concept: "RSS waves", description: "Curved radio waves representing a feed" },
  activity: {
    concept: "Pulse line",
    description: "A heartbeat or pulse line representing activity",
  },
  trend: { concept: "Trending arrow", description: "An upward trending arrow on a chart" },
  compare: {
    concept: "Two columns",
    description: "Two side-by-side columns representing comparison",
  },
  split: { concept: "Forked path", description: "A path forking into two directions" },
  combine: { concept: "Merging paths", description: "Two paths merging into one" },
  sort: { concept: "Sort arrows", description: "Up and down arrows representing sort direction" },
  "drag-handle": {
    concept: "Grip dots",
    description: "A grid of dots representing a drag handle",
  },
  resize: {
    concept: "Corner arrows",
    description: "Diagonal arrows in a corner, representing resize",
  },
  fullscreen: {
    concept: "Expanding arrows",
    description: "Arrows pointing to corners, representing fullscreen",
  },
  minimize: { concept: "Minus or collapse", description: "A minus sign or collapse chevrons" },
  maximize: { concept: "Square or expand", description: "A square or expand arrows" },
  close: { concept: "X mark", description: "An X mark representing close or cancel" },
  check: { concept: "Checkmark", description: "A checkmark representing confirmation" },
  plus: { concept: "Plus sign", description: "A plus sign representing add or create" },
  minus: { concept: "Minus sign", description: "A minus sign representing subtract or remove" },
  "arrow-up": { concept: "Up arrow", description: "An upward pointing arrow" },
  "arrow-down": { concept: "Down arrow", description: "A downward pointing arrow" },
  "arrow-left": { concept: "Left arrow", description: "A leftward pointing arrow" },
  "arrow-right": { concept: "Right arrow", description: "A rightward pointing arrow" },
  "chevron-up": { concept: "Up chevron", description: "An upward pointing chevron" },
  "chevron-down": { concept: "Down chevron", description: "A downward pointing chevron" },
  "chevron-left": { concept: "Left chevron", description: "A leftward pointing chevron" },
  "chevron-right": { concept: "Right chevron", description: "A rightward pointing chevron" },
  "external-link": {
    concept: "Arrow out of box",
    description: "An arrow exiting a box, representing external links",
  },
  "open-in-new": {
    concept: "Arrow out of box",
    description: "An arrow exiting a box, representing opening in a new tab",
  },
};

function analyzeFeatureSemantics(feature: string): IconMetadata {
  const lower = feature.toLowerCase();

  // Try exact match first
  if (CONCEPT_MAP[lower]) {
    const match = CONCEPT_MAP[lower]!;
    return { feature, semanticConcept: match.concept, visualDescription: match.description };
  }

  // Try partial match: check if any known keyword is contained in the feature name
  for (const [keyword, concept] of Object.entries(CONCEPT_MAP)) {
    if (lower.includes(keyword)) {
      return { feature, semanticConcept: concept.concept, visualDescription: concept.description };
    }
  }

  // Fallback: return a generic placeholder
  return {
    feature,
    semanticConcept: "Custom/Abstract",
    visualDescription:
      `An abstract icon representing "${feature}" — ` +
      "the AI should determine the best visual metaphor",
  };
}

function buildDesignSystemSection(input: FeatureIconInput): string {
  const strokeNote = input.style === "filled" ? "" : `- Stroke width: ${input.strokeWidth}px`;
  const secondaryColor =
    input.colors?.secondary ?? input.colors?.primary ?? "a slightly muted shade";
  const fillNote =
    input.style === "filled"
      ? `- All shapes should be filled with ${input.colors?.primary ?? "the primary color"}`
      : input.style === "duotone"
        ? `- Primary shapes use ${input.colors?.primary ?? "the primary color"}, ` +
          `secondary shapes use ${secondaryColor}`
        : `- Stroke color: ${input.colors?.primary ?? "currentColor"}`;

  const weightDescription =
    input.visualWeight === "light"
      ? "thinner strokes, more whitespace"
      : input.visualWeight === "bold"
        ? "thicker strokes, heavier presence"
        : "balanced strokes and spacing";

  const borderMap: Record<string, string> = {
    sharp: "0px (sharp 90-degree corners)",
    rounded: "2px (slightly rounded)",
    round: "9999px (fully rounded/round caps on strokes)",
  };

  return [
    "## Design System (NON-NEGOTIABLE)",
    "",
    "Every icon in this set MUST share identical visual parameters:",
    "",
    `- Grid: ${input.gridSize}x${input.gridSize}px viewBox with 2px internal padding`,
    strokeNote,
    `- Corner radius: ${borderMap[input.cornerRadius ?? "rounded"]}`,
    `- Visual weight: ${input.visualWeight} (${weightDescription})`,
    `- Style: ${input.style}`,
    fillNote,
    "- Consistent detail level across all icons",
    "- No icon should look more complex or simpler than others in the set",
    "- Each icon should use roughly the same number of path elements",
    "- Icons must be recognizable at 16x16px when scaled down",
    "- No text, letters, or numerals inside any icon",
    "- Every icon must have a distinct, unique silhouette",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildColorsSection(input: FeatureIconInput): string {
  if (!input.colors) return "";

  return [
    "",
    "## Color Palette",
    "",
    `- Primary color: ${input.colors.primary}`,
    input.colors.secondary ? `- Secondary color: ${input.colors.secondary}` : "",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Build the AI prompt used only for an explicitly approved custom fallback. */
export function buildPrompt(input: FeatureIconInput): string {
  const designSystem = buildDesignSystemSection(input);
  const colors = buildColorsSection(input);

  const icons = input.features.map(analyzeFeatureSemantics);

  const iconsSection = icons
    .map((icon, i) => {
      return [
        `### Icon ${i + 1}: "${icon.feature}"`,
        `- Semantic concept: ${icon.semanticConcept}`,
        `- Visual description: ${icon.visualDescription}`,
      ].join("\n");
    })
    .join("\n\n");

  const contextSection = input.productContext
    ? ["", "## Product Context", "", input.productContext, ""].join("\n")
    : "";

  return [
    "# Task: Generate a Custom Fallback Icon Family",
    "",
    `Generate ${input.features.length} SVG icons as a single cohesive icon set.`,
    "",
    designSystem,
    colors,
    contextSection,
    "## Icon Specifications",
    "",
    iconsSection,
    "",
    "## Output Format",
    "",
    "Return the icons as a JSON object with this structure:",
    "```json",
    "{",
    '  "icons": {',
    '    "feature-name": "<svg>...</svg>",',
    "    ...",
    "  }",
    "}",
    "```",
    "",
    "Each SVG must:",
    `- Use viewBox="0 0 ${input.gridSize} ${input.gridSize}"`,
    "- Use XML namespace http://www.w3.org/2000/svg",
    "- Be self-contained (no external references)",
    "- Apply the design system parameters exactly as specified",
    "",
    "## Critical Quality Requirements",
    "",
    "1. If any two icons use different stroke widths, corner radii, or visual weights, " +
      "the output is FAILED.",
    "2. If any icon contains text, the output is FAILED.",
    "3. If any icon is unrecognizable at 16x16px, the output is FAILED.",
    "4. All icons must feel like they belong to the same family — " +
      "consistent personality and construction.",
  ].join("\n");
}

/**
 * Parse a custom-fallback AI response into a structured FeatureIconOutput.
 * Accepts a JSON string or an object containing the icon SVG map.
 */
export function parseOutput(raw: string, input?: FeatureIconInput): FeatureIconOutput {
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(raw);
  } catch {
    // If direct JSON parse fails, try to extract JSON from markdown code block
    const jsonMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch?.[1]) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
      } catch {
        throw new Error(
          "Failed to parse AI output: response is not valid JSON and contains no JSON code block",
        );
      }
    } else {
      throw new Error("Failed to parse AI output: response is not valid JSON");
    }
  }

  if (!parsed["icons"] || typeof parsed["icons"] !== "object") {
    throw new Error(
      'AI output must contain an "icons" object mapping feature names to SVG strings',
    );
  }

  const iconsMap = parsed["icons"] as Record<string, unknown>;
  const features = input?.features ?? Object.keys(iconsMap);
  if (input && Object.keys(iconsMap).length !== features.length) {
    throw new Error(`AI output must contain exactly ${features.length} icons`);
  }

  const designSystem = getDesignSystem(input);
  const artifacts = buildArtifacts(features, iconsMap, designSystem);
  const icons: IconMetadata[] = artifacts.map(
    ({ fileName: _fileName, svg: _svg, ...icon }) => icon,
  );

  return {
    prompt: input ? buildPrompt(input) : "",
    iconCount: features.length,
    icons,
    artifacts,
    designSystem,
  };
}

export async function deliverIconFamily(
  input: FeatureIconInput,
  raw: string,
  outputDir: string,
): Promise<DeliveredIconFamily> {
  return writeIconFamily(parseOutput(raw, input), outputDir);
}

export async function buildPhosphorIconFamily(
  input: FeatureIconInput,
  overrides: IconOverrides = {},
): Promise<FeatureIconOutput> {
  return buildLibraryFamily(input, getDesignSystem(input), overrides);
}

export async function deliverPhosphorIconFamily(
  input: FeatureIconInput,
  outputDir: string,
  overrides: IconOverrides = {},
): Promise<DeliveredIconFamily> {
  const output = await buildPhosphorIconFamily(input, overrides);
  return writeIconFamily(output, outputDir);
}

function getDesignSystem(input?: FeatureIconInput): IconDesignSystem {
  return {
    style: input?.style ?? DEFAULTS.style,
    gridSize: input?.gridSize ?? DEFAULTS.gridSize,
    strokeWidth: input?.strokeWidth ?? DEFAULTS.strokeWidth,
    cornerRadius: input?.cornerRadius ?? DEFAULTS.cornerRadius,
    visualWeight: input?.visualWeight ?? DEFAULTS.visualWeight,
    geometryPolicy: "custom-exact",
  };
}

function buildArtifacts(
  features: string[],
  iconsMap: Record<string, unknown>,
  designSystem: IconDesignSystem,
): IconArtifact[] {
  const fileNames = new Set<string>();
  return features.map((feature) => {
    const svg = iconsMap[feature];
    if (typeof svg !== "string") {
      throw new Error(`AI output is missing an SVG string for "${feature}"`);
    }
    const errors = validateSvgArtifact(svg, designSystem);
    if (errors.length > 0) {
      throw new Error(`Invalid SVG for "${feature}": ${errors.join("; ")}`);
    }
    const fileName = `${slugifyFeature(feature)}.svg`;
    if (fileNames.has(fileName)) {
      throw new Error(`Feature names produce the same output filename: ${fileName}`);
    }
    fileNames.add(fileName);
    return {
      ...analyzeFeatureSemantics(feature),
      source: {
        type: "custom" as const,
        license: "user-provided" as const,
        geometryModified: false,
        presentationModified: false,
      },
      fileName,
      svg: svg.trim(),
    };
  });
}

function slugifyFeature(feature: string): string {
  const slug = feature
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "icon";
}

export { validateSvgArtifact } from "./delivery.js";
export { measureSvgOptics, validateFamilyOptics } from "./optical.js";
export { searchPhosphorIcons };
export type {
  DeliveredIconFamily,
  FeatureIconInput,
  FeatureIconOutput,
  IconArtifact,
  IconDesignSystem,
  IconFamilyManifest,
  IconMetadata,
  IconCandidate,
  IconOpticalMetrics,
  IconOverrides,
  IconSource,
  PhosphorWeight,
  ValidationError,
} from "./types.js";
