---
name: dialog-explainer
description: Membuat video explainer berbentuk percakapan dua karakter ilustrasi (ngobrol, tanya-jawab, sketsa dialog) dengan suara TTS, lip-sync, subtitle karaoke, dan kamera yang bergerak di dalam satu dunia, bukan slide. Dibangun di atas HyperFrames (HTML + GSAP) dan dirender ke MP4, biasanya 9:16 untuk Reels/TikTok/Shorts. Gunakan skill ini setiap kali user meminta video edukasi, sosialisasi, iklan layanan masyarakat, atau penjelasan produk yang berbentuk dua orang/karakter ngobrol, "karakter animasi yang bicara", "video percakapan", "dua tokoh menjelaskan", atau ingin membuat video seperti contoh QRIS palsu, bahkan bila kata "dialog" tidak disebut. Juga gunakan untuk memperbaiki video dialog yang terasa statis atau seperti slide.
license: MIT
metadata:
  author: Rifqi Aditya
  version: "1.0.0"
  homepage: https://github.com/rifqiadit10/dialog-explainer
---

# Dialog Explainer

Skill ini membuat video penjelasan berbentuk obrolan dua karakter vektor setengah badan.
Keduanya berdiri di dalam satu dunia (bawaan: kedai dengan meja kasir), dan kamera bergerak
ke apa pun yang sedang dibicarakan: push ke wajah yang bicara, close-up ke benda yang disebut,
pan ke papan harga, cut ke reaksi pendengar. Penjelasan yang butuh grafik masuk lewat view
potong (insert layar HP, diagram, peta) atau overlay (checklist, notifikasi), bukan panel yang
melayang di atas karakter. Mulut karakter bergerak mengikuti timestamp kata dari TTS, subtitle
menyala per kata, dan musik dikarve di bawah suara.

Contoh lengkap yang sudah lolos `check` dan dirender: `examples/qris-palsu/` (64,6 detik, 9:16).

## Prinsip, dan alasannya

- **Satu dunia, kamera yang bekerja.** Versi pertama contoh QRIS memakai kamera diam dan panel
  grafik yang di-fade bergantian di atas karakter. Hasilnya terasa seperti slide. Adegan harus
  berganti karena kamera atau dunia bergerak, dan benda yang diceritakan (stand QRIS, papan
  harga, layar mesin kasir) harus ada di dunia itu. Jangan biarkan satu sudut pandang dipakai
  lebih dari dua adegan berturut-turut.
- **Suara menentukan waktu.** Buat TTS lebih dulu, lalu turunkan semua waktu (frame, shot
  kamera, pose, kemunculan grafik) dari timestamp kata. Kalau waktu ditebak, gerak kamera
  dan grafik tidak akan pas dengan kata yang diucapkan.
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
| Skill HyperFrames (`npx hyperframes skills update general-video`) | Kontrak composition, check, snapshot, render. Baca `/hyperframes` dan `/hyperframes-core` sebelum menulis HTML. |
| Node 18+, ffmpeg | Script di `scripts/`, pengukuran audio |
| HeyGen CLI, login OAuth oleh user | TTS dengan timestamp kata, katalog musik. macOS/Linux langsung; Windows lewat WSL (`HEYGEN_WSL=1`). Login dilakukan user sendiri. |
| `@hyperframes/core` (devDependency project) | `hyperframes-audio/scripts/carve.mjs` untuk karve musik |
| `@hyperframes/producer` (devDependency project) | `hyperframes-animation/scripts/animation-map.mjs` |

Samakan versi kedua package dengan pin CLI di `package.json` project.

## Alur kerja

Jalankan lewat `/hyperframes` (intent layer menulis `BRIEF.md`, route `general-video`).
Skill ini mengisi detail di tiap langkah.

1. **Brief.** Topik dan pesan inti satu kalimat, platform/rasio, durasi, siapa dua karakternya
   (peran: yang bingung/korban dan yang menjelaskan bekerja baik), gaya bahasa, musik, branding.
2. **Riset fakta.** Kumpulkan fakta dari sumber resmi ke `SOURCES.md`. Buka sendiri halaman
   sumber untuk klaim inti, angka, nomor telepon, dan URL yang akan diucapkan. Lihat `references/fakta.md`.
3. **Skrip dialog.** Tempo TTS bahasa Indonesia sekitar 2,1-2,3 kata per detik; 60 detik
   kira-kira 130 kata termasuk jeda. Struktur yang terbukti: hook rasa rugi, pesan inti di beat
   kedua, mekanisme, bukti nyata, cara mengecek, jalan keluar, tagline. Tulis di `audio/lines.json`
   (format di `references/audio.md`), satu entri per giliran bicara dengan nomor `frame`.
