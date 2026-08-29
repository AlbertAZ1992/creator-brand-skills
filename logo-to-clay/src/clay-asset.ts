import * as THREE from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import sharp from "sharp";
import { basename } from "node:path";
import type { ClayOptions } from "./types.js";
import { generateClayBumpMap } from "./textures.js";
import { makeOutputPath, writeOutputFile, writeRecord } from "./output.js";

// ---------------------------------------------------------------------------
// Shrink-wrap factor: scale logo to fit within a unit box.
// ---------------------------------------------------------------------------
const UNIT_SCALE = 2.0;
const BEVEL_THICKNESS_RATIO = 0.24;
const BEVEL_SIZE_RATIO = 0.2;
const BEVEL_OFFSET_RATIO = 0;
const BEVEL_SEGMENTS = 14;
const RASTER_EROSION_RADIUS = 1;
const RASTER_SMOOTHING_PASSES = 2;
const RELIEF_BACKING_DEPTH_MM = 1.2;
const RELIEF_BORDER = 0.14;
const RELIEF_CORNER_RADIUS = 0.06;

// ---------------------------------------------------------------------------
// Contour extraction helpers
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

interface BoundaryEdge {
  start: Point;
  end: Point;
}

function pointKey(point: Point): string {
  return `${point.x},${point.y}`;
}

function traceContours(mask: Uint8Array, width: number, height: number): Point[][] {
  const edges: BoundaryEdge[] = [];
  const isFilled = (x: number, y: number): boolean =>
    x >= 0 && x < width && y >= 0 && y < height && (mask[y * width + x] ?? 0) > 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isFilled(x, y)) continue;
      if (!isFilled(x, y - 1)) edges.push({ start: { x, y }, end: { x: x + 1, y } });
      if (!isFilled(x + 1, y)) edges.push({ start: { x: x + 1, y }, end: { x: x + 1, y: y + 1 } });
      if (!isFilled(x, y + 1)) edges.push({ start: { x: x + 1, y: y + 1 }, end: { x, y: y + 1 } });
      if (!isFilled(x - 1, y)) edges.push({ start: { x, y: y + 1 }, end: { x, y } });
    }
  }

  const edgesByStart = new Map<string, BoundaryEdge[]>();
  for (const edge of edges) {
    const key = pointKey(edge.start);
    const bucket = edgesByStart.get(key) ?? [];
    bucket.push(edge);
    edgesByStart.set(key, bucket);
  }

  const contours: Point[][] = [];
  const visited = new Set<BoundaryEdge>();
  for (const firstEdge of edges) {
    if (visited.has(firstEdge)) continue;
    const contour: Point[] = [];
    let edge: BoundaryEdge | undefined = firstEdge;
    while (edge && !visited.has(edge)) {
      visited.add(edge);
      contour.push(edge.start);
      edge = (edgesByStart.get(pointKey(edge.end)) ?? []).find(
        (candidate) => !visited.has(candidate),
      );
    }
    if (contour.length >= 4) contours.push(contour);
  }
  return contours;
}

function contourArea(contour: Point[]): number {
  let area = 0;
  for (let i = 0, j = contour.length - 1; i < contour.length; j = i++) {
    const current = contour[i]!;
    const previous = contour[j]!;
    area += previous.x * current.y - current.x * previous.y;
  }
  return area / 2;
}

function perpDist(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return [...points];
  const first = points[0]!;
  const last = points[points.length - 1]!;
  let maxDist = 0;
  let maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i]!, first, last);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }
  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

interface RasterShape {
  outer: Point[];
  holes: Point[][];
}

function farthestPointIndex(points: Point[], fromIndex: number): number {
  const from = points[fromIndex]!;
  let farthestIndex = fromIndex;
  let farthestDistance = -1;
  for (let index = 0; index < points.length; index++) {
    const point = points[index]!;
    const distance = (point.x - from.x) ** 2 + (point.y - from.y) ** 2;
    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestIndex = index;
    }
  }
  return farthestIndex;
}

function contourArc(points: Point[], start: number, end: number): Point[] {
  const arc: Point[] = [];
  let index = start;
  while (index !== end) {
    arc.push(points[index]!);
    index = (index + 1) % points.length;
  }
  arc.push(points[end]!);
  return arc;
}

