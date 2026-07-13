// scratch/test_physical_props.js

const getFruitPhysicalProperties = (fruitName, circ, id) => {
  const cleanFruit = (fruitName || "").split(" — ")[0].toLowerCase();
  
  // Stable pseudo-random factor based on ID for realistic variations
  const seed = id.split("-").map(x => parseInt(x) || 0).reduce((a, b) => a + b, 0) || 5;
  const variance = (seed % 10) / 10; // 0.0 - 0.9
  
  let berat = 150;
  let tekstur = "Halus / Padat";
  let ukuran = "Sedang (Medium)";
  
  if (cleanFruit.includes("apel") || cleanFruit.includes("apple")) {
    berat = Math.round(170 + variance * 50); // 170g - 220g
    tekstur = "Halus & Keras";
    ukuran = berat > 200 ? "Besar (Large)" : berat < 185 ? "Kecil (Small)" : "Sedang (Medium)";
  } else if (cleanFruit.includes("jeruk") || cleanFruit.includes("orange")) {
    berat = Math.round(130 + variance * 40); // 130g - 170g
    tekstur = "Sedikit Kasar / Berpori";
    ukuran = berat > 155 ? "Besar (Large)" : berat < 140 ? "Kecil (Small)" : "Sedang (Medium)";
  } else if (cleanFruit.includes("pisang") || cleanFruit.includes("banana")) {
    berat = Math.round(110 + variance * 30); // 110g - 140g
    tekstur = "Halus / Lunak";
    ukuran = berat > 130 ? "Besar (Large)" : berat < 120 ? "Kecil (Small)" : "Sedang (Medium)";
  } else if (cleanFruit.includes("mangga") || cleanFruit.includes("mango")) {
    berat = Math.round(260 + variance * 100); // 260g - 360g
    tekstur = "Halus / Licin";
    ukuran = berat > 320 ? "Besar (Large)" : berat < 290 ? "Kecil (Small)" : "Sedang (Medium)";
  } else if (cleanFruit.includes("anggur") || cleanFruit.includes("grape")) {
    berat = Math.round(6 + variance * 4); // 6g - 10g per butir
    tekstur = "Halus & Licin";
    ukuran = berat > 8 ? "Besar (Large)" : berat < 7 ? "Kecil (Small)" : "Sedang (Medium)";
  } else if (cleanFruit.includes("stroberi") || cleanFruit.includes("strawberry")) {
    berat = Math.round(16 + variance * 10); // 16g - 26g
    tekstur = "Berbiji / Kasar";
    ukuran = berat > 22 ? "Besar (Large)" : berat < 18 ? "Kecil (Small)" : "Sedang (Medium)";
  } else if (cleanFruit.includes("lemon")) {
    berat = Math.round(90 + variance * 30); // 90g - 120g
    tekstur = "Bintik Kasar / Tebal";
    ukuran = berat > 110 ? "Besar (Large)" : berat < 100 ? "Kecil (Small)" : "Sedang (Medium)";
  } else if (cleanFruit.includes("ceri") || cleanFruit.includes("cherry")) {
    berat = Math.round(5 + variance * 4); // 5g - 9g
    tekstur = "Halus & Mengkilap";
    ukuran = berat > 7 ? "Besar (Large)" : berat < 6 ? "Kecil (Small)" : "Sedang (Medium)";
  } else {
    // Out of dataset / unknown
    berat = Math.round(80 + variance * 150);
    tekstur = circ > 0.8 ? "Halus" : "Kasar / Irregular";
    ukuran = berat > 180 ? "Besar (Large)" : berat < 110 ? "Kecil (Small)" : "Sedang (Medium)";
  }
  
  return { berat, tekstur, ukuran };
};

// Run some test cases
const testCases = [
  { fruit: "Apel", circ: 0.92, id: "STU-2401" },
  { fruit: "Jeruk", circ: 0.88, id: "STU-2402" },
  { fruit: "Pisang", circ: 0.42, id: "STU-2403" },
  { fruit: "Mangga", circ: 0.76, id: "STU-2404" },
  { fruit: "Stroberi", circ: 0.84, id: "STU-2408" },
  { fruit: "Buah tidak ada di dataset", circ: 0.50, id: "STU-9999" }
];

console.log("=== VERIFIKASI LOGIKA ESTIMASI FITUR FISIK ===");
testCases.forEach((tc) => {
  const result = getFruitPhysicalProperties(tc.fruit, tc.circ, tc.id);
  console.log(`[TEST] Buah: ${tc.fruit.padEnd(25)} | ID: ${tc.id} | Hasil: Berat=${result.berat}g, Tekstur=${result.tekstur.padEnd(22)}, Ukuran=${result.ukuran}`);
});

console.log("\n=== VERIFIKASI STABILITAS VARIANS (ID SAMA HARUS MENGHASILKAN NILAI SAMA) ===");
const testApel1a = getFruitPhysicalProperties("Apel", 0.92, "STU-2401");
const testApel1b = getFruitPhysicalProperties("Apel", 0.92, "STU-2401");
const testApel2 = getFruitPhysicalProperties("Apel", 0.92, "STU-2402");
console.log(`ID STU-2401 (Run 1): Berat = ${testApel1a.berat}g`);
console.log(`ID STU-2401 (Run 2): Berat = ${testApel1b.berat}g (Harus sama!)`);
console.log(`ID STU-2402 (Run 1): Berat = ${testApel2.berat}g (Bisa berbeda!)`);

if (testApel1a.berat === testApel1b.berat && testApel1a.berat !== testApel2.berat) {
  console.log("\n[OK] Tes stabilitas dan variabilitas ID berhasil!");
} else {
  console.log("\n[WARNING] Tes stabilitas atau variabilitas ID bermasalah.");
}
