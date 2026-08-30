export type IconStyle = "outline" | "filled" | "duotone";
export type IconPurpose = "brand" | "system";
export type PhosphorWeight = "light" | "regular" | "bold" | "fill" | "duotone";

export interface FeatureIconInput {
  /** List of feature names to generate icons for (3-20 items) */
  features: string[];
  /** Visual style of the icons */
  style?: IconStyle;
  /** Brand feature art or compact system/UI glyphs */
  purpose?: IconPurpose;
  /** Color palette: hex colors for the icon set */
  colors?: { primary: string; secondary?: string };
  /** Icon grid size in pixels (square) */
  gridSize?: 24 | 32 | 48;
  /** Stroke width in pixels (for outline/duotone style) */
  strokeWidth?: number;
  /** Corner radius style */
  cornerRadius?: "sharp" | "rounded" | "round";
  /** Overall visual weight */
  visualWeight?: "light" | "regular" | "bold";
  /** Optional context about the product for better semantic matching */
  productContext?: string;
}

export interface IconMetadata {
  feature: string;
  semanticConcept: string;
  visualDescription: string;
  source?: IconSource;
}

export interface IconSource {
  type: "library" | "custom";
  library?: "Phosphor";
  package?: "@phosphor-icons/core";
  version?: "2.1.1";
  iconName?: string;
  weight?: PhosphorWeight;
  license: "MIT" | "user-provided";
  geometryModified: boolean;
  presentationModified: boolean;
}

export interface IconOpticalMetrics {
  feature: string;
  bounds: { x: number; y: number; width: number; height: number };
  centerOffset: { x: number; y: number };
  inkRatio: number;
  occupiedAreaRatio: number;
}

export interface IconArtifact extends IconMetadata {
  fileName: string;
  svg: string;
}

export interface IconDesignSystem {
  purpose: IconPurpose;
  style: IconStyle;
  gridSize: number;
  strokeWidth: number;
  cornerRadius: string;
  visualWeight: string;
  geometryPolicy?: "library-native" | "custom-exact";
  sourceWeight?: PhosphorWeight;
}

export interface FeatureIconOutput {
  /** The prompt that generates all icons in one consistent set */
  prompt: string;
  /** How many icons to generate */
  iconCount: number;
  /** Metadata about each icon's semantic concept */
  icons: IconMetadata[];
  /** Validated SVG deliverables returned by the model */
  artifacts: IconArtifact[];
  /** Design system parameters used */
  designSystem: IconDesignSystem;
}

export interface IconFamilyManifest {
  contractVersion: "1.0";
  featureCount: number;
  designSystem: IconDesignSystem;
  source: {
    strategy: "library-first" | "custom";
    library?: "Phosphor";
    package?: "@phosphor-icons/core";
    version?: "2.1.1";
    license: "MIT" | "user-provided";
    weight?: PhosphorWeight;
  };
  files: {
    spec: string;
    metadata: string;
    previewSvg: string;
    previewPng: string;
    icons: string[];
  };
  validation: {
    passed: true;
    checks: string[];
    opticalMetrics: IconOpticalMetrics[];
    warnings: string[];
  };
}

export interface DeliveredIconFamily {
  outputDir: string;
  manifestPath: string;
  previewPath: string;
  iconPaths: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface IconCandidate {
  iconName: string;
  confidence: number;
  matchedBy: "preferred" | "override" | "name" | "metadata";
  tags: string[];
  categories: string[];
}

export type IconOverrides = Readonly<Record<string, string>>;
