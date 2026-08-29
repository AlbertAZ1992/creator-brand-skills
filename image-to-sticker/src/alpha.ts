// Adapted from CatsJuice/sticker-forge (MIT), Copyright (c) 2026 CatsJuice.
// See THIRD_PARTY_NOTICES.md for the full license notice.

const VISIBLE_ALPHA_THRESHOLD = 26;
const DISTANCE_INFINITY = 1_000_000_000_000;
type AlphaArray = Uint8Array | Uint8ClampedArray;

function assertDimensions(alpha: AlphaArray, width: number, height: number): void {
  if (width < 1 || height < 1 || alpha.length !== width * height) {
    throw new Error("Alpha dimensions do not match the supplied buffer");
  }
}

export function createExteriorAlphaMask(
  alpha: AlphaArray,
  width: number,
  height: number,
): Uint8Array {
  assertDimensions(alpha, width, height);
  const exterior = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let queueStart = 0;
  let queueEnd = 0;
  const enqueue = (x: number, y: number): void => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const index = y * width + x;
    if (exterior[index] || (alpha[index] ?? 0) >= VISIBLE_ALPHA_THRESHOLD) return;
    exterior[index] = 1;
    queue[queueEnd] = index;
    queueEnd += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }
  while (queueStart < queueEnd) {
    const index = queue[queueStart] ?? 0;
    queueStart += 1;
    const x = index % width;
    const y = Math.floor(index / width);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }
  return exterior;
}

function intersectionAt(
  source: Float32Array,
  sourceOffset: number,
  sourceStride: number,
  position: number,
  previous: number,
): number {
  const currentValue = source[sourceOffset + position * sourceStride] ?? 0;
  const previousValue = source[sourceOffset + previous * sourceStride] ?? 0;
  return (
    (currentValue + position * position - (previousValue + previous * previous)) /
    (2 * position - 2 * previous)
  );
}

function distanceTransform1D(
  source: Float32Array,
  sourceOffset: number,
  sourceStride: number,
  target: Float32Array,
  targetOffset: number,
  targetStride: number,
  length: number,
  parabolas: Int32Array,
  boundaries: Float64Array,
): void {
  let envelopeIndex = 0;
  parabolas[0] = 0;
  boundaries[0] = Number.NEGATIVE_INFINITY;
  boundaries[1] = Number.POSITIVE_INFINITY;
  for (let position = 1; position < length; position += 1) {
    let previous = parabolas[envelopeIndex] ?? 0;
    let intersection = intersectionAt(source, sourceOffset, sourceStride, position, previous);
    while (intersection <= (boundaries[envelopeIndex] ?? 0)) {
      envelopeIndex -= 1;
      previous = parabolas[envelopeIndex] ?? 0;
      intersection = intersectionAt(source, sourceOffset, sourceStride, position, previous);
    }
    envelopeIndex += 1;
    parabolas[envelopeIndex] = position;
    boundaries[envelopeIndex] = intersection;
    boundaries[envelopeIndex + 1] = Number.POSITIVE_INFINITY;
  }
  envelopeIndex = 0;
  for (let position = 0; position < length; position += 1) {
    while ((boundaries[envelopeIndex + 1] ?? 0) < position) envelopeIndex += 1;
    const nearest = parabolas[envelopeIndex] ?? 0;
    const delta = position - nearest;
    target[targetOffset + position * targetStride] =
      delta * delta + (source[sourceOffset + nearest * sourceStride] ?? 0);
  }
}

function runDistanceTransform(
  distances: Float32Array,
  rowDistances: Float32Array,
  width: number,
  height: number,
): void {
  const maxLength = Math.max(width, height);
  const parabolas = new Int32Array(maxLength);
  const boundaries = new Float64Array(maxLength + 1);
  for (let y = 0; y < height; y += 1) {
    distanceTransform1D(
      distances,
      y * width,
      1,
      rowDistances,
      y * width,
      1,
      width,
      parabolas,
      boundaries,
    );
  }
  for (let x = 0; x < width; x += 1) {
    distanceTransform1D(rowDistances, x, width, distances, x, width, height, parabolas, boundaries);
  }
}

export function expandAlphaMask(
  alpha: AlphaArray,
  width: number,
  height: number,
  radius: number,
): Uint8ClampedArray {
  assertDimensions(alpha, width, height);
  const size = width * height;
  const distances = new Float32Array(size);
  const rowDistances = new Float32Array(size);
  let hasSeed = false;
  for (let index = 0; index < size; index += 1) {
    const occupied = (alpha[index] ?? 0) >= VISIBLE_ALPHA_THRESHOLD;
    distances[index] = occupied ? 0 : DISTANCE_INFINITY;
    hasSeed ||= occupied;
  }
  if (!hasSeed) return new Uint8ClampedArray(size);
  runDistanceTransform(distances, rowDistances, width, height);
  const expanded = new Uint8ClampedArray(size);
  for (let index = 0; index < size; index += 1) {
    const distance = Math.sqrt(distances[index] ?? 0);
    const coverage = Math.min(1, Math.max(0, radius + 0.5 - distance));
    expanded[index] = Math.round(coverage * 255);
  }
  return expanded;
}
