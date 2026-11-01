---
name: dialog-explainer-motion
description: Membuat video explainer berbentuk percakapan dua karakter ilustrasi (ngobrol, tanya-jawab, sketsa dialog) dengan suara TTS, lip-sync, subtitle karaoke, dan kamera yang bergerak di dalam satu dunia, bukan slide. Dua gaya - vektor datar atau dunia isometrik 3D low-poly (Three.js) dengan karakter 3D. Dibangun di atas HyperFrames (HTML + GSAP) dan dirender ke MP4, biasanya 9:16 untuk Reels/TikTok/Shorts. Suara dari HeyGen, ElevenLabs (API atau satu take dialog dari web UI), atau rekaman. Gunakan skill ini setiap kali user meminta video edukasi, sosialisasi, iklan layanan masyarakat, atau penjelasan produk yang berbentuk dua orang/karakter ngobrol, "karakter animasi yang bicara", "video percakapan", "dua tokoh menjelaskan", atau ingin membuat video seperti contoh QRIS palsu, bahkan bila kata "dialog" tidak disebut. Juga gunakan untuk memperbaiki video dialog yang terasa statis atau seperti slide.
license: MIT
compatibility: Agent apa pun yang bisa menjalankan shell dan membaca file. Butuh Node 18+, ffmpeg, skill HyperFrames (npx hyperframes skills update general-video), dan suara dengan cap waktu kata, dari HeyGen CLI, ElevenLabs CLI (@elevenlabs/cli), atau audio apa pun yang diselaraskan dengan whisper lokal (hyperframes transcribe atau whisper-cli). macOS/Linux langsung, Windows lewat WSL untuk HeyGen dan whisper.
metadata:
  author: Rifqi Aditya
  version: "1.2.0"
  homepage: https://github.com/rifqiadit10/dialog-explainer-motion
---

# Dialog Explainer Motion

Skill ini membuat video penjelasan berbentuk obrolan dua karakter vektor setengah badan.
Keduanya berdiri di dalam satu dunia (bawaan: kedai dengan meja kasir), dan kamera bergerak
ke apa pun yang sedang dibicarakan: push ke wajah yang bicara, close-up ke benda yang disebut,
pan ke papan harga, cut ke reaksi pendengar. Penjelasan yang butuh grafik masuk lewat view
potong (insert layar HP, diagram, peta) atau overlay (checklist, notifikasi), bukan panel yang
melayang di atas karakter. Mulut karakter bergerak mengikuti timestamp kata dari TTS, subtitle
menyala per kata, dan musik dikarve di bawah suara.

Ada dua gaya dengan alur kerja yang sama:

- **Vektor** (`assets/starter/`, `examples/qris-palsu/`): karakter SVG setengah badan, rig kamera
  2D, cue kata `cue("baris:kata")`.
- **Isometrik 3D** (`references/isometrik.md`): dunia low-poly Three.js dengan karakter 3D
  berwajah, kamera terbang, label 3D, panel overlay, dan header beat. Waktu memakai `B(n)` dan
  `W(n, "kata")` dari `beats.json`. Repo ini tidak menyertakan proyek contoh untuk gaya ini;
  susun dari kit, pola, dan nilai di referensi itu.

Contoh yang sudah lolos `check` dan dirender: `examples/qris-palsu/` (64,6 detik, 9:16).

Skill ini tidak bergantung pada agent tertentu. Yang dibutuhkan hanya kemampuan menjalankan
perintah shell, membaca dan menulis file, serta bertanya ke user. `<skill>` di bawah berarti
folder tempat skill ini terpasang.

## Prinsip, dan alasannya

- **Satu dunia, kamera yang bekerja.** Versi pertama contoh QRIS memakai kamera diam dan panel
  grafik yang di-fade bergantian di atas karakter. Hasilnya terasa seperti slide. Adegan harus
  berganti karena kamera atau dunia bergerak, dan benda yang diceritakan (stand QRIS, papan
  harga, layar mesin kasir) harus ada di dunia itu. Jangan biarkan satu sudut pandang dipakai
  lebih dari dua adegan berturut-turut.