function simplifyClosedContour(points: Point[], epsilon: number): Point[] {
  if (points.length <= 4) return [...points];
  let start = farthestPointIndex(points, 0);
  let end = farthestPointIndex(points, start);
  start = farthestPointIndex(points, end);
  end = farthestPointIndex(points, start);
  const firstArc = douglasPeucker(contourArc(points, start, end), epsilon);
  const secondArc = douglasPeucker(contourArc(points, end, start), epsilon);
  return [...firstArc.slice(0, -1), ...secondArc.slice(0, -1)];
}

function smoothClosedContour(points: Point[], passes: number): Point[] {
  let smoothed = [...points];
  for (let pass = 0; pass < passes; pass++) {
    smoothed = smoothed.map((point, index) => {
      const previous = smoothed[(index - 1 + smoothed.length) % smoothed.length]!;
      const next = smoothed[(index + 1) % smoothed.length]!;
      return {
        x: previous.x * 0.2 + point.x * 0.6 + next.x * 0.2,
        y: previous.y * 0.2 + point.y * 0.6 + next.y * 0.2,
      };
    });
  }
  return smoothed;
}

function isPointInsidePolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index]!;
    const previousPoint = polygon[previous]!;
    const crosses = currentPoint.y > point.y !== previousPoint.y > point.y;
    const intersectionX =
      ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
        (previousPoint.y - currentPoint.y) +
      currentPoint.x;
    if (crosses && point.x < intersectionX) inside = !inside;
  }
  return inside;
}

function extractRasterShapes(mask: Uint8Array, width: number, height: number): RasterShape[] {
  const minimumArea = 9;
  const simplificationTolerance = Math.max(width, height) / 256;
  const contours = traceContours(mask, width, height)
    .filter((contour) => Math.abs(contourArea(contour)) >= minimumArea)
    .map((contour) => simplifyClosedContour(contour, simplificationTolerance))
    .map((contour) => smoothClosedContour(contour, RASTER_SMOOTHING_PASSES));
  if (contours.length === 0) return [];

  const largest = contours.reduce((best, contour) =>
    Math.abs(contourArea(contour)) > Math.abs(contourArea(best)) ? contour : best,
  );
  const outerSign = Math.sign(contourArea(largest));
  const outers = contours.filter((contour) => Math.sign(contourArea(contour)) === outerSign);
  const holes = contours.filter((contour) => Math.sign(contourArea(contour)) !== outerSign);
  const shapes = outers.map((outer) => ({ outer, holes: [] as Point[][] }));

  for (const hole of holes) {
    const parents = shapes.filter((shape) => isPointInsidePolygon(hole[0]!, shape.outer));
    parents.sort((a, b) => Math.abs(contourArea(a.outer)) - Math.abs(contourArea(b.outer)));
    parents[0]?.holes.push(hole);
  }
  return shapes;
}

function createForegroundMask(data: Buffer, width: number, height: number): Uint8Array {
  const mask = new Uint8Array(width * height);
  const hasTransparency = Array.from({ length: width * height }).some(
    (_, index) => (data[index * 4 + 3] ?? 0) < 200,
  );
  if (hasTransparency) {
    for (let index = 0; index < mask.length; index++) {
      mask[index] = (data[index * 4 + 3] ?? 0) > 128 ? 1 : 0;
    }
    return mask;
  }

  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x >= 3 && x < width - 3 && y >= 3 && y < height - 3) continue;
      const offset = (y * width + x) * 4;
      red += data[offset] ?? 0;
      green += data[offset + 1] ?? 0;
      blue += data[offset + 2] ?? 0;
      count++;
    }
  }
  for (let index = 0; index < mask.length; index++) {
    const offset = index * 4;
    const distance = Math.hypot(
      (data[offset] ?? 0) - red / count,
      (data[offset + 1] ?? 0) - green / count,
      (data[offset + 2] ?? 0) - blue / count,
    );
    mask[index] = distance > 45 ? 1 : 0;
  }
  return mask;
}

function erodeMask(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const eroded = new Uint8Array(mask.length);
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      let isFilled = true;
      for (let offsetY = -radius; offsetY <= radius && isFilled; offsetY++) {
        for (let offsetX = -radius; offsetX <= radius; offsetX++) {
          if ((mask[(y + offsetY) * width + x + offsetX] ?? 0) === 0) {
            isFilled = false;
            break;
          }
        }
      }
      eroded[y * width + x] = isFilled ? 1 : 0;
    }
  }
  return eroded;
}

