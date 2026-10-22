// Injects the voice <audio> clips, caption cards and lip-sync data into the root composition.
// Run from the project root after timing.mjs, and again after any TTS or timing change:
//
//   node <skill>/scripts/build-root.mjs [--comp index.html] [--lines audio/lines.json]
//        [--timing audio/timing.json] [--voice-dir audio/voice] [--words]
//
// index.html needs three markers:  <!-- AUDIO:BEGIN --> ... <!-- AUDIO:END -->,
// <!-- CAPTIONS:BEGIN --> ... <!-- CAPTIONS:END -->, and /* CAST:BEGIN */ ... /* CAST:END */.
// Speaker keys in lines.json are the cast ids (lowercased) used by the SVG ids and caption chips.
// Optional in lines.json: "spoken" (written -> spoken pairs; captions show the written form),
// "keywords" (word sequences shown in the highlight color), "music" ({ src, volume }).
// A music bed keeps any data-fx-* / data-automation attributes a carve wrote on a previous run.
//
// Word cues (needs /* CUES:BEGIN */ ... /* CUES:END */ in the root script, before first use):
// shots, poses and tweens name a spoken word instead of a second, so new voice takes retime them.
//   cue("f2-1-sari:merchant")         start of that word (written form; case and punctuation ignored)
//   cue("f2-1-sari:cek#2")            the second "cek" in the line
//   cue("f2-1-sari:merchant@end")     end of the word;  cue("f2-1-sari"), cue("f2-1-sari@end"): the line
//   cue("frame:3"), cue("frame:3@end")  a frame window from timing.json
//   cue("f2-1-sari:merchant -0.25")   trailing offset in seconds (after a space); cue(spec, -0.25) too
// Root clips take data-cue="<spec>" (writes data-start) and data-cue-end="<spec>" (writes data-duration).
// Every literal cue is checked here; an unknown line or word stops the build and lists the words.
// --words prints the cue words of every line and frame, and changes nothing.
import { readFileSync, writeFileSync } from "node:fs";

const LIST_WORDS = process.argv.includes("--words");
const argv = process.argv.slice(2).filter((a) => a !== "--words");
const args = Object.fromEntries(argv.reduce((acc, v, i, a) => (i % 2 ? acc : [...acc, [v.replace(/^--/, ""), a[i + 1]]]), []));
const COMP = args.comp || "index.html";
const spec = JSON.parse(readFileSync(args.lines || "audio/lines.json", "utf8"));
const T = JSON.parse(readFileSync(args.timing || "audio/timing.json", "utf8"));
const VOICE_DIR = args["voice-dir"] || "audio/voice";
let html = readFileSync(COMP, "utf8");

// Captions show the written form of anything TTS received phonetically.
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const WRITTEN = (spec.spoken || []).map(([written, spoken]) => [new RegExp(`^${escape(spoken)}`), written]);
const written = (w) => WRITTEN.reduce((s, [re, to]) => s.replace(re, to), w);
const norm = (w) => written(w).toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");
const KEYWORDS = (spec.keywords || []).map((k) => k.map((x) => x.toLowerCase()));

// Cue data: per line its speech window and [word, start, end] keys; per frame its window.
const CUE_DATA = { lines: {}, frames: {} };
for (const l of T.lines) CUE_DATA.lines[l.id] = { s: l.speechStart, e: l.speechEnd, w: l.words.map((w) => [norm(w.word), w.start, w.end]) };
for (const f of T.frames) CUE_DATA.frames[f.frame] = [f.start, f.end];

