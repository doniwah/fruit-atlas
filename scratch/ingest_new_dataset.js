// scratch/ingest_new_dataset.js
import fs from 'fs';
import path from 'path';
import { Jimp } from 'jimp';

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s, v };
}

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

function buildWeights(featureMode) {
  if (featureMode === "color") {
    return [1.5, 1.5, 1.0, 0.5, 0, 0];
  } else if (featureMode === "shape") {
    return [0, 0, 0, 0, 1.5, 1.0];
  }
  return [1.0, 1.0, 0.8, 0.8, 1.2, 1.0];
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

// Ingestion Main function
async function main() {
  const dbPath = path.resolve('src/lib/db.json');
  const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  
  const datasetDir = path.resolve('src/lib/new-dataset');
  const files = fs.readdirSync(datasetDir).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp';
  });

  console.log(`Ingesting dataset: found ${files.length} images.`);

  let addedCount = 0;
  
  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    const filePath = path.join(datasetDir, file);
    const filename = file;
    
    // Determine predicted fruit from filename
    const filenameLower = filename.toLowerCase();
    let fruit = "Buah tidak ada di dataset";
    if (filenameLower.includes("apel") || filenameLower.includes("apple")) {
      fruit = "Apel";
    } else if (filenameLower.includes("jeruk") || filenameLower.includes("orange")) {
      fruit = "Jeruk";
    } else if (filenameLower.includes("pisang") || filenameLower.includes("banana")) {
      fruit = "Pisang";
    } else if (filenameLower.includes("mangga") || filenameLower.includes("mango")) {
      fruit = "Mangga";
    } else if (filenameLower.includes("anggur") || filenameLower.includes("grape")) {
      fruit = "Anggur";
    } else if (filenameLower.includes("stroberi") || filenameLower.includes("strawberry")) {
      fruit = "Stroberi";
    } else if (filenameLower.includes("lemon")) {
      fruit = "Lemon";
    } else if (filenameLower.includes("ceri") || filenameLower.includes("cherry")) {
      fruit = "Ceri";
    }

    // Check if item already exists
    const existingIdx = dbContent.items.findIndex(i => i.name === filename);
    let idStr = "";
    if (existingIdx !== -1) {
      idStr = dbContent.items[existingIdx].id;
      // Skip if already has base64 data to save time (unless we want to overwrite)
      if (dbContent.items[existingIdx].imageUrl && dbContent.items[existingIdx].imageUrl.startsWith("data:")) {
        console.log(`[SKIPPED] ${filename} already exists with base64.`);
        continue;
      }
    } else {
      idStr = `IMG-${1000 + dbContent.items.filter(i => !i.isSynthetic).length}`;
    }

    try {
      console.log(`[PROCESS] Reading and extracting features for ${filename}...`);
      const image = await Jimp.read(filePath);
      
      // Resize to 120 width to keep base64 data URL size small
      const origW = image.bitmap.width;
      const origH = image.bitmap.height;
      const newW = 120;
      const newH = Math.round(newW * origH / origW);
      image.resize({ w: newW, h: newH });

      // Generate base64 data URL
      const buffer = await image.getBuffer('image/jpeg');
      const base64Str = buffer.toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64Str}`;

      // Extract colors & shapes
      const fgPixels = [];
      let minX = newW, maxX = 0, minY = newH, maxY = 0;
      
      image.scan(0, 0, newW, newH, function(x, y, pxIdx) {
        const r = this.bitmap.data[pxIdx];
        const g = this.bitmap.data[pxIdx + 1];
        const b = this.bitmap.data[pxIdx + 2];
        
        // Background threshold (white-ish)
        const isBg = (r + g + b) / 3 > 240;
        if (!isBg) {
          const hsv = rgbToHsv(r, g, b);
          fgPixels.push({ x, y, h: hsv.h, s: hsv.s, v: hsv.v });
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      });

      if (fgPixels.length === 0) {
        image.scan(0, 0, newW, newH, function(x, y, pxIdx) {
          const r = this.bitmap.data[pxIdx];
          const g = this.bitmap.data[pxIdx + 1];
          const b = this.bitmap.data[pxIdx + 2];
          const hsv = rgbToHsv(r, g, b);
          fgPixels.push({ x, y, h: hsv.h, s: hsv.s, v: hsv.v });
        });
        minX = 0; maxX = newW - 1; minY = 0; maxY = newH - 1;
      }

      const area = fgPixels.length;
      const wBox = maxX - minX + 1;
      const hBox = maxY - minY + 1;
      const aspectRatio = parseFloat((wBox / hBox).toFixed(3));

      // Bounding edge perimeter
      const fgSet = new Set(fgPixels.map(p => `${p.x},${p.y}`));
      let perimeter = 0;
      for (const p of fgPixels) {
        const hasBgNeighbor = 
          p.x === 0 || p.x === newW - 1 ||
          p.y === 0 || p.y === newH - 1 ||
          !fgSet.has(`${p.x - 1},${p.y}`) ||
          !fgSet.has(`${p.x + 1},${p.y}`) ||
          !fgSet.has(`${p.x},${p.y - 1}`) ||
          !fgSet.has(`${p.x},${p.y + 1}`);
        if (hasBgNeighbor) perimeter++;
      }

      let circularity = (4 * Math.PI * area) / Math.pow(perimeter || 1, 2);
      circularity = parseFloat(Math.min(1.0, Math.max(0.05, circularity)).toFixed(3));

      // Average HSV values using sin/cos vectors
      let sumSin = 0, sumCos = 0, sumSat = 0, sumVal = 0;
      for (const p of fgPixels) {
        const rad = (p.h * Math.PI) / 180;
        sumSin += Math.sin(rad);
        sumCos += Math.cos(rad);
        sumSat += p.s;
        sumVal += p.v;
      }

      let hue = Math.atan2(sumSin, sumCos) * 180 / Math.PI;
      if (hue < 0) hue += 360;
      hue = parseFloat(hue.toFixed(1));
      const saturation = parseFloat((sumSat / fgPixels.length).toFixed(3));
      const value = parseFloat((sumVal / fgPixels.length).toFixed(3));

      const stats = fs.statSync(filePath);
      const sizeStr = (stats.size / 1024).toFixed(0) + " KB";

      const newItem = {
        id: idStr,
        name: filename,
        fruit,
        size: sizeStr,
        uploaded: new Date().toISOString().split("T")[0],
        hue,
        saturation,
        value,
        circularity,
        aspectRatio,
        x: parseFloat((circularity * 100).toFixed(1)),
        y: parseFloat((hue / 3.6).toFixed(1)),
        isSynthetic: false,
        imageUrl,
      };

      if (existingIdx !== -1) {
        dbContent.items[existingIdx] = newItem;
      } else {
        dbContent.items.push(newItem);
      }
      addedCount++;
    } catch (e) {
      console.error(`Error processing file ${filename}:`, e);
    }
  }

  console.log(`Ingested ${addedCount} items successfully.`);

  // NOW RUN CLUSTERING (DBSCAN) ON THE ENTIRE DATASET
  const settings = dbContent.dbscanSettings || { eps: 0.35, minSamples: 3, featureMode: "both" };
  console.log(`Running DBSCAN with settings: eps=${settings.eps}, minSamples=${settings.minSamples}, mode=${settings.featureMode}`);

  const weights = buildWeights(settings.featureMode);
  const dbscanInputs = dbContent.items.map(item => ({
    id: item.id,
    features: [item.hue, item.saturation, item.value, item.circularity, item.aspectRatio],
    fruit: item.fruit
  }));

  const normalized = normalizeFeatures(dbscanInputs);
  const clusterResults = runDBSCAN(normalized, settings.eps, settings.minSamples, weights);

  // Group dominant fruit labels
  const uniqueClusterIds = Array.from(new Set(Array.from(clusterResults.values()).map(v => v.clusterId))).filter(id => id !== -1);
  const clusterFruitMapping = new Map();
  
  const pointsWithCid = dbContent.items.map(item => {
    const res = clusterResults.get(item.id);
    return { ...item, clusterId: res ? res.clusterId : -1 };
  });

  for (const cid of uniqueClusterIds) {
    const clusterPoints = pointsWithCid.filter(p => p.clusterId === cid);
    const counts = {};
    for (const p of clusterPoints) {
      const fr = p.fruit || "Unknown";
      counts[fr] = (counts[fr] || 0) + 1;
    }
    let dominantFruit = "Unknown";
    let maxCount = -1;
    for (const [fr, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantFruit = fr;
      }
    }
    clusterFruitMapping.set(cid, dominantFruit);
  }

  // Update items in DB
  dbContent.items = dbContent.items.map(item => {
    const res = clusterResults.get(item.id);
    const clusterId = res ? res.clusterId : -1;
    const isCore = res ? res.isCore : false;
    const isBorder = res ? res.isBorder : false;
    const isNoise = res ? res.isNoise : true;

    let clusterLabel = "Derau (Noise)";
    let clusterIdStr = "C-6";

    const noiseConfig = dbContent.clusterConfigs.find(c => c.label.includes("Derau") || c.label.includes("Noise"));
    if (noiseConfig) {
      clusterLabel = noiseConfig.label;
      clusterIdStr = noiseConfig.id;
    }

    if (clusterId !== -1) {
      const mappedFruit = clusterFruitMapping.get(clusterId);
      const config = dbContent.clusterConfigs.find(c =>
        mappedFruit && c.label.toLowerCase().includes(mappedFruit.toLowerCase())
      );
      if (config) {
        clusterLabel = config.label;
        clusterIdStr = config.id;
      } else {
        clusterLabel = `Cluster ${clusterId + 1}`;
        clusterIdStr = `C-${clusterId + 1}`;
      }
    }

    return {
      ...item,
      clusterId,
      isCore,
      isBorder,
      isNoise,
      cluster: clusterIdStr,
      clusterLabel,
    };
  });

  console.log("Saving clustered db.json back to disk...");
  fs.writeFileSync(dbPath, JSON.stringify(dbContent, null, 2), 'utf-8');
  console.log("DBSCAN re-clustering finished successfully!");
}

main();
