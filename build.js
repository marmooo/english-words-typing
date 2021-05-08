const fs = require('fs');

const range = [0, 400, 600, 800, 1200, 1400, 1800, 3000]
let mGSL = [];
fs.readFileSync('mGSL/dist/mGSL.lst').toString().split('\n').forEach(line => {
  mGSL.push(line);
});
for (let i=1; i<range.length; i++) {
  const outPath = 'src/data/' + (i+6) + '.tsv';
  const problems = mGSL.slice(range[i - 1], range[i]);
  fs.writeFileSync(outPath, problems.join('\n'));
}