4. **Pilih suara.** Buat sampel 2-3 pasangan voice dengan baris pembuka asli, samakan loudness,
   biarkan user memilih. Ukur tempo sampel untuk memperkirakan durasi akhir.
5. **TTS dan timing.** `node <skill>/scripts/tts.mjs audio/lines.json audio/voice`, lalu
   `node <skill>/scripts/timing.mjs audio/lines.json audio/voice audio/timing.json`.
6. **Storyboard dan shot list.** Satu frame per beat di `STORYBOARD.md`, masing-masing dengan
   shot kamera yang dikunci ke kata (`references/kamera.md`). Bila `storyboard: yes`, buat sketsa
   statis dan minta persetujuan sebelum animasi.
7. **Project.** `npx hyperframes init videos/<nama> --non-interactive --example=blank --skill=general-video`,
   lalu salin isi `assets/starter/` (atau `examples/qris-palsu/` bila topiknya mirip) ke project.
   Bangun dunia sesuai topik: papan, benda yang akan disorot, latar.
8. **Pemeran.** Pakai atau ubah karakter bawaan, susun `POSES` per kata (`references/pemeran.md`).
9. **Kamera, view, overlay.** Isi `SHOTS` dari `timing.json`; buat view potong dan overlay di
   `compositions/`. Sembunyikan `#viewport` saat view penuh tampil.
10. **Suntik dialog.** `node <skill>/scripts/build-root.mjs` (audio, subtitle, data lip-sync).
    Bila ada musik: isi `music` di `lines.json`, jalankan ulang build-root, lalu karve
    (`references/audio.md`).
11. **Verifikasi.** `npx hyperframes check .` sampai 0 error (layout dan kontras ikut), snapshot di
    setiap waktu shot dan lihat sendiri hasilnya, lalu jalankan animation map untuk mencari dead zone.
12. **Persetujuan dan render.** Buka `npx hyperframes preview --background`, tanyakan render atau
    revisi, render hanya setelah disetujui, lalu verifikasi file (ffprobe, loudness, beberapa frame).

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
  audio/timing.json          timeline hasil timing.mjs
```

## Starter atau contoh?

- `assets/starter/`: demo 20 detik yang bisa langsung jalan. Rig kamera, dunia generik dengan
  teks placeholder, dua karakter, driver lip-sync dan subtitle, satu contoh view/overlay/tagline.
  Pakai untuk topik baru.
- `examples/qris-palsu/`: implementasi lengkap. Baca untuk melihat pola nyata (stiker ditempel
  tangan pelaku, rack focus, peta, cincin di harga). Saat menyalin, ganti semua yang spesifik
  topik: teks papan, benda di meja, view/overlay, `SHOTS`, `POSES`, kata kunci, sumber.

Ganti juga dunianya bila ceritanya bukan di kedai (kantor, pasar, klinik, ruang kelas). Rig,
pemeran, dan driver tetap sama; yang berubah hanya isi `#world-fx`.

## Referensi

| File | Baca saat |
|---|---|
| `references/kamera.md` | Menyusun shot list, rumus rig, peta koordinat dunia, view/overlay, rack focus |
| `references/pemeran.md` | Memakai, mengubah, atau membuat karakter; format `POSES`; driver lip-sync |
| `references/audio.md` | Format `lines.json`, memilih voice, TTS lewat WSL, timing, musik dan karve |
| `references/subtitle.md` | Aturan potongan subtitle, kata kunci, gaya karaoke |
| `references/fakta.md` | Riset dan verifikasi fakta, format `SOURCES.md`, klaim yang dilarang |
| `references/jebakan.md` | Gejala aneh saat build atau check (pivot salah, teks bertumpuk, path terlalu panjang) |

## Yang paling sering salah

- Lupa menyembunyikan dunia di belakang view penuh: `check` melaporkan teks bertumpuk.
- Class objek dunia dan class kata subtitle bertabrakan (subtitle jadi menumpuk).
- Teks di dunia masuk frame dan menabrak header saat kamera mundur: pudarkan dulu.
- `svgOrigin` GSAP pada `<g>` berisi `<use>` salah pivot: tulis transform pivot eksplisit.
- Snapshot di Windows gagal karena path terlalu panjang: arahkan `-o` ke folder pendek.

Detail dan perbaikannya ada di `references/jebakan.md`.