- **Suara menentukan waktu.** Buat suara lebih dulu, lalu turunkan semua waktu (frame, shot
  kamera, pose, kemunculan grafik) dari timestamp kata. Tulis waktu sebagai cue kata
  (`cue("f2-1-sari:merchant")`), bukan detik: take suara baru, voice lain, atau jeda yang
  berubah lalu tidak merusak koreografi. Kalau waktu ditebak, kamera tidak pas dengan kata.
- **Fakta dulu, desain belakangan.** Video edukasi publik yang salah fakta merugikan penonton.
  Setiap klaim harus punya sumber resmi atau media besar di `SOURCES.md`; klaim yang tidak bisa
  diverifikasi dibuang dari skrip, bukan diperhalus.
- **Aman di layar ponsel.** Di 9:16, bagian bawah sekitar 20% dan tepi kanan tertutup UI
  Reels/TikTok. Subtitle duduk tepat di atas zona itu; teks penting tetap di x 64-944.
- **Paling banyak dua tingkat teks per adegan.** Label kecil + judul + keterangan + sumber
  sekaligus terbaca seperti slide. Tulisan di dunia (papan nama, layar mesin) dihitung objek.

## Prasyarat

| Kebutuhan | Untuk apa |
|---|---|
| Skill HyperFrames (`npx hyperframes skills update general-video`) | Kontrak composition, check, snapshot, render. Baca skill `hyperframes` dan `hyperframes-core` sebelum menulis HTML. |
| Node 18+, ffmpeg | Script di `scripts/`, pengukuran audio |
| Suara dengan timestamp kata, salah satu: | |
| - HeyGen CLI, login OAuth oleh user | `scripts/tts.mjs`: TTS + timestamp sekaligus, juga katalog musik. macOS/Linux langsung; Windows lewat WSL (`HEYGEN_WSL=1`). Plan gratis: hanya voice Orca, kuota kecil. |
| - ElevenLabs CLI, API key dipasang user di environment | `scripts/tts-el.mjs`: satu take per baris dengan timing per karakter. Voice library lewat API butuh plan berbayar. |
| - ElevenLabs web UI, mode dialog | Satu take untuk seluruh dialog, lalu `scripts/split-take.mjs` memotongnya per baris. Bisa di plan Free. |
| - Audio dari mana saja (TTS lain, rekaman voice-over) | `scripts/align.mjs`: membaca alignment ElevenLabs, file kata JSON dari aligner apa pun, atau menjalankan whisper lokal (`hyperframes transcribe`). |
| Varian isometrik | `scripts/beats.mjs` (beat ke `index.html`) dan `scripts/audio-tags.mjs` (klip suara, efek dari `audio/sfx.json`, musik) |
| `@hyperframes/core` (devDependency project) | `hyperframes-audio/scripts/carve.mjs` untuk karve musik |
| `@hyperframes/producer` (devDependency project) | `hyperframes-animation/scripts/animation-map.mjs` |

Samakan versi kedua package dengan pin CLI di `package.json` project.

## Alur kerja

Mulai dari skill `hyperframes` (intent layer menulis `BRIEF.md`, route `general-video`).
Skill ini mengisi detail di tiap langkah.

1. **Brief.** Topik dan pesan inti satu kalimat, platform/rasio, durasi, siapa dua karakternya
   (peran: yang bingung/korban dan yang menjelaskan bekerja baik), gaya bahasa, musik, branding.
2. **Riset fakta.** Kumpulkan fakta dari sumber resmi ke `SOURCES.md`. Buka sendiri halaman
   sumber untuk klaim inti, angka, nomor telepon, dan URL yang akan diucapkan. Lihat `references/fakta.md`.
3. **Skrip dialog.** Tempo TTS bahasa Indonesia sekitar 2,1-2,3 kata per detik; 60 detik
   kira-kira 130 kata termasuk jeda. Struktur yang terbukti: hook rasa rugi, pesan inti di beat
   kedua, mekanisme, bukti nyata, cara mengecek, jalan keluar, tagline. Ceritakan proses nyata
   yang punya titik balik (kejadian yang membalik keadaan di tengah cerita), pakai satu
   tokoh yang sama dari awal sampai akhir, dan buat penutup mengulang adegan pembuka dengan hasil
   yang berbeda. Kerangka ini sejalan dengan grammar cerita di cth9191/animate (MIT). Tulis di
   `audio/lines.json` (format di `references/audio.md`), satu entri per giliran bicara dengan
   nomor `frame`. Kalau user minta usulan topik, cari data terbaru (misalnya laporan resmi per
   modus), lalu usulkan 3-4 topik dengan hook, alasan, dan tiga langkah ceknya.
