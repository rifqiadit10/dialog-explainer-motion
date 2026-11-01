# Jebakan yang sudah pernah terjadi

| Gejala | Penyebab | Perbaikan |
|---|---|---|
| Bagian karakter (ring, gear, kepala) melompat jauh dari tempatnya saat di-scale/rotate | `svgOrigin`/`transformOrigin` GSAP salah menghitung pivot pada `<g>` yang hanya berisi `<use>` | Tulis transform pivot eksplisit lewat `attr: { transform: "rotate(r cx cy) translate(cx cy) scale(s) translate(-cx -cy)" }`, atau pakai CSS `transform-box: view-box; transform-origin: Xpx Ypx` |
| Kata-kata subtitle bertumpuk di satu titik | Class `.w` dipakai juga untuk objek dunia ber-`position: absolute` | Objek dunia memakai class lain (starter: `.wo`) |
| `check`: `content_overlap` antara teks dunia dan teks view | Dunia masih dirender di belakang view layar penuh | `tl.set("#viewport", { autoAlpha: 0 })` selama view tampil |
| `check`: kontras gagal pada papan dunia di penutup | Papan diredupkan scrim tagline | Pudarkan papan (`opacity: 0`) sejak kamera mulai mundur |
| Papan nama menabrak pill header saat kamera mundur | Papan masuk frame atas | Turunkan papan di dunia atau pudarkan saat penutup |
| Lingkaran/garis "path draw" meninggalkan titik sebelum mulai | `stroke-dasharray` satu nilai + linecap bulat | `dasharray = len + " " + (len + 40)`, mulai dari `dashoffset = len + lebar stroke` |
| `lint`: `gsap_non_transform_motion` pada `letterSpacing` | Tween properti layout | Pecah teks per huruf dan tween `x` tiap huruf |
| `lint`: `gsap_css_transform_conflict` | Transform CSS awal + tween GSAP di elemen yang sama | Hapus transform CSS, set nilai awal di `fromTo` |
| `lint`: `duplicate_audio_track` | Hening awal file berikutnya bertumpuk di track yang sama | Selang-seling track (sudah di build-root) dan potong durasi klip sampai akhir ucapan |
| `check`: `clip_media_fit` | `data-duration` audio lebih panjang dari file | Batasi dengan durasi file (sudah di build-root) |
| Lingkaran pulse/elemen terlihat sejak detik 0 | `fromTo` dengan `immediateRender` menulis nilai awal opacity > 0 | Pisahkan tween opacity: `fromTo(opacity 0 → x)` di waktu muncul |
| Snapshot di Windows gagal `ENOENT ... mkdtemp` | Path melewati batas 260 karakter | `npx hyperframes snapshot . -o snaps ...` (folder pendek di project) |
| `build-root`: `cue errors (index.html not written)` | Cue menyebut baris atau kata yang tidak ada di `timing.json` (skrip berubah, cue demo starter belum diganti) | Pilih kata dari `build-root.mjs --words`, tulis ulang cue-nya |
| Shot dan pose meleset setelah suara dibuat ulang | Waktu ditulis sebagai detik | Tulis sebagai cue kata |
| `align.mjs` menandai banyak baris `check this line` | Model whisper `*.en` menerjemahkan audio non-Inggris, atau `--language` salah | `--model small --language <kode>` |
| `align.mjs`: `hyperframes transcribe failed` | whisper.cpp belum ada dan tidak bisa dibangun (tanpa cmake) | Di WSL/Linux `uv tool install cmake`, atau `HYPERFRAMES_WHISPER_PATH` ke `whisper-cli` |
| HeyGen CLI tidak jalan di Windows | Belum ada build Windows | Pasang di WSL; `HEYGEN_WSL=1` untuk `tts.mjs` |
| TTS membaca singkatan dengan aneh | Ejaan tulisan dikirim apa adanya | Isi `spoken` di `lines.json` dengan ejaan fonetik resmi |
| Durasi jauh melewati target | Tempo voice lebih lambat dari perkiraan | Ukur tempo dari sampel, ringkas skrip, atau `speed` 1,05-1,1 |
| Heredoc panjang gagal di shell (`unexpected EOF`) | Kutipan di dalam skrip panjang | Tulis skrip ke file lalu jalankan dengan node |
| `hyperframes transcribe` membalas `whisper_unavailable` | Windows tanpa build whisper.cpp | Jalankan `whisper-cli` langsung (`references/audio.md`, catatan whisper) lalu `<id>.words.json` |
| HyperFrames di WSL menolak jalan (`requires Node.js >= 22`) | Node WSL lebih tua dari Node Windows | Pakai Node 22 di WSL, atau panggil `whisper-cli` langsung tanpa CLI HyperFrames |
| Perintah `wsl` dari Git Bash kehilangan path (`C:Users...`, `/tmp` jadi path Windows) | Git Bash mengonversi path dan memakan backslash | Panggil `wsl` dari PowerShell dengan path `/mnt/c/...` |
| ElevenLabs API: `paid_plan_required` | Plan Free tidak boleh memakai voice library lewat API | Upgrade, pakai voice bawaan/Voice Design, atau mode dialog di web UI + `split-take.mjs` |
| ElevenLabs CLI: `Invalid --params JSON` di PowerShell | Kutip ganda di-escape dengan backslash | `--params '{"language":"id"}'` (kutip tunggal, tanpa backslash) |
| Mix akhir sekitar -22 LUFS | Take TTS pelan (sekitar -25 LUFS) | Kompres ringan + `loudnorm=I=-16` pada take sebelum dipotong per baris |
| Musik berhenti sebelum video selesai | Trek lebih pendek dari komposisi | Sambung bagian tengah dengan `acrossfade`, fade-out sendiri (`references/audio.md`) |
| `carve.mjs` gagal memuat `@hyperframes/core` | Paket belum terpasang di project | `npm i -D @hyperframes/core@<versi pin CLI>` di folder video |
| Isometrik: label 3D meleset dari objeknya | Matriks dunia belum diperbarui sebelum proyeksi | `scene.updateMatrixWorld()` sebelum `project(camera)` |
| Isometrik: garis-garis gelap di jilbab atau rambut | Kain `DoubleSide` tipis membayangi dirinya | `receiveShadow = false` pada cangkang kain, tetap `castShadow` |
| Isometrik: papan nama kedai menabrak header | Papan jatuh di y 300-520, di bawah gradien pudar | Naikkan kamera supaya papan masuk area pudar, atau atur gradien `#fade` |
| Isometrik: wajah memenuhi layar dan terasa menyeramkan | Close-up terlalu rapat | Pakai framing DIKA/SARI di `references/isometrik.md` |
| Isometrik: elemen yang muncul kedua kali hilang saat di-scrub | `fromTo` kedua menulis nilai awal saat dibuat | `immediateRender: false` pada kemunculan kedua |
