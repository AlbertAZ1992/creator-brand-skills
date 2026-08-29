export type ClayOutputFormat = "image" | "mesh" | "both";
export type ClayShape = "object" | "relief";
export type ClayBackground = "transparent" | "studio";

export interface ClayOptions {
  logoPath: string;
  outputDir?: string;
  output?: ClayOutputFormat;
  shape?: ClayShape;
  depth?: number;
  clayColor?: string;
  background?: ClayBackground;
}

export interface ClayResult {
  imagePath?: string;
  meshPath?: string;
  materialPath?: string;
  bumpPath?: string;
  manifestPath?: string;
  prompt?: string;
  validation?: ClayValidationReport;
  format: ClayOutputFormat;
  shape: ClayShape;
}

export interface ClayValidationReport {
  passed: true;
  checks: string[];
  geometry: {
    vertices: number;
    faces: number;
  };
  preview: {
    width: number;
    height: number;
    format: string;
  };
  materialTexture: {
    width: number;
    height: number;
    format: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}
