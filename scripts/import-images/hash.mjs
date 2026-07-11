// Difference-hash (dHash) perceptual hashing for duplicate detection.
// Two images with a small Hamming distance between their hashes look
// visually similar (near-duplicates, burst shots, accidental double-taps),
// regardless of filename or exact file bytes.

const HASH_WIDTH = 9; // 8 comparisons per row
const HASH_HEIGHT = 8; // 64 bits total

export async function computeDHash(sharp, filePath) {
  const { data } = await sharp(filePath)
    .rotate()
    .greyscale()
    .resize(HASH_WIDTH, HASH_HEIGHT, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let hash = 0n;
  let bit = 0n;
  for (let row = 0; row < HASH_HEIGHT; row++) {
    for (let col = 0; col < HASH_WIDTH - 1; col++) {
      const left = data[row * HASH_WIDTH + col];
      const right = data[row * HASH_WIDTH + col + 1];
      if (left > right) hash |= 1n << bit;
      bit++;
    }
  }
  return hash;
}

export function hammingDistance(a, b) {
  let diff = a ^ b;
  let count = 0;
  while (diff) {
    diff &= diff - 1n;
    count++;
  }
  return count;
}
