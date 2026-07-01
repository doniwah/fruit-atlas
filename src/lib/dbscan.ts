export interface DBSCANInputPoint {
  id: string;
  features: number[]; // [hue, saturation, value, circularity, aspectRatio]
  [key: string]: any;
}

export interface DBSCANResult {
  clusterId: number; // -1 for noise, 0, 1, 2... for clusters
  isCore: boolean;
  isBorder: boolean;
  isNoise: boolean;
}

// Normalize all features of a list of points to a [0, 1] range.
// Hue (index 0) is circular [0, 360] — we encode it as sin/cos pair so
// that hue 355° and 5° are correctly treated as close.
export function normalizeFeatures(points: DBSCANInputPoint[]): DBSCANInputPoint[] {
  if (points.length === 0) return [];

  const numFeatures = points[0].features.length; // [hue, sat, val, circ, ar]

  // For non-hue features find min/max for min-max scaling
  const mins = new Array(numFeatures).fill(Infinity);
  const maxs = new Array(numFeatures).fill(-Infinity);

  for (const p of points) {
    for (let i = 1; i < numFeatures; i++) { // skip index 0 (hue)
      const v = p.features[i];
      if (v < mins[i]) mins[i] = v;
      if (v > maxs[i]) maxs[i] = v;
    }
  }

  // Expand hue into sin/cos components, then min-max normalize the rest.
  // Final feature vector: [sinH_norm, cosH_norm, sat_norm, val_norm, circ_norm, ar_norm]
  return points.map(p => {
    const hueRad = (p.features[0] / 360) * 2 * Math.PI;
    // sin/cos in [-1,1] → shift to [0,1]
    const sinH = (Math.sin(hueRad) + 1) / 2;
    const cosH = (Math.cos(hueRad) + 1) / 2;

    const rest = p.features.slice(1).map((v, i) => {
      const fi = i + 1; // original feature index
      const range = maxs[fi] - mins[fi];
      if (range === 0) return 0.5;
      return (v - mins[fi]) / range;
    });

    return {
      ...p,
      features: [sinH, cosH, ...rest],
      rawFeatures: [...p.features],
    };
  });
}

// Compute weighted Euclidean distance between two feature vectors
export function euclideanDistance(a: number[], b: number[], weights: number[]): number {
  let sum = 0;
  let weightSum = 0;
  for (let i = 0; i < a.length; i++) {
    const w = weights[i] !== undefined ? weights[i] : 1;
    sum += w * Math.pow(a[i] - b[i], 2);
    weightSum += w;
  }
  return Math.sqrt(sum / (weightSum || 1));
}

// Build weight vector for the expanded feature space [sinH, cosH, sat, val, circ, ar]
export function buildWeights(featureMode: string): number[] {
  if (featureMode === "color") {
    // Emphasise hue (both sin+cos) and saturation, ignore shape
    return [1.5, 1.5, 1.0, 0.5, 0, 0];
  } else if (featureMode === "shape") {
    // Ignore color, emphasise circularity and aspect ratio
    return [0, 0, 0, 0, 1.5, 1.0];
  }
  // "both" — balanced
  return [1.0, 1.0, 0.8, 0.8, 1.2, 1.0];
}

// Run DBSCAN
export function runDBSCAN(
  points: DBSCANInputPoint[],
  eps: number,
  minSamples: number,
  weights: number[]
): Map<string, DBSCANResult> {
  const n = points.length;
  const results = new Map<string, DBSCANResult>();

  // Initialize all as noise
  for (const p of points) {
    results.set(p.id, { clusterId: -1, isCore: false, isBorder: false, isNoise: true });
  }

  if (n === 0) return results;

  const getNeighbors = (idx: number): number[] => {
    const neighbors: number[] = [];
    const p1 = points[idx];
    for (let i = 0; i < n; i++) {
      if (euclideanDistance(p1.features, points[i].features, weights) <= eps) {
        neighbors.push(i);
      }
    }
    return neighbors;
  };

  const visited = new Set<number>();
  let currentClusterId = 0;

  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue;
    visited.add(i);

    const neighbors = getNeighbors(i);
    if (neighbors.length < minSamples) continue; // stays noise

    // Core point
    results.set(points[i].id, { clusterId: currentClusterId, isCore: true, isBorder: false, isNoise: false });

    const queue: number[] = neighbors.filter(idx => idx !== i);

    for (let qIdx = 0; qIdx < queue.length; qIdx++) {
      const neighborIdx = queue[qIdx];

      if (!visited.has(neighborIdx)) {
        visited.add(neighborIdx);
        const nn = getNeighbors(neighborIdx);

        if (nn.length >= minSamples) {
          for (const nnIdx of nn) {
            if (!queue.includes(nnIdx) && nnIdx !== i) queue.push(nnIdx);
          }
          results.set(points[neighborIdx].id, { clusterId: currentClusterId, isCore: true, isBorder: false, isNoise: false });
        } else {
          results.set(points[neighborIdx].id, { clusterId: currentClusterId, isCore: false, isBorder: true, isNoise: false });
        }
      } else {
        const curr = results.get(points[neighborIdx].id)!;
        if (curr.clusterId === -1) {
          results.set(points[neighborIdx].id, { ...curr, clusterId: currentClusterId, isNoise: false, isBorder: !curr.isCore });
        }
      }
    }

    currentClusterId++;
  }

  return results;
}

// --- Nearest-neighbour fallback classifier ---
// When a point is classified as noise by DBSCAN, find the closest
// non-noise point and adopt its cluster so the user always gets a
// meaningful fruit label (not "Derau").
export function assignNearestCluster(
  noisePointId: string,
  allPoints: DBSCANInputPoint[],
  results: Map<string, DBSCANResult>,
  weights: number[]
): DBSCANResult {
  const noisePoint = allPoints.find(p => p.id === noisePointId);
  if (!noisePoint) return { clusterId: -1, isCore: false, isBorder: false, isNoise: true };

  let bestDist = Infinity;
  let bestResult: DBSCANResult = { clusterId: -1, isCore: false, isBorder: false, isNoise: true };

  for (const p of allPoints) {
    if (p.id === noisePointId) continue;
    const r = results.get(p.id);
    if (!r || r.clusterId === -1) continue; // skip other noise points

    const dist = euclideanDistance(noisePoint.features, p.features, weights);
    if (dist < bestDist) {
      bestDist = dist;
      bestResult = { clusterId: r.clusterId, isCore: false, isBorder: true, isNoise: false };
    }
  }

  return bestResult;
}
