const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "../src/lib/db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

// Keep the same cluster configs
const configs = db.clusterConfigs;

// List of 150 unique fruit types in Indonesian
const fruitTypes = [
  "Apel", "Jeruk", "Pisang", "Mangga", "Stroberi", "Anggur", "Durian", "Rambutan", "Pepaya", "Manggis",
  "Nanas", "Alpukat", "Semangka", "Melon", "Jambu Biji", "Jambu Air", "Nangka", "Belimbing", "Salak", "Sawo",
  "Kelapa", "Kurma", "Delima", "Duku", "Langsat", "Sirsak", "Markisa", "Buah Naga", "Kelengkeng", "Leci",
  "Kiwi", "Persik", "Ceri", "Aprikot", "Zaitun", "Tin", "Blewah", "Timun Suri", "Kesemek", "Matoa",
  "Gandaria", "Kecapi", "Menteng", "Buni", "Jamblang", "Gowok", "Kersen", "Rukem", "Namnam", "Bisbul",
  "Mundu", "Ceremai", "Kemang", "Binjai", "Lai", "Wuni", "Kawista", "Juwet", "Matoa Papua", "Kedondong",
  "Plum", "Cranberry", "Blueberry", "Raspberry", "Blackberry", "Mulberry", "Boysenberry", "Huckleberry", "Gooseberry", "Elderberry",
  "Dewberry", "Cloudberry", "Lingonberry", "Salmonberry", "Bilberry", "Blackcurrant", "Redcurrant", "Whitecurrant", "Kumquat", "Clementine",
  "Tangerine", "Mandarin", "Satsuma", "Pomelo", "Grapefruit", "Yuzu", "Sudachi", "Kabosu", "Meyer Lemon", "Key Lime",
  "Kaffir Lime", "Finger Lime", "Calamansi", "Ugli Fruit", "Tangelo", "Sweet Lime", "Blood Orange", "Seville Orange", "Bergamot", "Citron",
  "Buddhas Hand", "Quince", "Medlar", "Loquat", "Persimmon", "Sharon Fruit", "Tamarillo", "Pepino", "Feijoa", "Guava",
  "Feijoa Guava", "Strawberry Guava", "Pineapple Guava", "Cattley Guava", "Jabuticaba", "Pitanga", "Grumichama", "Acerola", "Pitaya", "Prickly Pear",
  "Saguaro Fruit", "Rambai", "Sentul", "Tampoi", "Kapulasan", "Marang", "Tarap", "Cempedak", "Sukun", "Tampang",
  "Keledang", "Kweni", "Bacang", "Plum Mango", "Marian Plum", "Kundur", "Labu Parang", "Labu Air", "Oyong", "Peria",
  "Klabang", "Goji Berry", "Ciplukan", "Carambola", "Buah Merah", "Kranji", "Maja", "Rukam", "Srikaya", "Gandaria Kuning"
];

// Color palette for fruit SVG icons
const colors = [
  "#C0392B", "#E67E22", "#F4D03F", "#7DCE82", "#E74C3C", "#6C3483", "#27AE60",
  "#F39C12", "#D35400", "#16A085", "#2ECC71", "#9B59B6", "#8E44AD", "#F1C40F",
  "#FF6B6B", "#FF8E53", "#FFD255", "#6BCB77", "#4D96FF", "#B1E1FF", "#9C27B0"
];

