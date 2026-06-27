const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "../src/lib/db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

// Keep the same cluster configs
const configs = db.clusterConfigs;

// Base features for each fruit type
const baseFeatures = {
  "Apel": { h: 12, s: 0.8, v: 0.75, c: 0.92, a: 1.02, color: "#C0392B", shape: "Round", shapeDesc: "Bulat" },
  "Jeruk": { h: 32, s: 0.85, v: 0.8, c: 0.96, a: 0.98, color: "#E67E22", shape: "Round", shapeDesc: "Bulat" },
  "Pisang": { h: 52, s: 0.9, v: 0.88, c: 0.42, a: 2.4, color: "#F4D03F", shape: "Curved", shapeDesc: "Melengkung" },
  "Mangga": { h: 42, s: 0.72, v: 0.76, c: 0.76, a: 1.34, color: "#7DCE82", shape: "Oval", shapeDesc: "Oval" },
  "Stroberi": { h: 346, s: 0.85, v: 0.78, c: 0.70, a: 1.10, color: "#E74C3C", shape: "Triangle", shapeDesc: "Segitiga" },
  "Anggur": { h: 282, s: 0.65, v: 0.45, c: 0.88, a: 0.92, color: "#6C3483", shape: "Cluster", shapeDesc: "Bulat Kecil" }
};

const fruitsList = ["Apel", "Jeruk", "Pisang", "Mangga", "Stroberi", "Anggur"];
const filePrefixes = {
  "Apel": "apel_merah",
  "Jeruk": "jeruk_segar",
  "Pisang": "pisang_kuning",
  "Mangga": "mangga_hijau",
  "Stroberi": "stroberi_merah",
  "Anggur": "anggur_ungu"
};