async function extractShapesFromImage(
  logoPath: string,
  processingSize: number,
): Promise<{ shapes: RasterShape[]; w: number; h: number }> {
  const { data, info } = await sharp(logoPath)
    .resize(processingSize, processingSize, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mask = erodeMask(
    createForegroundMask(data, info.width, info.height),
    info.width,
    info.height,
    RASTER_EROSION_RADIUS,
  );
  const shapes = extractRasterShapes(mask, info.width, info.height);
  if (shapes.length > 0) return { shapes, w: info.width, h: info.height };
  throw new Error(
    `No foreground contour was found in ${logoPath}. ` +
      "Use an SVG/PNG with transparency or a contrasting flat background.",
  );
}

function contourToShape(points: Point[], imageWidth: number, imageHeight: number): THREE.Shape {
  const shape = new THREE.Shape();
  appendContour(shape, points, imageWidth, imageHeight);
  return shape;
}

function contourToPath(points: Point[], imageWidth: number, imageHeight: number): THREE.Path {
  const path = new THREE.Path();
  appendContour(path, points, imageWidth, imageHeight);
  return path;
}

function appendContour(
  path: THREE.Path,
  points: Point[],
  imageWidth: number,
  imageHeight: number,
): void {
  const maxDim = Math.max(imageWidth, imageHeight);
  const scale = UNIT_SCALE / maxDim;
  const offsetX = (-imageWidth / 2) * scale;
  const offsetY = (-imageHeight / 2) * scale;

  const first = points[0]!;
  path.moveTo(first.x * scale + offsetX, -(first.y * scale + offsetY));
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    path.lineTo(p.x * scale + offsetX, -(p.y * scale + offsetY));
  }
  path.closePath();
}

function shapeFromPoints(points: THREE.Vector2[]): THREE.Shape {
  const shape = new THREE.Shape();
  const first = points[0];
  if (!first) return shape;
  shape.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i++) {
    const point = points[i]!;
    shape.lineTo(point.x, point.y);
  }
  shape.closePath();
  return shape;
}

function shapeWithCounters(outerShape: THREE.Shape, counters: THREE.Path[]): THREE.Shape {
  const solidProfile = shapeFromPoints(outerShape.getPoints(64));
  for (const counter of counters) {
    solidProfile.holes.push(new THREE.Path(counter.getPoints(64)));
  }
  return solidProfile;
}

function createLogoMesh(
  outerShape: THREE.Shape,
  counters: THREE.Path[],
  depthMm: number,
  material: THREE.MeshStandardMaterial,
): THREE.Mesh {
  const solidProfile = shapeWithCounters(outerShape, counters);
  return new THREE.Mesh(createExtrudedGeometry(solidProfile, depthMm), material);
}

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

function hexToColor(hex: string): THREE.Color {
  const h = hex.replace(/^#/, "");
  return new THREE.Color(parseInt(h, 16) / (h.length === 3 ? 0xfff : 0xffffff));
}

function createClayMaterial(colorHex: string | undefined): THREE.MeshStandardMaterial {
  const color = colorHex ? hexToColor(colorHex) : new THREE.Color("#C4956A");
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0.0,
    bumpMap: generateClayBumpMap(),
    bumpScale: 0.006,
  });
  material.name = "clay";
  return material;
}

function createExportMaterial(colorHex: string | undefined): THREE.MeshStandardMaterial {
  const color = colorHex ? hexToColor(colorHex) : new THREE.Color("#C4956A");
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0.0,
    // The MTL exporter links the generated bump map separately.
  });
  material.name = "clay";
  return material;
}

function createBackingMaterial(): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#A99C90"),
    roughness: 0.9,
    metalness: 0,
  });
  material.name = "backing";
  return material;
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

function createExtrudedGeometry(shape: THREE.Shape, depthMm: number): THREE.BufferGeometry {
  const depth = depthMm / 30;
  const bevelThickness = depth * BEVEL_THICKNESS_RATIO;
  const bevelSize = depth * BEVEL_SIZE_RATIO;
  const bevelOffset = depth * BEVEL_OFFSET_RATIO;

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelOffset,
    bevelSegments: BEVEL_SEGMENTS,
    curveSegments: 1,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  return toCreasedNormals(geometry, Math.PI / 3);
}

