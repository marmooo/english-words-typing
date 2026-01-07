import { TextLineStream } from "jsr:@std/streams/text-line-stream";

const range = [0, 400, 600, 800, 1200, 1600, 2200, 3000, 5000];
const mGSL = [];
const file = await Deno.open("mGSL/dist/mGSL.csv");
const lineStream = file.readable
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TextLineStream());
for await (const line of lineStream) {
  mGSL.push(line.replace(",", "\t"));
}
for (let i = 1; i < range.length; i++) {
  const outPath = "src/data/" + (i + 6) + ".tsv";
  const problems = mGSL.slice(range[i - 1], range[i]);
  Deno.writeTextFile(outPath, problems.join("\n"));
}