// Runs here to check every cue, and is injected verbatim so the page resolves cues the same way.
function resolveCue(D, spec, offset) {
  const m = /^\s*([^\s:@#]+)(?::([^\s@#]+))?(?:#(\d+))?(@end)?\s*([+-]\s*[\d.]+)?\s*$/.exec(String(spec));
  if (!m) throw new Error(`cue "${spec}": expected line[:word][#n][@end] [+-seconds]`);
  const [, id, word, nth, atEnd, off] = m;
  const shift = (off ? parseFloat(off.replace(/\s+/g, "")) : 0) + (offset || 0);
  if (id === "frame") {
    const f = D.frames[word];
    if (!f) throw new Error(`cue "${spec}": no frame ${word} (frames: ${Object.keys(D.frames).join(" ")})`);
    return +(f[atEnd ? 1 : 0] + shift).toFixed(3);
  }
  const L = D.lines[id];
  if (!L) throw new Error(`cue "${spec}": no line "${id}"`);
  if (!word) return +((atEnd ? L.e : L.s) + shift).toFixed(3);
  const key = word.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");
  const hits = L.w.filter((w) => w[0] === key);
  const n = nth ? Number(nth) : 1;
  if (hits.length < n) throw new Error(`cue "${spec}": "${key}" ${hits.length ? `is spoken ${hits.length}x` : "is not spoken"} in ${id} (${L.w.map((w) => w[0]).join(" ")})`);
  return +(hits[n - 1][atEnd ? 2 : 1] + shift).toFixed(3);
}

if (LIST_WORDS) {
  for (const f of T.frames) console.log(`frame:${f.frame}`.padEnd(16), f.start.toFixed(2).padStart(6), "-", f.end.toFixed(2));
  for (const l of T.lines) console.log(l.id.padEnd(16), l.speechStart.toFixed(2).padStart(6), " ", CUE_DATA.lines[l.id].w.map((w) => w[0]).join(" "));
  process.exit(0);
}

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

// Cues: inject the data and resolver, then check every literal cue("...") and data-cue attribute.
const CUES_RE = /\/\* CUES:BEGIN \*\/[\s\S]*?\/\* CUES:END \*\//;
const errors = [];
const at = (s, offset = 0) => {
  try {
    return resolveCue(CUE_DATA, s, offset);
  } catch (e) {
    errors.push(e.message);
    return NaN;
  }
};
const code = html.replace(CUES_RE, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/\/\/[^\n]*/g, "");
const calls = [...code.matchAll(/\bcue\(\s*(["'])([^"']+)\1\s*(?:,\s*(-?[\d.]+)\s*)?\)/g)];
if (calls.length && !CUES_RE.test(html)) errors.push(`${COMP} calls cue() but has no /* CUES:BEGIN */ ... /* CUES:END */ marker`);
for (const c of calls) at(c[2], Number(c[3] || 0));
let clips = 0;
html = html.replace(/<[a-z][^>]*\sdata-cue(?:-end)?="[^"]*"[^>]*>/gi, (tag) => {
  const get = (a) => (tag.match(new RegExp(`\\s${a}="([^"]*)"`)) || [])[1];
  const put = (t, a, v) => (new RegExp(`\\s${a}="`).test(t) ? t.replace(new RegExp(`(\\s${a}=)"[^"]*"`), `$1"${v}"`) : t.replace(/\sdata-cue/, ` ${a}="${v}" data-cue`));
  const start = get("data-cue") ? at(get("data-cue")) : parseFloat(get("data-start"));
  const end = get("data-cue-end") ? at(get("data-cue-end")) : NaN;
  clips++;
  if (get("data-cue") && !isNaN(start)) tag = put(tag, "data-start", start);
  if (!isNaN(end) && !isNaN(start)) {
    if (end <= start) errors.push(`${get("id") || tag.slice(0, 40)}: data-cue-end ${end} is not after its start ${start}`);
    else tag = put(tag, "data-duration", +(end - start).toFixed(3));
  }
  return tag;
});
if (errors.length) {
  console.error(`cue errors (${COMP} not written):\n  ` + errors.join("\n  ") + "\nList the words with: node <skill>/scripts/build-root.mjs --words");
  process.exit(1);
}
if (CUES_RE.test(html)) {
  const indent = (html.match(/^([ \t]*)\/\* CUES:BEGIN/m) || ["", ""])[1];
  const fn = resolveCue.toString().replace(/\n/g, "\n" + indent);
  html = html.replace(CUES_RE, () => `/* CUES:BEGIN */ const CUE_DATA = ${JSON.stringify(CUE_DATA)};\n${indent}const cue = (spec, offset = 0) => resolveCue(CUE_DATA, spec, offset);\n${indent}${fn} /* CUES:END */`);
}
writeFileSync(COMP, html);
console.log(`audio ${audio.length}, captions ${caps.length}, cues ${calls.length} + ${clips} clips, total ${T.total}s`);
