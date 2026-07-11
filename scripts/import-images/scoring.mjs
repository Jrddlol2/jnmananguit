// Offline heuristic scorer for cover-image selection.
//
// This is intentionally isolated behind one function with a fixed input/
// output shape so it can be swapped for an AI vision model later without
// touching the rest of the pipeline. A drop-in replacement just needs to
// match this signature:
//
//   async function scoreImage({ width, height, stats }) -> { total, breakdown }
//
// (or, for a vision model, scoreImageWithVisionModel(filePath) -> same shape)
//
// `stats` is the object returned by sharp's `.stats()` — it already gives us
// libvips' sharpness (edge/focus strength) and entropy (detail/information)
// metrics natively, so we don't hand-roll a Laplacian variance pass.

// Tunable weights — must sum to 1. Raise `sharpness`/`exposure` if covers
// keep coming out soft or badly lit; raise `resolution` if low-res phone
// shots keep winning over higher-quality captures.
export const WEIGHTS = {
  sharpness: 0.30,
  exposure: 0.20,
  resolution: 0.15,
  vibrance: 0.15,
  entropy: 0.10,
  aspect: 0.10,
};

const clamp01 = (n) => Math.max(0, Math.min(1, n));

function resolutionScore(width, height) {
  const megapixels = (width * height) / 1_000_000;
  // Diminishing returns past ~12MP — plenty for any web use, so we stop
  // rewarding raw pixel count beyond that instead of always picking the
  // biggest file.
  return clamp01(megapixels / 12);
}

function aspectScore(width, height) {
  const ratio = Math.max(width, height) / Math.min(width, height);
  // Comfortable for both a wide hero banner and a portrait grid card.
  // Falls off smoothly outside ~1:1.8, penalizing extreme panoramas/strips.
  const ideal = 1.4;
  const spread = 0.9;
  return clamp01(1 - Math.abs(ratio - ideal) / spread);
}

function sharpnessScore(sharpness) {
  // libvips sharpness has no fixed ceiling; in practice well-focused travel
  // photography lands roughly in the 1.5-15 range, blurry/soft shots well
  // under 1. Divisor is empirical, not a hard spec — tune if needed.
  return clamp01(sharpness / 12);
}

function exposureScore(meanLuminance) {
  // meanLuminance is 0-255. Score peaks at mid-tones and drops off toward
  // crushed blacks / blown highlights.
  const normalized = meanLuminance / 255;
  return clamp01(1 - Math.abs(normalized - 0.5) / 0.5);
}

function vibranceScore(channels) {
  // Average per-channel standard deviation as a contrast/color-variance
  // proxy: flat, washed-out images have low stdev; punchy, vibrant images
  // have high stdev.
  const avgStdev = channels.reduce((sum, c) => sum + c.stdev, 0) / channels.length;
  return clamp01(avgStdev / 80);
}

function entropyScore(entropy) {
  // Shannon entropy of the greyscale histogram, 0-8 bits. Low entropy means
  // a flat/empty frame (sky, wall, accidental shot); high entropy means a
  // detailed, information-rich scene.
  return clamp01(entropy / 7.5);
}

export function scoreImage({ width, height, stats }) {
  const meanLuminance = stats.channels.slice(0, 3).reduce((sum, c) => sum + c.mean, 0) / 3;

  const breakdown = {
    sharpness: sharpnessScore(stats.sharpness),
    exposure: exposureScore(meanLuminance),
    resolution: resolutionScore(width, height),
    vibrance: vibranceScore(stats.channels.slice(0, 3)),
    entropy: entropyScore(stats.entropy),
    aspect: aspectScore(width, height),
  };

  const total = Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + weight * breakdown[key],
    0
  );

  return { total, breakdown };
}