4. **Pilih suara.** Tanyakan sumber suara (HeyGen, ElevenLabs, TTS lain, atau rekaman) dan
   jelaskan lisensinya: plan gratis umumnya non-komersial. Buat sampel 2-3 pasangan voice dengan
   baris pembuka asli, samakan loudness, biarkan user memilih. Kalau user tidak mau sampel, pilih
   pasangan yang paling cocok dan sebutkan alasannya. Ukur tempo untuk memperkirakan durasi akhir.
   Sebutkan perkiraan credit sebelum generate, dan uji satu baris dulu.
5. **Suara dan timing.** HeyGen: `node <skill>/scripts/tts.mjs audio/lines.json audio/voice`.
   ElevenLabs API: `node <skill>/scripts/tts-el.mjs audio/lines.json audio/voice` lalu `align.mjs`.
   Satu take dialog (ElevenLabs web UI): normalkan loudness, `align.mjs` pada spec gabungan, lalu
   `node <skill>/scripts/split-take.mjs ...` yang langsung menulis `audio/timing.json`.
   Sumber lain: taruh `audio/voice/<id>.mp3` per baris, lalu
   `node <skill>/scripts/align.mjs audio/lines.json audio/voice --model small --language id`.
   Lalu `node <skill>/scripts/timing.mjs audio/lines.json audio/voice audio/timing.json` dan
   `node <skill>/scripts/build-root.mjs --words` untuk daftar kata yang bisa dijadikan cue.
   Rinciannya di `references/audio.md`.
6. **Storyboard dan shot list.** Satu frame per beat di `STORYBOARD.md`, masing-masing dengan
   shot kamera yang dikunci ke kata, ditulis sebagai cue (`references/kamera.md`). Bila
   `storyboard: yes`, buat sketsa statis dan minta persetujuan sebelum animasi.
7. **Project.** `npx hyperframes init videos/<nama> --non-interactive --example=blank --skill=general-video`,
   lalu salin isi `assets/starter/` (atau `examples/qris-palsu/` bila topiknya mirip) ke project.
   Untuk gaya isometrik, susun `index.html` dari kit dan pola di `references/isometrik.md` (beat,
   properti, shot, label) alih-alih langkah 8-10 di bawah.
   Bangun dunia sesuai topik: papan, benda yang akan disorot, latar.
8. **Pemeran.** Pakai atau ubah karakter bawaan, susun `POSES` dengan cue kata (`references/pemeran.md`).
9. **Kamera, view, overlay.** Isi `SHOTS` dengan cue kata (ganti semua cue demo di starter); klip
   view/overlay memakai `data-cue` dan `data-cue-end`. Buat view potong dan overlay di
   `compositions/`. Sembunyikan `#viewport` saat view penuh tampil.
10. **Suntik dialog.** `node <skill>/scripts/build-root.mjs` (audio, subtitle, data lip-sync, data
    cue). Build berhenti tanpa menulis file bila ada cue yang baris atau katanya tidak ada.
    Bila ada musik: isi `music` di `lines.json`, jalankan ulang build-root, lalu karve
    (`references/audio.md`).
11. **Verifikasi.** `npx hyperframes check .` sampai 0 error (layout dan kontras ikut), snapshot di
    setiap waktu shot dan lihat sendiri hasilnya, lalu jalankan animation map untuk mencari dead zone.
    Bila agent tidak bisa melihat gambar, andalkan `check` dan animation map, lalu kirim contact sheet
    snapshot ke user dan minta user mengeceknya sebelum lanjut.
12. **Persetujuan dan render.** Buka `npx hyperframes preview --background`, tanyakan render atau
    revisi, render hanya setelah disetujui, lalu verifikasi file: ffprobe (durasi, ukuran, fps),
    loudness -16 sampai -14 LUFS dengan peak di bawah -1 dBFS, dan beberapa frame yang diambil dari
    MP4 final (bukan dari preview): teks yang terpotong atau bertumpuk, label di tepi layar, wajah
    yang tertutup stamp atau kartu.

