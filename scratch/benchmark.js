import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const dbPath = path.resolve('src/lib/db.json');
const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const items = dbContent.items;

console.log(`Loaded ${items.length} items from database.`);

// 1. Normalize features helper (from dbscan.ts)
function normalizeFeatures(points) {
  if (points.length === 0) return [];
  const numFeatures = points[0].features.length;
  const mins = new Array(numFeatures).fill(Infinity);
  const maxs = new Array(numFeatures).fill(-Infinity);

  for (const p of points) {
    for (let i = 1; i < numFeatures; i++) {
      const v = p.features[i];
      if (v < mins[i]) mins[i] = v;
      if (v > maxs[i]) maxs[i] = v;
    }
  }

  return points.map(p => {
    const hueRad = (p.features[0] / 360) * 2 * Math.PI;
    const sinH = (Math.sin(hueRad) + 1) / 2;
    const cosH = (Math.cos(hueRad) + 1) / 2;

    const rest = p.features.slice(1).map((v, i) => {
      const fi = i + 1;
      const range = maxs[fi] - mins[fi];
      if (range === 0) return 0.5;
      return (v - mins[fi]) / range;
    });

    return {
      id: p.id,
      features: [sinH, cosH, ...rest],
      rawFeatures: [...p.features],
      fruit: p.fruit
    };
  });
}

// 2. Weighted Euclidean distance (from dbscan.ts)
function euclideanDistance(a, b, weights) {
  let sum = 0;
  let weightSum = 0;
  for (let i = 0; i < a.length; i++) {
    const w = weights[i] !== undefined ? weights[i] : 1;
    sum += w * Math.pow(a[i] - b[i], 2);
    weightSum += w;
  }
  return Math.sqrt(sum / (weightSum || 1));
}

// 3. DBSCAN TS implementation
function runDBSCAN(points, eps, minSamples, weights) {
  const n = points.length;
  const results = new Map();

  for (const p of points) {
    results.set(p.id, { clusterId: -1, isCore: false, isBorder: false, isNoise: true });
  }

  if (n === 0) return results;

  const getNeighbors = (idx) => {
    const neighbors = [];
    const p1 = points[idx];
    for (let i = 0; i < n; i++) {
      if (euclideanDistance(p1.features, points[i].features, weights) <= eps) {
        neighbors.push(i);
      }
    }
    return neighbors;
  };

  const visited = new Set();
  let currentClusterId = 0;

  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue;
    visited.add(i);

    const neighbors = getNeighbors(i);
    if (neighbors.length < minSamples) continue;

    results.set(points[i].id, { clusterId: currentClusterId, isCore: true, isBorder: false, isNoise: false });

    const queue = neighbors.filter(idx => idx !== i);

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
        const curr = results.get(points[neighborIdx].id);
        if (curr.clusterId === -1) {
          results.set(points[neighborIdx].id, { ...curr, clusterId: currentClusterId, isNoise: false, isBorder: !curr.isCore });
        }
      }
    }

    currentClusterId++;
  }

  return results;
}

// Prepare inputs
const dbscanInputs = items.map(item => ({
  id: item.id,
  features: [item.hue, item.saturation, item.value, item.circularity, item.aspectRatio],
  fruit: item.fruit
}));

const normalized = normalizeFeatures(dbscanInputs);
const eps = 0.35;
const minSamples = 3;
const weights = [1.0, 1.0, 0.8, 0.8, 1.2, 1.0]; // "both" mode weights

// TS Implementation Benchmark
console.log('\n--- Benchmarking TypeScript DBSCAN ---');
const tsStart = performance.now();
const tsResults = runDBSCAN(normalized, eps, minSamples, weights);
const tsEnd = performance.now();
const tsTime = tsEnd - tsStart;
console.log(`TypeScript DBSCAN completed in: ${tsTime.toFixed(2)} ms`);

// Python Implementation Benchmark
console.log('\n--- Benchmarking Python DBSCAN ---');
let pyTime = 0;
let pyResults = null;
try {
  const scriptPath = path.resolve('src/lib/dbscan.py');
  const payload = JSON.stringify({
    points: dbscanInputs,
    eps: eps,
    minSamples: minSamples,
    weights: weights,
  });

  const pyStart = performance.now();
  const output = execSync(`py -3 "${scriptPath}"`, {
    input: payload,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const pyEnd = performance.now();
  pyTime = pyEnd - pyStart;
  pyResults = new Map(Object.entries(JSON.parse(output)));
  console.log(`Python DBSCAN completed in: ${pyTime.toFixed(2)} ms`);
} catch (err) {
  console.error('Python DBSCAN execution failed:', err.message);
}

// Calculate Accuracy for TS results
function calculateMetrics(resultsMap) {
  const resultPoints = items.map(item => {
    const res = resultsMap.get(item.id);
    return {
      ...item,
      clusterId: res ? res.clusterId : -1
    };
  });

  const uniqueClusterIds = Array.from(new Set(resultPoints.map(p => p.clusterId))).filter(id => id !== -1);
  const clusterFruitMapping = new Map();

  for (const cid of uniqueClusterIds) {
    const clusterPoints = resultPoints.filter(p => p.clusterId === cid);
    const counts = {};
    for (const p of clusterPoints) {
      const fruit = p.fruit || 'Unknown';
      counts[fruit] = (counts[fruit] || 0) + 1;
    }

    let dominantFruit = 'Unknown';
    let maxCount = -1;
    for (const [fruit, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantFruit = fruit;
      }
    }
    clusterFruitMapping.set(cid, dominantFruit);
  }

  // Count correct cluster assignments
  let correct = 0;
  let total = 0;
  let noiseCount = 0;

  for (const p of resultPoints) {
    if (p.clusterId === -1) {
      noiseCount++;
      // Noise points are counted as incorrect clustering or excluded from clustering accuracy.
      // Let's count accuracy based on points that are clustered, or overall accuracy.
      // We will provide both!
      continue;
    }
    const predictedFruit = clusterFruitMapping.get(p.clusterId);
    if (predictedFruit.toLowerCase() === p.fruit.toLowerCase()) {
      correct++;
    }
    total++;
  }

  const overallTotal = resultPoints.length;
  const clusteredAccuracy = total > 0 ? (correct / total) * 100 : 0;
  const overallAccuracy = (correct / overallTotal) * 100;

  console.log(`\n--- Metrics Summary ---`);
  console.log(`Total items: ${overallTotal}`);
  console.log(`Clustered items (excluding noise): ${total}`);
  console.log(`Noise points: ${noiseCount}`);
  console.log(`Correctly clustered items: ${correct}`);
  console.log(`Clustering Accuracy (Clustered Only): ${clusteredAccuracy.toFixed(2)}%`);
  console.log(`Overall System Accuracy (including Noise as incorrect): ${overallAccuracy.toFixed(2)}%`);
}

calculateMetrics(tsResults);