// SVG generator for different types of fruits
function getSvg(fruitName, index) {
  const color = colors[index % colors.length];
  // Generate different shapes based on index to make them visually distinct
  let innerSvg = "";
  if (index % 4 === 0) {
    // Circle shape
    innerSvg = `<circle cx="50" cy="50" r="34" fill="${color}"/><circle cx="50" cy="50" r="30" fill="none" stroke="#FFF" stroke-width="1.5" stroke-dasharray="3,3"/><path d="M50 16 L50 8 Q55 6 60 8" stroke="#7E5109" stroke-width="3" fill="none"/>`;
  } else if (index % 4 === 1) {
    // Oval shape
    innerSvg = `<g transform="rotate(-15 50 50)"><ellipse cx="50" cy="50" rx="26" ry="38" fill="${color}"/><path d="M50 12 L50 4" stroke="#7E5109" stroke-width="3" fill="none"/><path d="M50 4 Q45 8 50 12" fill="#27AE60"/></g>`;
  } else if (index % 4 === 2) {
    // Rounded Triangle
    innerSvg = `<path d="M50 15 Q25 25 30 75 Q50 90 70 75 Q75 25 50 15 Z" fill="${color}"/><circle cx="50" cy="45" r="2.5" fill="#FFF" opacity="0.6"/><circle cx="40" cy="55" r="2.5" fill="#FFF" opacity="0.6"/><circle cx="60" cy="55" r="2.5" fill="#FFF" opacity="0.6"/><circle cx="50" cy="65" r="2.5" fill="#FFF" opacity="0.6"/>`;
  } else {
    // Cluster
    innerSvg = `<g fill="${color}"><circle cx="42" cy="42" r="14"/><circle cx="58" cy="42" r="14"/><circle cx="50" cy="58" r="14"/><circle cx="42" cy="74" r="14"/><circle cx="58" cy="74" r="14"/></g>`;
  }
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="#F4F6F4" rx="10"/><text x="10" y="22" font-family="sans-serif" font-size="10" font-weight="bold" fill="#7F8C8D">${fruitName.substring(0, 3).toUpperCase()}</text>${innerSvg}</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

const items = [];

// Generate exactly 150 items, each with a unique fruit type!
console.log("Generating 150 unique fruit types in the dataset...");
for (let i = 0; i < 150; i++) {
  const fruitName = fruitTypes[i];
  
  // Vary features based on index to spread them out across the HSV & Shape workspace
  const seed = i * 0.13;
  const hue = Math.round((i * 2.4) % 360);
  const saturation = parseFloat((0.55 + (Math.sin(seed) * 0.35)).toFixed(2));
  const value = parseFloat((0.50 + (Math.cos(seed) * 0.35)).toFixed(2));
  const circularity = parseFloat((0.40 + ((i % 5) * 0.12)).toFixed(2));
  const aspectRatio = parseFloat((0.60 + ((i % 7) * 0.28)).toFixed(2));

  const x = parseFloat((circularity * 100).toFixed(1));
  const y = parseFloat((hue / 3.6).toFixed(1));

  items.push({
    id: `IMG-${1000 + i}`,
    name: `${fruitName.toLowerCase().replace(/\s+/g, "_")}_sample.jpg`,
    fruit: fruitName,
    size: `${Math.round(80 + (i * 2.3) % 300)} KB`,
    uploaded: `2026-06-${(1 + (i % 28)).toString().padStart(2, "0")}`,
    hue,
    saturation,
    value,
    circularity,
    aspectRatio,
    x,
    y,
    isSynthetic: false,
    imageUrl: getSvg(fruitName, i)
  });
}

// Generate 150 synthetic scatter plot points to represent density
console.log("Generating 150 synthetic scatter points...");
for (let i = 0; i < 150; i++) {
  // Map synthetic points to fruit types cycling through
  const fruitName = fruitTypes[i % fruitTypes.length];
  const baseIndex = fruitTypes.indexOf(fruitName);
  const color = colors[baseIndex % colors.length];
  
  const seed = i * 0.07;
  const hue = Math.round(((baseIndex * 2.4) + (Math.random() - 0.5) * 15 + 360) % 360);
  const saturation = parseFloat(Math.min(1, Math.max(0.1, 0.55 + (Math.sin(seed) * 0.35) + (Math.random() - 0.5) * 0.1)).toFixed(2));
  const value = parseFloat(Math.min(1, Math.max(0.1, 0.50 + (Math.cos(seed) * 0.35) + (Math.random() - 0.5) * 0.1)).toFixed(2));
  const circularity = parseFloat(Math.min(1, Math.max(0.1, 0.40 + ((baseIndex % 5) * 0.12) + (Math.random() - 0.5) * 0.08)).toFixed(2));
  const aspectRatio = parseFloat(Math.max(0.3, 0.60 + ((baseIndex % 7) * 0.28) + (Math.random() - 0.5) * 0.2).toFixed(2));

  const xJitter = (Math.random() - 0.5) * 5;
  const yJitter = (Math.random() - 0.5) * 5;
  const x = parseFloat(Math.min(100, Math.max(0, (circularity * 100) + xJitter)).toFixed(1));
  const y = parseFloat(Math.min(100, Math.max(0, (hue / 3.6) + yJitter)).toFixed(1));

  items.push({
    id: `PT-${100 + i}`,
    name: `scatter_point_${i}.png`,
    fruit: fruitName,
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

// Write new db.json
const newDb = {
  items,
  clusterConfigs: configs
};

fs.writeFileSync(dbPath, JSON.stringify(newDb, null, 2), "utf-8");
console.log("Database successfully generated with 150 unique fruit types and 150 synthetic scatter points!");