## Struktur project hasil

```
videos/<nama>/
  BRIEF.md  STORYBOARD.md  SCRIPT.md  SOURCES.md  frame.md
  index.html                 root: dunia (#world), pemeran, kamera, subtitle, audio
  compositions/views/        potongan layar penuh (insert HP, diagram, peta)
  compositions/overlays/     lapisan di atas dunia (checklist, notifikasi, POV)
  compositions/frames/       penutup (tagline)
  audio/lines.json           naskah + voice + kata kunci + musik
  audio/voice/               hasil TTS (.mp3 + .json timestamp)
  audio/timing.json          timeline hasil timing.mjs (atau split-take.mjs)
  beats.json                 varian isometrik: beat caption, header, stamp, kartu sumber, series
  audio/sfx.json             varian isometrik: efek suara yang dicue ke kata
```

## Starter atau contoh?

- `assets/starter/`: demo 20 detik yang bisa langsung jalan. Rig kamera, dunia generik dengan
  teks placeholder, dua karakter, driver lip-sync dan subtitle, satu contoh view/overlay/tagline.
  Pakai untuk topik baru.
- `examples/qris-palsu/`: implementasi lengkap. Baca untuk melihat pola nyata (stiker ditempel
  tangan pelaku, rack focus, peta, cincin di harga). Saat menyalin, ganti semua yang spesifik
  topik: teks papan, benda di meja, view/overlay, `SHOTS`, `POSES`, kata kunci, sumber.
- Gaya isometrik tidak punya starter atau contoh di repo; `references/isometrik.md` memuat kit,
  pose, framing kamera, dan pola yang sudah terbukti. Branding dari `"series"` di `beats.json`.

Ganti juga dunianya bila ceritanya bukan di kedai (kantor, pasar, klinik, ruang kelas). Rig,
pemeran, dan driver tetap sama; yang berubah hanya isi `#world-fx`.

## Referensi

| File | Baca saat |
|---|---|
| `references/kamera.md` | Menyusun shot list, cue kata, rumus rig, peta koordinat dunia, view/overlay, rack focus |
| `references/pemeran.md` | Memakai, mengubah, atau membuat karakter; format `POSES`; driver lip-sync |
| `references/audio.md` | Format `lines.json`, jalur suara dan lisensinya, HeyGen lewat WSL, ElevenLabs CLI dan satu take dialog (`split-take.mjs`), audio dari sumber lain (`align.mjs`), whisper di Windows, timing, musik dan karve |
| `references/isometrik.md` | Gaya isometrik 3D: `beats.json`, lapisan, kit dunia, pose lengan, framing kamera, pola (telepon, kartu panggilan, panel), cek sebelum render |
| `references/subtitle.md` | Aturan potongan subtitle, kata kunci, gaya karaoke |
| `references/fakta.md` | Riset dan verifikasi fakta, format `SOURCES.md`, klaim yang dilarang |
| `references/jebakan.md` | Gejala aneh saat build atau check (pivot salah, teks bertumpuk, path terlalu panjang) |

## Yang paling sering salah

- Menulis detik untuk shot dan pose: begitu suara dibuat ulang, kamera meleset dari kata. Pakai cue.
- Model whisper `*.en` untuk audio non-Inggris: kata diterjemahkan, `align.mjs` memberi tanda.
- Lupa menyembunyikan dunia di belakang view penuh: `check` melaporkan teks bertumpuk.
- Class objek dunia dan class kata subtitle bertabrakan (subtitle jadi menumpuk).
- Teks di dunia masuk frame dan menabrak header saat kamera mundur: pudarkan dulu.
- `svgOrigin` GSAP pada `<g>` berisi `<use>` salah pivot: tulis transform pivot eksplisit.
- Snapshot di Windows gagal karena path terlalu panjang: arahkan `-o` ke folder pendek.
- Kartu sumber memuat klaim yang tidak tertulis di sumbernya, atau membuang "diduga".
- Take TTS terlalu pelan (mix sekitar -22 LUFS) atau musik lebih pendek dari video.
- Isometrik: close-up terlalu rapat (wajah terasa menyeramkan) dan papan nama menabrak header.

Detail dan perbaikannya ada di `references/jebakan.md`.