function createRoundedRectangle(center: THREE.Vector3, width: number, height: number): THREE.Shape {
  const left = center.x - width / 2;
  const right = center.x + width / 2;
  const bottom = center.y - height / 2;
  const top = center.y + height / 2;
  const radius = Math.min(RELIEF_CORNER_RADIUS, width / 4, height / 4);
  const shape = new THREE.Shape();
  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.quadraticCurveTo(right, bottom, right, bottom + radius);
  shape.lineTo(right, top - radius);
  shape.quadraticCurveTo(right, top, right - radius, top);
  shape.lineTo(left + radius, top);
  shape.quadraticCurveTo(left, top, left, top - radius);
  shape.lineTo(left, bottom + radius);
  shape.quadraticCurveTo(left, bottom, left + radius, bottom);
  shape.closePath();
  return shape;
}

function addReliefBacking(scene: THREE.Scene, material: THREE.MeshStandardMaterial): void {
  const logoChildren = [...scene.children];
  const logoBox = new THREE.Box3().setFromObject(scene);
  const logoSize = new THREE.Vector3();
  const logoCenter = new THREE.Vector3();
  logoBox.getSize(logoSize);
  logoBox.getCenter(logoCenter);
  const shape = createRoundedRectangle(
    logoCenter,
    logoSize.x + RELIEF_BORDER * 2,
    logoSize.y + RELIEF_BORDER * 2,
  );
  const backing = new THREE.Mesh(createExtrudedGeometry(shape, RELIEF_BACKING_DEPTH_MM), material);
  backing.userData["objectName"] = "relief_backing";
  const logoOffset = (RELIEF_BACKING_DEPTH_MM / 30) * 0.8;
  for (const child of logoChildren) child.position.z += logoOffset;
  scene.add(backing);
}

// ---------------------------------------------------------------------------
// Scene setup
// ---------------------------------------------------------------------------

function setupLighting(scene: THREE.Scene): void {
  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(1.5, 2.5, 3);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffeedd, 0.5);
  fill.position.set(-1.5, 0.5, 1);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.35);
  rim.position.set(0, -1, -0.5);
  scene.add(rim);
}

function setupCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.2, 4);
  camera.lookAt(0, 0, 0);
  return camera;
}

// ---------------------------------------------------------------------------
// OBJ + MTL export
// ---------------------------------------------------------------------------

interface ObjResult {
  obj: string;
  mtl: string;
}

interface DataTextureImage {
  data: Uint8Array;
  width: number;
  height: number;
}

function mtlColor(hex: string): string {
  const normalized = hex.replace(/^#/, "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => character.repeat(2))
          .join("")
      : normalized;
  return [0, 2, 4]
    .map((offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16) / 255)
    .join(" ");
}

function exportObjMtl(
  scene: THREE.Scene,
  clayColor: string,
  materialFilename: string,
  bumpFilename: string,
  hasBacking: boolean,
): ObjResult {
  const objLines: string[] = ["# Clay logo mesh", `mtllib ${materialFilename}`, ""];
  const mtlLines: string[] = [
    "# Clay material",
    "",
    "newmtl clay",
    `Kd ${mtlColor(clayColor)}`,
    "Ks 0.05 0.05 0.05",
    "Ns 10",
    "d 1.0",
    "illum 2",
    `map_Bump -bm 0.1 ${bumpFilename}`,
    "",
  ];
  if (hasBacking) {
    mtlLines.push(
      "newmtl backing",
      "Kd 0.663 0.612 0.565",
      "Ks 0.03 0.03 0.03",
      "Ns 8",
      "d 1.0",
      "illum 2",
      "",
    );
  }
  let vertexOffset = 0;
  let meshIndex = 0;
  scene.updateMatrixWorld(true);

  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    const geom = mesh.geometry;
    if (!geom || typeof geom.getAttribute !== "function" || typeof geom.getIndex !== "function")
      return;

    const pos = geom.getAttribute("position");
    const norm = geom.getAttribute("normal");
    const idx = geom.getIndex();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
    meshIndex++;

    for (let i = 0; i < pos.count; i++) {
      const vertex = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(
        mesh.matrixWorld,
      );
      objLines.push(`v ${vertex.x} ${vertex.y} ${vertex.z}`);
    }

    if (norm) {
      for (let i = 0; i < norm.count; i++) {
        const normal = new THREE.Vector3(norm.getX(i), norm.getY(i), norm.getZ(i))
          .applyMatrix3(normalMatrix)
          .normalize();
        objLines.push(`vn ${normal.x} ${normal.y} ${normal.z}`);
      }
    }

    const objectName =
      typeof mesh.userData["objectName"] === "string"
        ? (mesh.userData["objectName"] as string)
        : `logo_${meshIndex}`;
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    objLines.push(`o ${objectName}`);
    objLines.push(`usemtl ${material?.name || "clay"}`);
    objLines.push("s 1");

    if (idx) {
      for (let i = 0; i < idx.count; i += 3) {
        const a = idx.getX(i) + 1 + vertexOffset;
        const b = idx.getX(i + 1) + 1 + vertexOffset;
        const c = idx.getX(i + 2) + 1 + vertexOffset;
        if (norm) {
          objLines.push(`f ${a}//${a} ${b}//${b} ${c}//${c}`);
        } else {
          objLines.push(`f ${a} ${b} ${c}`);
        }
      }
    } else {
      for (let i = 0; i < pos.count; i += 3) {
        const a = i + 1 + vertexOffset;
        const b = i + 2 + vertexOffset;
        const c = i + 3 + vertexOffset;
        if (norm) {
          objLines.push(`f ${a}//${a} ${b}//${b} ${c}//${c}`);
        } else {
          objLines.push(`f ${a} ${b} ${c}`);
        }
      }
    }

    vertexOffset += pos.count;
  });

  return { obj: objLines.join("\n"), mtl: mtlLines.join("\n") };
}

