export const BACKGROUND_MODES = ["auto", "alpha", "flat"] as const;
export const STICKER_MATERIALS = ["original", "holographic", "glitter", "reflective"] as const;
export const OUTPUT_SIZES = [512, 1024] as const;

export type BackgroundMode = (typeof BACKGROUND_MODES)[number];
export type OutputSize = (typeof OUTPUT_SIZES)[number];
export type StickerMaterial = (typeof STICKER_MATERIALS)[number];

export interface ImageToStickerInput {
  imagePath: string;
  backgroundMode?: BackgroundMode;
  outlineWidth?: number;
  outlineColor?: string;
  material?: StickerMaterial;
  tilt?: number;
  size?: OutputSize;
}

export interface ResolvedStickerSpec {
  imagePath: string;
  backgroundMode: BackgroundMode;
  outlineWidth: number;
  outlineColor: string;
  material: StickerMaterial;
  tilt: number;
  size: OutputSize;
}

export interface SourceCard {
  version: 4;
  sourceImage: string;
  backgroundMode: BackgroundMode;
  outlineWidth: number;
  outlineColor: string;
  material: StickerMaterial;
  tilt: number;
  size: OutputSize;
}

export interface StickerPromptOutput {
  prompt: string;
  spec: ResolvedStickerSpec;
  sourceCard: SourceCard;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  parsed?: ImageToStickerInput;
}
