import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('src/lib/db.json');
const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const items = dbContent.items;

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

const dbscanInputs = items.map(item => ({
  id: item.id,
  features: [item.hue, item.saturation, item.value, item.circularity, item.aspectRatio],
  fruit: item.fruit
}));

const normalized = normalizeFeatures(dbscanInputs);
const weights = [1.0, 1.0, 0.8, 0.8, 1.2, 1.0];

// Test various eps values
for (let eps of [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4]) {
  for (let minSamples of [2, 3, 4]) {
    const results = runDBSCAN(normalized, eps, minSamples, weights);
    
    // Group items
    const resultPoints = items.map(item => ({
      ...item,
      clusterId: results.get(item.id).clusterId
    }));

    const uniqueClusterIds = Array.from(new Set(resultPoints.map(p => p.clusterId))).filter(id => id !== -1);
    const clusterFruitMapping = new Map();
    const clusterSizes = {};

    for (const cid of uniqueClusterIds) {
      const clusterPoints = resultPoints.filter(p => p.clusterId === cid);
      clusterSizes[cid] = clusterPoints.length;
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

    let correct = 0;
    let total = 0;
    let noiseCount = 0;

    for (const p of resultPoints) {
      if (p.clusterId === -1) {
        noiseCount++;
        continue;
      }
      const predictedFruit = clusterFruitMapping.get(p.clusterId);
      if (predictedFruit.toLowerCase() === p.fruit.toLowerCase()) {
        correct++;
      }
      total++;
    }

    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    console.log(`eps=${eps.toFixed(2)}, minSamples=${minSamples} | clusters=${uniqueClusterIds.length}, noise=${noiseCount}, accuracy=${accuracy.toFixed(2)}% | sizes=${Object.values(clusterSizes).slice(0, 5).join(',')}${uniqueClusterIds.length > 5 ? '...' : ''}`);
  }
}