// SVG Generators
function getSvg(fruit, color) {
  let innerSvg = "";
  if (fruit === "Apel") {
    innerSvg = `<circle cx="50" cy="55" r="32" fill="${color}"/><path d="M50 20 Q55 11 65 15" stroke="#27AE60" stroke-width="4" fill="none"/><path d="M50 20 Q48 25 50 30" stroke="#7E5109" stroke-width="4" fill="none"/>`;
  } else if (fruit === "Jeruk") {
    innerSvg = `<circle cx="50" cy="50" r="34" fill="${color}"/><circle cx="50" cy="50" r="30" fill="none" stroke="#F5B041" stroke-width="2" stroke-dasharray="4,4"/><circle cx="50" cy="16" r="4" fill="#229954"/>`;
  } else if (fruit === "Pisang") {
    innerSvg = `<path d="M20 30 Q50 65 80 40 Q50 45 20 30" fill="${color}"/><path d="M18 28 Q22 28 22 32" stroke="#5D4037" stroke-width="3.5" fill="none"/><path d="M78 38 Q82 38 82 42" stroke="#5D4037" stroke-width="3.5" fill="none"/>`;
  } else if (fruit === "Mangga") {
    innerSvg = `<g transform="rotate(-20 50 50)"><ellipse cx="50" cy="50" rx="25" ry="38" fill="${color}"/><ellipse cx="50" cy="50" rx="19" ry="30" fill="#D4AC0D" opacity="0.3"/></g>`;
  } else if (fruit === "Stroberi") {
    innerSvg = `<path d="M50 15 Q25 25 30 65 Q50 90 70 65 Q75 25 50 15 Z" fill="${color}"/><circle cx="42" cy="40" r="2" fill="#F4D03F"/><circle cx="58" cy="40" r="2" fill="#F4D03F"/><circle cx="50" cy="55" r="2" fill="#F4D03F"/><circle cx="40" cy="60" r="2" fill="#F4D03F"/><circle cx="60" cy="60" r="2" fill="#F4D03F"/><path d="M50 15 L45 8 L55 8 Z" fill="#27AE60"/>`;
  } else if (fruit === "Anggur") {
    innerSvg = `<g fill="${color}"><circle cx="40" cy="40" r="12"/><circle cx="60" cy="40" r="12"/><circle cx="50" cy="55" r="12"/><circle cx="40" cy="70" r="12"/><circle cx="60" cy="70" r="12"/><circle cx="50" cy="80" r="12"/></g><path d="M50 28 L50 15 Q55 10 60 12" stroke="#7E5109" stroke-width="3" fill="none"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="#F9FBF9"/>${innerSvg}</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

const items = [];

// Generate 150 non-synthetic items (25 per fruit)
console.log("Generating 150 dataset items...");
let idCounter = 1000;
for (const fruit of fruitsList) {
  const base = baseFeatures[fruit];
  const prefix = filePrefixes[fruit];
  
  for (let i = 1; i <= 25; i++) {
    const seed = i * 0.04;
    const hNoise = (i % 2 === 0 ? seed * 8 : -seed * 8);
    const sNoise = (i % 3 === 0 ? seed * 0.12 : -seed * 0.08);
    const vNoise = (i % 2 === 1 ? seed * 0.10 : -seed * 0.08);
    const cNoise = (i % 3 === 1 ? seed * 0.04 : -seed * 0.03);
    const aNoise = (i % 2 === 0 ? seed * 0.15 : -seed * 0.12);

    const hue = Math.round((base.h + hNoise + 360) % 360);
    const saturation = parseFloat(Math.min(1, Math.max(0.2, base.s + sNoise)).toFixed(2));
    const value = parseFloat(Math.min(1, Math.max(0.2, base.v + vNoise)).toFixed(2));
    const circularity = parseFloat(Math.min(1, Math.max(0.1, base.c + cNoise)).toFixed(2));
    const aspectRatio = parseFloat(Math.max(0.3, base.a + aNoise).toFixed(2));

    // Project coordinates roughly for scatter plot fallback
    const x = parseFloat((circularity * 100).toFixed(1));
    const y = parseFloat((hue / 3.6).toFixed(1));

    items.push({
      id: `IMG-${idCounter++}`,
      name: `${prefix}_${i.toString().padStart(2, "0")}.jpg`,
      fruit: fruit,
      size: `${Math.round(120 + Math.random() * 280)} KB`,
      uploaded: `2026-06-${(1 + (i % 24)).toString().padStart(2, "0")}`,
      hue,
      saturation,
      value,
      circularity,
      aspectRatio,
      x,
      y,
      isSynthetic: false,
      imageUrl: getSvg(fruit, base.color)
    });
  }
}

// Generate 150 synthetic scatter plot points (25 per fruit)
console.log("Generating 150 synthetic points...");
let syntheticCounter = 100;
for (const fruit of fruitsList) {
  const base = baseFeatures[fruit];
  
  for (let i = 1; i <= 25; i++) {
    const seed = i * 0.05;
    const hNoise = (Math.random() - 0.5) * 20;
    const sNoise = (Math.random() - 0.5) * 0.20;
    const vNoise = (Math.random() - 0.5) * 0.20;
    const cNoise = (Math.random() - 0.5) * 0.12;
    const aNoise = (Math.random() - 0.5) * 0.35;

    const hue = Math.round((base.h + hNoise + 360) % 360);
    const saturation = parseFloat(Math.min(1, Math.max(0.1, base.s + sNoise)).toFixed(2));
    const value = parseFloat(Math.min(1, Math.max(0.1, base.v + vNoise)).toFixed(2));
    const circularity = parseFloat(Math.min(1, Math.max(0.1, base.c + cNoise)).toFixed(2));
    const aspectRatio = parseFloat(Math.max(0.3, base.a + aNoise).toFixed(2));

    // Scatter plot coordinates with jitter
    const xJitter = (Math.random() - 0.5) * 6;
    const yJitter = (Math.random() - 0.5) * 6;
    const x = parseFloat(Math.min(100, Math.max(0, (circularity * 100) + xJitter)).toFixed(1));
    const y = parseFloat(Math.min(100, Math.max(0, (hue / 3.6) + yJitter)).toFixed(1));

    items.push({
      id: `PT-${syntheticCounter++}`,
      name: `scatter_point_${syntheticCounter}.png`,
      fruit: fruit,
      size: "4 KB",
      uploaded: "2026-06-01",
      hue,
      saturation,
      value,
      circularity,
      aspectRatio,
      x,
      y,
      isSynthetic: true
    });
  }
}

// Add some random Noise points to make it realistic (15 noise points)
console.log("Generating 15 noise points...");
for (let i = 1; i <= 15; i++) {
  const hue = Math.round(Math.random() * 360);
  const saturation = parseFloat(Math.random().toFixed(2));
  const value = parseFloat(Math.random().toFixed(2));
  const circularity = parseFloat(Math.random().toFixed(2));
  const aspectRatio = parseFloat((Math.random() * 2.5 + 0.5).toFixed(2));
  const x = parseFloat((Math.random() * 100).toFixed(1));
  const y = parseFloat((Math.random() * 100).toFixed(1));

  items.push({
    id: `PT-${syntheticCounter++}`,
    name: `noise_point_${i}.png`,
    fruit: "Noise",
    size: "4 KB",
    uploaded: "2026-06-01",
    hue,
    saturation,
    value,
    circularity,
    aspectRatio,
    x,
    y,
    isSynthetic: true
  });
}

const newDb = {
  items,
  clusterConfigs: configs
};

fs.writeFileSync(dbPath, JSON.stringify(newDb, null, 2), "utf-8");
console.log("Database successfully generated with 150 real dataset items and 165 scatter points!");
