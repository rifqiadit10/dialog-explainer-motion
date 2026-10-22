// Injects the voice <audio> clips, caption cards and lip-sync data into the root composition.
// Run from the project root after timing.mjs, and again after any TTS or timing change:
//
//   node <skill>/scripts/build-root.mjs [--comp index.html] [--lines audio/lines.json]
//        [--timing audio/timing.json] [--voice-dir audio/voice]
//
// index.html needs three markers:  <!-- AUDIO:BEGIN --> ... <!-- AUDIO:END -->,
// <!-- CAPTIONS:BEGIN --> ... <!-- CAPTIONS:END -->, and /* CAST:BEGIN */ ... /* CAST:END */.
// Speaker keys in lines.json are the cast ids (lowercased) used by the SVG ids and caption chips.
// Optional in lines.json: "spoken" (written -> spoken pairs; captions show the written form),
// "keywords" (word sequences shown in the highlight color), "music" ({ src, volume }).
// A music bed keeps any data-fx-* / data-automation attributes a carve wrote on a previous run.
import { readFileSync, writeFileSync } from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, a) => (i % 2 ? acc : [...acc, [v.replace(/^--/, ""), a[i + 1]]]), []));
const COMP = args.comp || "index.html";
const spec = JSON.parse(readFileSync(args.lines || "audio/lines.json", "utf8"));
const T = JSON.parse(readFileSync(args.timing || "audio/timing.json", "utf8"));
const VOICE_DIR = args["voice-dir"] || "audio/voice";
let html = readFileSync(COMP, "utf8");

// Captions show the written form of anything TTS received phonetically.
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const WRITTEN = (spec.spoken || []).map(([written, spoken]) => [new RegExp(`^${escape(spoken)}`), written]);
const written = (w) => WRITTEN.reduce((s, [re, to]) => s.replace(re, to), w);
const norm = (w) => written(w).toLowerCase().replace(/[^a-z0-9-]/g, "");
const KEYWORDS = (spec.keywords || []).map((k) => k.map((x) => x.toLowerCase()));

function markKeywords(words) {
  const n = words.map((w) => norm(w.word));
  const hit = new Array(words.length).fill(false);
  for (const kw of KEYWORDS) {
    for (let i = 0; i + kw.length <= n.length; i++) {
      if (kw.every((k, j) => n[i + j] === k)) for (let j = 0; j < kw.length; j++) hit[i + j] = true;
    }
  }
  return hit;
}

// Caption cards: break after , . ? ! or at 6 words / 30 chars, never inside a keyword phrase
// (up to a 44-char hard cap); a trailing one-word card folds into the previous one.
function chunks(line, hits) {
  const out = [];
  let cur = [];
  const flush = () => cur.length && (out.push(cur), (cur = []));
  line.words.forEach((w, i) => {
    cur.push(w);
    const chars = cur.map((x) => x.word).join(" ").length;
    const midPhrase = hits[i] && hits[i + 1] && !/[,.?!]$/.test(w.word);
    if (/[,.?!]$/.test(w.word) && cur.length >= 2) flush();
    else if ((cur.length >= 6 || chars >= 30) && (!midPhrase || chars >= 44)) flush();
  });
  flush();
  if (out.length > 1 && out[out.length - 1].length === 1) out[out.length - 2].push(...out.pop());
  return out;
}

const audio = [];
const castLines = [];
const allChunks = [];
T.lines.forEach((line, idx) => {
  const who = line.speaker.toLowerCase();
  // Alternate lanes so a file's lead-in silence never overlaps the previous clip on the same track.
  const track = 10 + 2 * (idx % 2) + (who === T.lines[0].speaker.toLowerCase() ? 0 : 1);
  const dur = Math.min(line.duration, line.speechEnd - line.audioStart + 0.2).toFixed(3);
  audio.push(
    `      <audio id="vo-${line.id}" src="${VOICE_DIR}/${line.id}.mp3" data-start="${line.audioStart}" data-duration="${dur}" data-volume="1" data-audio-group="voiceover" data-track-index="${track}"></audio>`,
  );
  const hits = markKeywords(line.words);
  let k = 0;
  for (const ch of chunks(line, hits)) allChunks.push({ who, words: ch.map((w) => ({ ...w, hit: hits[k++] })) });
  castLines.push({
    who,
    start: line.speechStart,
    end: line.speechEnd,
    words: line.words.map((w) => [w.start, w.end, Math.max(1, (written(w.word).toLowerCase().match(/[aiueo]+/g) || []).length)]),
  });
});

if (spec.music) {
  const prev = (html.match(/<audio id="bgm"[^>]*><\/audio>/) || [])[0];
  const carve = prev ? (prev.match(/ data-(fx-[a-z-]+|automation)=("[^"]*"|'[^']*')/g) || []).join("") : "";
  audio.push(
    `      <audio id="bgm" src="${spec.music.src}" data-start="0" data-duration="${T.total}" data-volume="${spec.music.volume ?? 0.3}" data-audio-group="music" data-track-index="20"${carve}></audio>`,
  );
}

const caps = allChunks.map((c, i) => {
  const start = Math.max(0, c.words[0].start - 0.08);
  const lastEnd = c.words[c.words.length - 1].end;
  const next = allChunks[i + 1];
  const end = next && next.words[0].start - 0.08 - lastEnd < 0.7 ? next.words[0].start - 0.08 : lastEnd + 0.45;
  const spans = c.words
    .map((w) => `<span class="w${w.hit ? " kw" : ""}" data-s="${w.start}" data-e="${w.end}">${written(w.word).replace(/-/g, "&#8209;")}</span>`)
    .join(" ");
  return `      <div id="cap-${i + 1}" class="caption clip" data-start="${start.toFixed(3)}" data-duration="${(end - start).toFixed(3)}" data-track-index="5"><span class="who ${c.who}">${c.who.toUpperCase()}</span><span class="line">${spans}</span></div>`;
});

const swap = (src, begin, end, body) => {
  const a = src.indexOf(begin);
  const b = src.indexOf(end);
  if (a < 0 || b < 0) throw new Error(`markers ${begin} / ${end} not found in ${COMP}`);
  return src.slice(0, a + begin.length) + "\n" + body + "\n      " + src.slice(b);
};
html = swap(html, "<!-- AUDIO:BEGIN -->", "<!-- AUDIO:END -->", audio.join("\n"));
html = swap(html, "<!-- CAPTIONS:BEGIN -->", "<!-- CAPTIONS:END -->", caps.join("\n"));
if (!/\/\* CAST:BEGIN \*\/[\s\S]*?\/\* CAST:END \*\//.test(html)) throw new Error(`CAST markers not found in ${COMP}`);
html = html.replace(/\/\* CAST:BEGIN \*\/[\s\S]*?\/\* CAST:END \*\//, `/* CAST:BEGIN */ const CAST_LINES = ${JSON.stringify(castLines)}; /* CAST:END */`);
html = html.replace(/(data-composition-id="main"[^>]*?)data-duration="[0-9.]+"/, `$1data-duration="${T.total}"`);
writeFileSync(COMP, html);
console.log(`audio ${audio.length}, captions ${caps.length}, total ${T.total}s`);
