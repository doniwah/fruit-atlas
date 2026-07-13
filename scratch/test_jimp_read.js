// scratch/test_jimp_read.js
import { Jimp } from 'jimp';
import path from 'path';

async function test() {
  try {
    const imgPath = path.resolve('src/lib/new-dataset/Alpukat.jpg');
    console.log("Reading:", imgPath);
    const image = await Jimp.read(imgPath);
    console.log("Success! Width:", image.bitmap.width, "Height:", image.bitmap.height);
    
    // Test resize
    image.resize({ w: 120, h: Math.round(120 * image.bitmap.height / image.bitmap.width) });
    console.log("After resize. Width:", image.bitmap.width, "Height:", image.bitmap.height);
    
    // Test getBuffer
    const buffer = await image.getBuffer('image/jpeg');
    console.log("Buffer size:", buffer.length);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
