const fs = require('node:fs');
const split2 = require('split2');

const rangesPath = process.argv[2];
const inputPath = process.argv[3];
const outputPath = process.argv[4];
const ranges = parseRanges(fs.readFileSync(rangesPath).toString());

let wroteHeader = false;
let added = 0;
let skipped = 0;

fs.createReadStream(inputPath, {
  encoding: 'utf8',
})
  .pipe(split2())
  .on('data', handleChunk)
  .on('end', () => {
    console.log('done', { added, skipped });
  });

function handleChunk(chunk) {
  if (!wroteHeader) {
    fs.appendFileSync(outputPath, chunk + '\n');
    wroteHeader = true;
    return;
  }

  const rawTimestamp = chunk.split(',').at(-1).trim().split(' ').at(-1).trim();
  const timestamp = parseTimestamp(rawTimestamp);

  if (ranges.some(range => timestamp >= range.start && timestamp <= range.end)) {
    added++;
    fs.appendFileSync(outputPath, chunk + '\n');
  } else {
    skipped++;
  }
}

function parseTimestamp(timestamp) {
  const [h, m, s] = timestamp.split('.')[0].split(':').map(Number);
  return h * 3600 + m * 60 + s;
}

function parseRanges(rangesRaw) {
  const rangesArray = rangesRaw.trim().split('\n').map(l => {
    const segments = l.split(' ');
    const ts = segments[1];
    const value = segments.at(-1);
    return { ts, value };
  });

  const ranges = [];
  for (const item of rangesArray) {
    if (item.value.startsWith('iteration.start')) {
      const start = parseTimestamp(item.ts) - 1;
      const end = parseTimestamp(rangesArray.find(i => i.value === `iteration.end=${item.value.split('=')[1]}`).ts) + 1;
      ranges.push({ start, end });
    }
  }
  return ranges;
}
