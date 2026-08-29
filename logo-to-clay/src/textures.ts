import * as THREE from "three";

const TEX_SIZE = 512;

/**
 * Generate a clay bump map texture (512x512 grayscale).
 *
 * Creates low-frequency procedural noise using layered sine/cosine
 * combinations, producing restrained micro-variation on finely kneaded clay.
 */
export function generateClayBumpMap(): THREE.DataTexture {
  const size = TEX_SIZE;
  const pixels = new Uint8Array(size * size);

  let seed = 137;
  const rand = (): number => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };

  const offsets = Array.from({ length: 6 }, () => ({
    fx: 1.5 + rand() * 3,
    fy: 2 + rand() * 4,
    px: rand() * Math.PI * 2,
    py: rand() * Math.PI * 2,
    amp: 0.3 + rand() * 1.0,
  }));

  for (let y = 0; y < size; y++) {
    const ny = y / size;
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      let value = 0.5;
      for (const o of offsets) {
        value +=
          o.amp *
          Math.sin(nx * o.fx * Math.PI * 2 + o.px) *
          Math.cos(ny * o.fy * Math.PI * 2 + o.py) *
          0.12;
      }
      // Add small high-frequency detail.
      value += Math.sin(nx * 32 + ny * 27) * Math.cos(ny * 29 - nx * 31) * 0.02;
      pixels[y * size + x] = clampByte(Math.round(value * 255));
    }
  }

  const texture = new THREE.DataTexture(pixels, size, size, THREE.RedFormat);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  return texture;
}

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, v));
}
