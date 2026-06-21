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

// Normalize all features of a list of points to a [0, 1] range
export function normalizeFeatures(points: DBSCANInputPoint[]): DBSCANInputPoint[] {
  if (points.length === 0) return [];
  
  const numFeatures = points[0].features.length;
  const mins = new Array(numFeatures).fill(Infinity);
  const maxs = new Array(numFeatures).fill(-Infinity);

  // Find min and max for each feature
  for (const p of points) {
    for (let i = 0; i < numFeatures; i++) {
      const v = p.features[i];
      if (v < mins[i]) mins[i] = v;
      if (v > maxs[i]) maxs[i] = v;
    }
  }

  // Normalize
  return points.map(p => {
    const normalizedFeatures = p.features.map((v, i) => {
      const range = maxs[i] - mins[i];
      if (range === 0) return 0.5; // default if no variation
      return (v - mins[i]) / range;
    });
    return {
      ...p,
      features: normalizedFeatures,
      // Store original features for reference
      rawFeatures: [...p.features]
    };
  });
}

// Compute Euclidean distance between two feature vectors with weights
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

// Run DBSCAN
export function runDBSCAN(
  points: DBSCANInputPoint[],
  eps: number,
  minSamples: number,
  weights: number[]
): Map<string, DBSCANResult> {
  const n = points.length;
  const results = new Map<string, DBSCANResult>();
  
  // Initialize all as noise first
  for (const p of points) {
    results.set(p.id, {
      clusterId: -1,
      isCore: false,
      isBorder: false,
      isNoise: true,
    });
  }

  if (n === 0) return results;

  // Helper to get neighbors
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
    if (neighbors.length < minSamples) {
      // Keep as noise
      continue;
    }

    // Core point found
    results.set(points[i].id, {
      clusterId: currentClusterId,
      isCore: true,
      isBorder: false,
      isNoise: false,
    });

    const queue: number[] = [];
    // Push all neighbors to the expansion queue
    for (const idx of neighbors) {
      if (idx !== i) queue.push(idx);
    }

    for (let qIdx = 0; qIdx < queue.length; qIdx++) {
      const neighborIdx = queue[qIdx];

      if (!visited.has(neighborIdx)) {
        visited.add(neighborIdx);
        const neighborNeighbors = getNeighbors(neighborIdx);
        
        if (neighborNeighbors.length >= minSamples) {
          // If the neighbor is also a core point, expand search to its neighbors
          for (const nnIdx of neighborNeighbors) {
            if (!queue.includes(nnIdx) && nnIdx !== i) {
              queue.push(nnIdx);
            }
          }
          // Mark as core
          const curr = results.get(points[neighborIdx].id)!;
          results.set(points[neighborIdx].id, {
            ...curr,
            clusterId: currentClusterId,
            isCore: true,
            isNoise: false,
          });
        } else {
          // Border point
          const curr = results.get(points[neighborIdx].id)!;
          results.set(points[neighborIdx].id, {
            ...curr,
            clusterId: currentClusterId,
            isBorder: true,
            isNoise: false,
          });
        }
      } else {
        // Point was visited but might have been noise. Now it belongs to this cluster.
        const curr = results.get(points[neighborIdx].id)!;
        if (curr.clusterId === -1) {
          results.set(points[neighborIdx].id, {
            ...curr,
            clusterId: currentClusterId,
            isNoise: false,
            // Keep its core/border designation if it was already marked, or set it to border
            isBorder: !curr.isCore,
          });
        }
      }
    }

    currentClusterId++;
  }

  return results;
}
