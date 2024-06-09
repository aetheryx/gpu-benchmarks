const fs = require('node:fs');
const split2 = require('split2');

const inputPath = process.argv[2];
const outputPath = process.argv[3];
let currentResult = null;
let results = 0;

fs.appendFileSync(outputPath, 'cpu,memory,timestamp\n');

fs.createReadStream(inputPath, {
  encoding: 'utf8',
})
  .pipe(split2())
  .on('data', handleChunk)
  .on('end', () => {
    console.log(`wrote ${results} results to ${outputPath}`);
  });

function handleChunk(chunk) {
  if (chunk.startsWith('top -')) {
    if (currentResult) {
      const row = [currentResult.cpu, currentResult.memory, currentResult.timestamp];
      fs.appendFileSync(outputPath, `${row.join(',')}\n`);
      results++;
    }

    currentResult = {
      timestamp: chunk.split('top - ')[1].split(' up')[0],
    };
  }

  if (chunk.includes('qemu-system-x86')) {
    const values = chunk.trim().split(/\s+/);

    currentResult.memory = Number(values[5].slice(0, -1)) * 1024;
    currentResult.cpu = Number(values[8]);
  }
}
