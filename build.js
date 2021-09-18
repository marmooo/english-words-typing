import { readLines } from "https://deno.land/std/io/mod.ts";

const range = [0, 400, 600, 800, 1200, 1600, 2200, 3000, 5000];
const mGSL = [];
const fileReader = await Deno.open("mGSL/dist/mGSL.lst");
for await (const line of readLines(fileReader)) {
  if (!line) continue;
  mGSL.push(line);
}
for (let i = 1; i < range.length; i++) {
  const outPath = "src/data/" + (i + 6) + ".tsv";
  const problems = mGSL.slice(range[i - 1], range[i]);
  Deno.writeTextFile(outPath, problems.join("\n"));
}
