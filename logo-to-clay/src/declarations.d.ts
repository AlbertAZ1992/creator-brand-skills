declare module "gl" {
  interface GLOptions {
    alpha?: boolean;
    antialias?: boolean;
    depth?: boolean;
    stencil?: boolean;
    premultipliedAlpha?: boolean;
    preserveDrawingBuffer?: boolean;
    preferLowPowerToHighPerformance?: boolean;
    failIfMajorPerformanceCaveat?: boolean;
  }

  function createGLContext(
    width: number,
    height: number,
    options?: GLOptions,
  ): WebGLRenderingContext;

  export = createGLContext;
}

declare module "three/examples/jsm/exporters/GLTFExporter.js" {
  import type { Object3D } from "three";

  interface GLTFExporterOptions {
    binary?: boolean;
    trs?: boolean;
    onlyVisible?: boolean;
    maxTextureSize?: number;
  }

  class GLTFExporter {
    parse(
      input: Object3D | Object3D[],
      onCompleted: (gltf: ArrayBuffer | Record<string, unknown>) => void,
      onError: (error: unknown) => void,
      options?: GLTFExporterOptions,
    ): void;
  }

  export { GLTFExporter };
}
