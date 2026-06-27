const fs = require("fs");
const path = require("path");

// Load db.json
const dbPath = path.resolve(__dirname, "../src/lib/db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

// DBSCAN Euclidean Distance with weights
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

// Normalize features
function normalizeFeatures(points) {
  if (points.length === 0) return [];
  const numFeatures = points[0].features.length;
  const mins = new Array(numFeatures).fill(Infinity);
  const maxs = new Array(numFeatures).fill(-Infinity);

  for (const p of points) {
    for (let i = 0; i < numFeatures; i++) {
      const v = p.features[i];
      if (v < mins[i]) mins[i] = v;
      if (v > maxs[i]) maxs[i] = v;
    }
  }

  return points.map(p => {
    const normalizedFeatures = p.features.map((v, i) => {
      const range = maxs[i] - mins[i];
      if (range === 0) return 0.5;
      return (v - mins[i]) / range;
    });
    return { ...p, features: normalizedFeatures };
  });
}

// DBSCAN implementation
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

    const queue = [];
    for (const idx of neighbors) {
      if (idx !== i) queue.push(idx);
    }

    for (let qIdx = 0; qIdx < queue.length; qIdx++) {
      const neighborIdx = queue[qIdx];
      if (!visited.has(neighborIdx)) {
        visited.add(neighborIdx);
        const neighborNeighbors = getNeighbors(neighborIdx);
        if (neighborNeighbors.length >= minSamples) {
          for (const nnIdx of neighborNeighbors) {
            if (!queue.includes(nnIdx) && nnIdx !== i) queue.push(nnIdx);
          }
          const curr = results.get(points[neighborIdx].id);
          results.set(points[neighborIdx].id, { ...curr, clusterId: currentClusterId, isCore: true, isNoise: false });
        } else {
          const curr = results.get(points[neighborIdx].id);
          results.set(points[neighborIdx].id, { ...curr, clusterId: currentClusterId, isBorder: true, isNoise: false });
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

// Test with green mango features and custom eps
function test(hue, circularity, aspectRatio, epsValue) {
  const items = [...db.items];
  const tempPointId = "TEMP-RUN-0";
  items.push({
    id: tempPointId,
    name: "mangga.jpg",
    fruit: "Unknown",
    hue: hue,
    saturation: 0.75,
    value: 0.75,
    circularity: circularity,
    aspectRatio: aspectRatio,
    isSynthetic: false
  });

  const dbscanInputs = items.map(item => ({
    id: item.id,
    features: [item.hue, item.saturation, item.value, item.circularity, item.aspectRatio]
  }));

  const normalized = normalizeFeatures(dbscanInputs);
  const weights = [1, 1, 1, 1, 1];
  const clusterResults = runDBSCAN(normalized, epsValue, 4, weights);

  const resultPoints = items.map(item => {
    const dbscanRes = clusterResults.get(item.id);
    return {
      ...item,
      clusterId: dbscanRes ? dbscanRes.clusterId : -1,
      isCore: dbscanRes ? dbscanRes.isCore : false,
      isBorder: dbscanRes ? dbscanRes.isBorder : false,
      isNoise: dbscanRes ? dbscanRes.isNoise : true,
    };
  });

  const clusterFruitMapping = new Map();
  const uniqueClusterIds = Array.from(new Set(resultPoints.map(p => p.clusterId))).filter(id => id !== -1);

  for (const cid of uniqueClusterIds) {
    const clusterPoints = resultPoints.filter(p => p.clusterId === cid);
    const counts = {};
    for (const p of clusterPoints) {
      const fruit = p.fruit || "Unknown";
      counts[fruit] = (counts[fruit] || 0) + 1;
    }
    let dominantFruit = "Unknown";
    let maxCount = -1;
    for (const [fruit, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantFruit = fruit;
      }
    }
    clusterFruitMapping.set(cid, dominantFruit);
  }

  const pt = resultPoints.find(p => p.id === tempPointId);
  let clusterLabel = "Noise";
  let clusterIdStr = "C-7";

  if (pt.clusterId !== -1) {
    const mappedFruit = clusterFruitMapping.get(pt.clusterId);
    const config = db.clusterConfigs.find(c => c.label.startsWith(mappedFruit || ""));
    if (config) {
      clusterLabel = config.label;
      clusterIdStr = config.id;
    } else {
      clusterLabel = `Cluster ${pt.clusterId + 1}`;
      clusterIdStr = `C-${pt.clusterId + 1}`;
    }
  }

  console.log(`[Eps=${epsValue.toFixed(2)}] Input: Hue=${hue}, Circ=${circularity}, Aspect=${aspectRatio}`);
  console.log(`            Cluster ID: ${pt.clusterId}, Role: ${pt.isCore ? "Core" : pt.isBorder ? "Border" : "Noise"}`);
  console.log(`            Result Label: ${clusterLabel} (${clusterIdStr})`);
}

function printClusterDetails(epsValue, weights = [1, 1, 1, 1, 1]) {
  const items = [...db.items];
  const dbscanInputs = items.map(item => ({
    id: item.id,
    features: [item.hue, item.saturation, item.value, item.circularity, item.aspectRatio]
  }));

  const normalized = normalizeFeatures(dbscanInputs);
  const clusterResults = runDBSCAN(normalized, epsValue, 4, weights);

  const resultPoints = items.map(item => {
    const dbscanRes = clusterResults.get(item.id);
    return {
      ...item,
      clusterId: dbscanRes ? dbscanRes.clusterId : -1,
    };
  });

  const uniqueClusterIds = Array.from(new Set(resultPoints.map(p => p.clusterId)));
  console.log(`\n=== EPS = ${epsValue}, Weights = [${weights.join(", ")}] ===`);
  console.log(`Total Clusters (excluding noise): ${uniqueClusterIds.filter(id => id !== -1).length}`);
  
  for (const cid of uniqueClusterIds) {
    const clusterPoints = resultPoints.filter(p => p.clusterId === cid);
    const counts = {};
    for (const p of clusterPoints) {
      const fruit = p.fruit || "Unknown";
      counts[fruit] = (counts[fruit] || 0) + 1;
    }
    console.log(`Cluster ${cid}:`, JSON.stringify(counts));
  }
}

// Run test cases
// Run test cases
console.log("--- CLUSTER DETAILS WITH HIGH HUE WEIGHT ---");
printClusterDetails(0.15, [10, 1, 1, 2, 2]);
printClusterDetails(0.10, [10, 1, 1, 2, 2]);
printClusterDetails(0.08, [15, 1, 1, 2, 2]);
printClusterDetails(0.06, [15, 1, 1, 2, 2]);
printClusterDetails(0.04, [20, 1, 1, 3, 3]);
printClusterDetails(0.02, [20, 1, 1, 3, 3]);





