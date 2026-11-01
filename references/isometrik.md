# Varian isometrik 3D

Dunia kedai low-poly (Three.js 0.181.2) di bawah chrome HTML tetap: header beat, kartu sumber,
caption ketik, footer. Kamera terbang di dalam dunia 3D; karakter Dika dan Sari punya wajah,
lengan berengsel, dan mulut per suku kata. Dipakai saat seri butuh ciri khas yang lebih kuat dari
starter vektor, atau cerita butuh tempat dan gerak (peta, karakter berjalan masuk, benda yang
terbang, telepon yang berdering).

Repo ini tidak menyertakan proyek contoh untuk gaya ini. Susun komposisinya dari bagian di bawah:
mulai dari dunia dan dua pemeran, lalu shot kamera dan beat, lalu overlay dan label. Ambil
snapshot sesering mungkin; nilai framing dan pose di sini sudah teruji di dua video.

## Alur build

```bash
node <skill>/scripts/beats.mjs        # beats.json + audio/timing.json -> SERIES, BEATS di index.html
node <skill>/scripts/audio-tags.mjs   # klip suara, efek (audio/sfx.json), musik, panjang komposisi
node <hyperframes-audio>/scripts/carve.mjs --comp index.html   # setiap kali elemen musik ditulis ulang
npx hyperframes lint
npx hyperframes snapshot --at <waktu,...> --no-end --no-browser-gpu -o <folder pendek>
npx hyperframes render -q high -o renders/<nama>.mp4
```

Timeline suara dibuat dengan jalur di `references/audio.md` (`timing.mjs` atau `split-take.mjs`).
`beats.mjs` berhenti tanpa menulis file kalau kata beat tidak cocok dengan kata bertimestamp, atau
kalau beat tidak menutup semua kata satu baris.

## `beats.json`

```json
{
  "series": { "brand": "brandkamu.id", "show": "dialog explainer", "badge": "DIALOG EXPLAINER - CONTOH" },
  "spoken": [["QRIS", "Kris"]],
  "beats": [
    { "line": "f2-3-b", "text": "Itu tautan palsu!", "chip": "Ternyata", "head": ["tautan", "palsu"],
      "kw": ["tautan", "palsu"], "stamp": { "text": "PALSU!", "at": "palsu" },
      "src": { "from": "<lembaga>, <tanggal>", "text": "<kalimat yang memang tertulis di sumber>" } }
  ]
}
```

- Satu beat = satu potongan caption dari satu baris, berurutan. Header beat: `chip` lalu `head`
  (kata kedua oranye). Beat berikutnya dengan header sama tidak memudar ulang.
- `kw`: kata yang tetap oranye setelah beat selesai. `stamp`: teks besar miring yang muncul di kata
  `at`. `src`: kartu sumber yang hanya mengutip isi sumber (`references/fakta.md`).
- `series` mengisi teks brand di atas dan badge berputar. Logo footer (kalau ada) ditulis di markup
  `#foot .by` sebagai `<img>`, bukan disisipkan JavaScript, supaya sudah dimuat saat frame diambil.
- Speaker yang tidak tampil (misalnya suara dari telepon) memakai id speaker sendiri di
  `lines.json`; teks chip caption-nya diatur di kode, dan suaranya tidak menggerakkan mulut siapa pun.

## Waktu: beat, kata, cue cerita

Di skrip klasik: `B(n)` adalah beat ke-n (`start`, `end`, `in` = 0,15 s sebelum kata pertama,
`out` = `in` beat berikutnya), `W(n, "kata")` waktu mulai kata pertama yang cocok di beat itu.
Waktu cerita yang dipakai bersama dunia 3D (misalnya saat telepon diangkat atau ditutup) ditaruh di
`window.CUE.T`, dan modul Three.js membacanya dari `window.CUE`. Jangan menulis detik mentah:
take baru menggeser semuanya.

## Lapisan

`#bg`, `#dots`, `canvas#world`, `#fade` (gradien putih atas dan bawah), `#leaders` + `#tags` (label
3D), overlay (`#phone`, `#callcard`, panel, kartu langkah), `#stamps`, lalu chrome: `#brand`,
`.head`, `.src` (top 1222), `#cap` (top 1370, tinggi 168), `#foot`. Area aman overlay: antara
bawah header (sekitar y 540) dan kartu sumber (y 1222). Stamp di y 1110 supaya tidak menutup wajah.
Overlay penuh memakai `blur(tin, tout)` pada `#world` (4 px) supaya dunia tetap terlihat di
belakangnya.

`#fade` atas buram penuh sampai y 345 dan transparan di y 520. Tulisan besar di dunia (papan nama
kedai) yang jatuh di y 300-520 menabrak header: naikkan kamera (pandangan lebih menunduk) supaya
papan masuk ke area pudar, atau turunkan sampai di bawah 520.

## Dunia dan kit

- `mesh`, `box`, `cyl`, `canvasTex` (tekstur teks setelah `document.fonts.load`), `faced` (satu
  sisi box bertekstur). Material `mat(color)` di-cache per warna: objek yang warnanya berubah per
  frame (layar HP) butuh material sendiri.
- `build()` async; komposisi menunggu `window.__hf.buildReady[key]`, render ulang pada event
  `hf-seek`, dan memakai `window.__hfThreeTime`. Root butuh `data-duration`.
