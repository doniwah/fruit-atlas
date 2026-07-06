import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('src/lib/db.json');
const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const items = dbContent.items;

const fruitCounts = {};
let syntheticCount = 0;
let realCount = 0;

for (const item of items) {
  fruitCounts[item.fruit] = (fruitCounts[item.fruit] || 0) + 1;
  if (item.isSynthetic) {
    syntheticCount++;
  } else {
    realCount++;
  }
}

console.log(`Total items: ${items.length}`);
console.log(`Real items: ${realCount}`);
console.log(`Synthetic items: ${syntheticCount}`);
console.log(`Number of unique fruits: ${Object.keys(fruitCounts).length}`);
console.log('\nFruit distribution (top 15):');
const sortedFruits = Object.entries(fruitCounts).sort((a, b) => b[1] - a[1]);
sortedFruits.slice(0, 15).forEach(([fruit, count]) => {
  console.log(`- ${fruit}: ${count}`);
});
console.log('\nFruit distribution (bottom 15):');
sortedFruits.slice(-15).forEach(([fruit, count]) => {
  console.log(`- ${fruit}: ${count}`);
});