async function createBumpTextureBuffer(): Promise<Buffer> {
  const map = generateClayBumpMap();
  const image = map.image as DataTextureImage;
  const pixels = Uint8Array.from(image.data, (value) =>
    clampColorByte(Math.round(128 + (value - 128) * 0.6)),
  );
  return sharp(pixels, {
    raw: { width: image.width, height: image.height, channels: 1 },
  })
    .png()
    .toBuffer();
}

// ---------------------------------------------------------------------------
// Preview render (optional, requires headless WebGL)
// ---------------------------------------------------------------------------

async function renderPreview(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
): Promise<Buffer | null> {
  try {
    // Try using the 'gl' package for headless WebGL rendering.
    // This is optional — OBJ/MTL export works without it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const createGL = (await import("gl")).default as (
      w: number,
      h: number,
      opts?: Record<string, unknown>,
    ) => WebGLRenderingContext;

    const glCtx = createGL(width, height, {
      preserveDrawingBuffer: true,
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
    });

    const canvas = {
      width,
      height,
      clientWidth: width,
      clientHeight: height,
      getContext: () => glCtx,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        right: width,
        bottom: height,
        width,
        height,
      }),
    };

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas as unknown as HTMLCanvasElement,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    renderer.render(scene, camera);

    const pixels = new Uint8Array(width * height * 4);
    glCtx.readPixels(0, 0, width, height, glCtx.RGBA, glCtx.UNSIGNED_BYTE, pixels);

    renderer.dispose();

    // Flip vertically (WebGL origin is bottom-left).
    const flipped = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
      const srcRow = (height - 1 - y) * width * 4;
      const dstRow = y * width * 4;
      flipped.set(pixels.subarray(srcRow, srcRow + width * 4), dstRow);
    }

    const preview = await sharp(flipped, { raw: { width, height, channels: 4 } })
      .png()
      .toBuffer();

    return preview;
  } catch {
    // Headless WebGL not available; preview generation skipped.
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a clay 3D asset from a logo.
 *
 * Extracts the logo contour, creates an extruded 3D mesh with PBR clay
 * material, exports OBJ/MTL files, and optionally renders a preview PNG.
 * Returns paths to the generated files.
 */
async function checkDeps(): Promise<void> {
  try {
    await import("sharp");
    await import("three");
  } catch {
    throw new Error(
      "Missing dependencies. Run: npm install\n" +
        "  cd creator-brand-skills/logo-to-clay && npm install",
    );
  }
}

export async function buildClayAsset(options: ClayOptions): Promise<{
  meshPath: string;
  materialPath: string;
  bumpPath: string;
  previewPath: string | null;
  manifestPath: string;
}> {
  await checkDeps();

  const isSvg = options.logoPath.toLowerCase().endsWith(".svg");
  const shapeType = options.shape ?? "object";
  const depth = options.depth ?? 4;

  const exportScene = new THREE.Scene();
  const previewScene = new THREE.Scene();
  let cavityCount = 0;

  const {
    shapes: rasterShapes,
    w: maskW,
    h: maskH,
  } = await extractShapesFromImage(options.logoPath, isSvg ? 1024 : 512);
  const exportMat = createExportMaterial(options.clayColor);
  const previewMat = createClayMaterial(options.clayColor);

  for (const rasterShape of rasterShapes) {
    const outerShape = contourToShape(rasterShape.outer, maskW, maskH);
    const holes = rasterShape.holes.map((hole) => contourToPath(hole, maskW, maskH));
    cavityCount += holes.length;
    exportScene.add(createLogoMesh(outerShape, holes, depth, exportMat));
    previewScene.add(createLogoMesh(outerShape, holes, depth, previewMat));
  }

  if (shapeType === "relief") {
    addReliefBacking(exportScene, createBackingMaterial());
    addReliefBacking(previewScene, createBackingMaterial());
  }

  // Center and export.
  const exportBox = new THREE.Box3().setFromObject(exportScene);
  const exportCenter = new THREE.Vector3();
  exportBox.getCenter(exportCenter);
  for (const child of exportScene.children) {
    child.position.sub(exportCenter);
  }

  const meshPath = makeOutputPath(options.logoPath, "mesh.obj", options.outputDir);
  const mtlPath = makeOutputPath(options.logoPath, "clay.mtl", options.outputDir);
  const bumpPath = makeOutputPath(options.logoPath, "bump.png", options.outputDir);
  const clayHex = options.clayColor ?? "#C4956A";
  const { obj: objData, mtl: mtlData } = exportObjMtl(
    exportScene,
    clayHex,
    basename(mtlPath),
    basename(bumpPath),
    shapeType === "relief",
  );
  const bumpData = await createBumpTextureBuffer();
  await writeOutputFile(meshPath, Buffer.from(objData, "utf-8"));
  await writeOutputFile(mtlPath, Buffer.from(mtlData, "utf-8"));
  await writeOutputFile(bumpPath, bumpData);

  const previewBox = new THREE.Box3().setFromObject(previewScene);
  const previewCenter = new THREE.Vector3();
  previewBox.getCenter(previewCenter);
  for (const child of previewScene.children) {
    child.position.sub(previewCenter);
  }

  setupLighting(previewScene);
  const camera = setupCamera();

  // Render preview.
  const previewSize = 1024;
  const previewBuffer =
    (await renderPreview(previewScene, camera, previewSize, previewSize)) ??
    (await renderFallbackPreview(options, previewSize));
  let previewPath: string | null = null;
  if (previewBuffer) {
    previewPath = makeOutputPath(options.logoPath, "preview.png", options.outputDir);
    await writeOutputFile(previewPath, previewBuffer);
  }

  // Write metadata record.
  const manifestPath = await writeRecord(
    options.logoPath,
    {
      contractVersion: "1.0",
      source: { logoPath: options.logoPath },
      spec: {
        output: options.output ?? "both",
        shape: shapeType,
        depth,
        clayColor: options.clayColor ?? "auto",
        background: options.background ?? "studio",
      },
      backing: {
        enabled: shapeType === "relief",
        depth: shapeType === "relief" ? RELIEF_BACKING_DEPTH_MM : 0,
      },
      cavities: {
        mode: "through",
        depth,
        count: cavityCount,
      },
      rounding: {
        bevelThickness: Number((depth * BEVEL_THICKNESS_RATIO).toFixed(3)),
        bevelSize: Number((depth * BEVEL_SIZE_RATIO).toFixed(3)),
        bevelOffset: Number((depth * BEVEL_OFFSET_RATIO).toFixed(3)),
        bevelSegments: BEVEL_SEGMENTS,
      },
      artifacts: { meshPath, materialPath: mtlPath, bumpPath, previewPath },
      validation: { passed: false, checks: [] },
    },
    options.outputDir,
  );

  return { meshPath, materialPath: mtlPath, bumpPath, previewPath, manifestPath };
}

async function renderFallbackPreview(options: ClayOptions, size: number): Promise<Buffer> {
  const clayColor = options.clayColor ?? "#C4956A";
  const background =
    options.background === "transparent"
      ? { r: 255, g: 255, b: 255, alpha: 0 }
      : { r: 242, g: 236, b: 228, alpha: 1 };
  const { data, info } = await sharp(options.logoPath)
    .ensureAlpha()
    .resize({ width: Math.round(size * 0.68), height: Math.round(size * 0.68), fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mask = erodeMask(
    createForegroundMask(data, info.width, info.height),
    info.width,
    info.height,
    RASTER_EROSION_RADIUS,
  );
  const baseColor = parseHexColor(clayColor);
  const frontBuffer = colorizeMask(mask, baseColor, 1, 2);
  const sideBuffer = colorizeMask(mask, scaleColor(baseColor, 0.42), 1, 0);
  const rimBuffer = colorizeMask(mask, brightenColor(baseColor, 28), 0.85, 0);
  const front = await sharp(frontBuffer, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .blur(0.35)
    .png()
    .toBuffer();
  const left = Math.round((size - info.width) / 2);
  const top = Math.round((size - info.height) / 2);
  const depthPixels = Math.max(3, Math.round((options.depth ?? 4) * 1.2));
  const shadowBuffer = colorizeMask(mask, [0, 0, 0], 0.24, 0);
  const shadow = await sharp({
    create: { width: size, height: size, channels: 4, background: "#00000000" },
  })
    .composite([
      {
        input: shadowBuffer,
        raw: { width: info.width, height: info.height, channels: 4 },
        left: left + depthPixels + 10,
        top: top + depthPixels + 14,
      },
    ])
    .blur(Math.max(4, Math.round(size * 0.018)))
    .png()
    .toBuffer();
  const layers: Parameters<ReturnType<typeof sharp>["composite"]>[0] = [{ input: shadow }];
  if (options.shape === "relief") {
    const plaqueWidth = Math.min(size - 80, info.width + 96);
    const plaqueHeight = Math.min(size - 80, info.height + 96);
    const plaque = Buffer.from(
      `<svg width="${plaqueWidth}" height="${plaqueHeight}">` +
        `<rect x="2" y="2" width="${plaqueWidth - 4}" height="${plaqueHeight - 4}" ` +
        `rx="22" fill="#A99C90" stroke="#8F8277" stroke-width="2"/>` +
        `</svg>`,
    );
    layers.unshift({
      input: plaque,
      left: Math.round((size - plaqueWidth) / 2),
      top: Math.round((size - plaqueHeight) / 2),
    });
  }
  for (let offset = depthPixels; offset >= 1; offset--) {
    layers.push({
      input: sideBuffer,
      raw: { width: info.width, height: info.height, channels: 4 },
      left: left + offset,
      top: top + Math.round(offset * 0.65),
    });
  }
  layers.push({
    input: rimBuffer,
    raw: { width: info.width, height: info.height, channels: 4 },
    left: left - 1,
    top: top - 1,
  });
  layers.push({ input: front, left, top });

  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite(layers)
    .png()
    .toBuffer();
}

type RgbColor = [number, number, number];

function colorizeMask(
  mask: Uint8Array,
  color: RgbColor,
  alphaScale: number,
  grainStrength: number,
): Buffer {
  const [red, green, blue] = color;
  const output = Buffer.alloc(mask.length * 4);
  for (let index = 0; index < mask.length; index++) {
    const offset = index * 4;
    const grain = grainStrength === 0 ? 0 : ((index * 73 + 19) % 7) - 3;
    output[offset] = clampColorByte(red + grain * grainStrength);
    output[offset + 1] = clampColorByte(green + grain * grainStrength);
    output[offset + 2] = clampColorByte(blue + grain * grainStrength);
    output[offset + 3] = mask[index] ? Math.round(255 * alphaScale) : 0;
  }
  return output;
}

function scaleColor(color: RgbColor, factor: number): RgbColor {
  return color.map((channel) => clampColorByte(Math.round(channel * factor))) as RgbColor;
}

function brightenColor(color: RgbColor, amount: number): RgbColor {
  return color.map((channel) => clampColorByte(channel + amount)) as RgbColor;
}

function parseHexColor(value: string): RgbColor {
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ];
}

function clampColorByte(value: number): number {
  return Math.max(0, Math.min(255, value));
}