- Sebelum memproyeksikan label atau menempelkan objek ke posisi dunia benda lain, panggil
  `scene.updateMatrixWorld()`; tanpa itu label anak objek meleset satu frame atau lebih.
- Kain dan rambut `DoubleSide` yang tipis membayangi dirinya sendiri jadi garis-garis: biarkan
  hanya `castShadow`, matikan `receiveShadow`.

## Pemeran

`makePerson(o)`: posisi `at`, arah `face`, warna kulit/baju/celana, `skirt`, `ears`, fungsi `head`
untuk rambut atau jilbab, `body` untuk celemek. Skala 1,2, kepala 1,15. Wajah ramah: mata oval
dengan titik kilau, alis kapsul, hidung, pipi, senyum torus yang berganti mulut elips saat bicara.

Lengan memakai pose `[rotasi bahu x, rotasi bahu z (dicerminkan sisi lengan), rotasi siku x]`,
dicampur dengan `mix(a, b, k)` dan bobot `ramp()`:

| Pose | Nilai (lengan sisi `s`) | Dipakai untuk |
|---|---|---|
| `rest` | `[0.04, s*0.09, -0.12]` | diam |
| `hold` | `[-0.42, -s*0.28, -1.75]` | memegang HP di depan dada |
| `ear` | `[-1.8, s*0.42, -2.16]` | HP di telinga (siku ke depan-luar; tangan sekitar 6 cm dari telinga) |
| bicara | `[-0.5, s*0.22, -1.0 + 0.12 sin]` | gestur saat bicara |

Untuk pose baru, cari sudut dengan pencarian grid kecil (rotasi Euler XYZ: `Rx(Rz(v))`, lengan
atas dan bawah masing-masing 0,3) dan beri penalti kalau siku masuk ke badan.

Mulut membuka per suku kata dari kata bertimestamp; kepala menoleh ke kamera saat bicara; kedip
dan napas jalan terus. Karakter berjalan masuk: posisi `lerp` dengan ease, sedikit memantul dan
bergoyang, menghadap arah jalan lalu berbalik ke lawan bicara di 40% terakhir, `visible = false`
sebelum mulai.

## Kamera

`SHOTS`: baris `[t, durasi gerak (0 = cut), posisi, target, fov, ease, drift/s]`, dibuat dengan
`shot(t, d, [pos, tgt, fov], ease, drift)`. Gerak berikutnya selalu mulai dari pose saat itu,
jadi gerakan yang tumpang tindih tetap mulus. Framing yang sudah terbukti untuk kedai:

| Nama | Posisi -> target, fov | Catatan |
|---|---|---|
| EST | (16.5, 12.5, 23) -> (-0.7, 1.9, 0.8), 38 | pembuka dan penutup |
| DIKA | (3.35, 2.68, 8.6) -> (0.75, 2.06, 3.45), 32 | close-up longgar, kepala tidak tertutup kartu atas |
| SARI | (0.0, 2.5, 8.7) -> (2.35, 1.8, 3.55), 32 | close-up longgar |
| TWO | (1.55, 3.1, 12.2) -> (1.55, 1.45, 3.0), 34 | berdua; kamera tinggi supaya papan nama masuk area pudar |

Close-up yang lebih rapat dari ini membuat wajah memenuhi layar dan terasa menyeramkan. Jangan
pakai satu framing lebih dari dua beat berturut-turut, kecuali dunianya diblur di bawah overlay.

## Pola yang sudah terbukti

- **Telepon berdering:** HP bergetar (`rotation.z = 0.12 sin(60t)`), layar berwarna, tiga cincin
  `RingGeometry` (material sendiri, transparan, `depthWrite: false`) menghadap kamera, tumbuh dan
  memudar dari posisi dunia HP.
- **Kartu panggilan:** satu elemen dengan `data-state` (`ring`, `live`, `end`, `back`) yang diganti
  `tl.set(el, { attr: { "data-state": ... } })`; CSS menampilkan anak `.v.<state>`. Timer dan
  batang suara diperbarui di `render(t)`.
- **Panel penjelasan:** kartu dan panah muncul pada kata yang menyebutnya (sumber, proses, hasil).
  Kartu data: batang `scaleX` dari 0 dengan stagger, baris yang dibahas disorot.
- **Tampil kedua kali:** elemen yang muncul lagi memakai `fromTo` dengan `immediateRender: false`.
- **Label 3D:** tag + garis + titik jangkar, offset per label. Jaga tag di dalam x 60-1020 dan di
  bawah header; label wajah dijangkar di atas kepala dengan offset ke samping.
- **Penutup memanggil pembuka:** adegan pertama diulang dengan hasil yang berbeda (tokohnya kini
  menerapkan langkah yang baru dijelaskan), lalu tarik mundur ke shot EST.

## Cek sebelum render

1. `npx hyperframes lint`: 0 error (peringatan ukuran file boleh).
2. Snapshot di awal setiap beat dan di setiap kejadian (dering, masuknya karakter, overlay, stamp),
   lalu lihat contact sheet: header bertabrakan dengan tulisan dunia, label terpotong di tepi,
   wajah tertutup stamp atau kartu, overlay menimpa kartu sumber atau caption.
3. Setelah render: `ffprobe` (durasi, 1080x1920, 30 fps), loudness -16 sampai -14 LUFS dengan peak
   di bawah -1 dBFS, dan beberapa frame yang diambil dari MP4 final, bukan dari preview.
