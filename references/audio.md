# Audio: naskah, suara, timing, musik

## `audio/lines.json`

```json
{
  "language": "id",
  "voices": { "DIKA": "<voice_id>", "SARI": "<voice_id>" },
  "spoken": [["QRIS", "Kris"]],
  "keywords": [["nama", "merchant"], ["cek", "dulu"]],
  "music": { "src": "audio/music/bed.mp3", "volume": 0.32 },
  "lines": [
    { "id": "f1-1-dika", "frame": 1, "speaker": "DIKA", "text": "Sar, kayaknya aku kena tipu." },
    { "id": "f1-2-sari", "frame": 1, "speaker": "SARI", "text": "Hah? Jangan-jangan QRIS palsu." }
  ]
}
```

- `speaker` = id karakter (huruf kecilnya dipakai di SVG dan chip subtitle).
- `spoken`: bentuk tulisan → bentuk yang dikirim ke TTS. Subtitle tetap menampilkan bentuk tulisan.
  Cek ejaan resmi untuk singkatan (contoh: Bank Indonesia menulis QRIS dibaca "Kris").
- `keywords`: urutan kata (huruf kecil, tanpa tanda baca) yang tampil berwarna sorot di subtitle.
- `music` opsional. File musik tidak disertakan di repo; ambil dari sumber yang lisensinya jelas.
- `speed` opsional (0,5-2,0) untuk mempercepat suara yang terlalu lambat.

## HeyGen CLI

User harus memasang CLI dan login sendiri (OAuth membuka browser):

```bash
curl -fsSL https://static.heygen.ai/cli/install.sh | bash
heygen auth login --oauth
```

CLI belum punya build Windows; di Windows pasang di WSL lalu jalankan script dengan `HEYGEN_WSL=1`
(opsional `HEYGEN_WSL_DISTRO=Ubuntu`, `HEYGEN_BIN=/home/<user>/.local/bin/heygen`).
Jangan menyimpan API key di repo atau di `lines.json`.

Daftar voice per bahasa dan gender:

```bash
heygen voice list --language Indonesian --gender female --limit 100
```

Voice berlabel bahasa Indonesia terdengar paling natural; voice "Multilingual" bisa dipakai tapi
logatnya kadang kurang lokal.

## Memilih pasangan suara

1. Ambil 2-3 kandidat pasangan (satu voice per karakter, berbeda gender atau warna suara).
2. Buat sampel dengan baris pembuka asli: `lines.json` kecil per pasangan, lalu `tts.mjs`.
3. Gabungkan per pasangan, potong hening di awal/akhir tiap baris berdasarkan timestamp kata,
   samakan loudness (`loudnorm=I=-16:TP=-1.5`), beri jeda 0,3 detik, lalu biarkan user memilih.
4. Hitung tempo (kata per detik) tiap pasangan dari sampel. Durasi akhir kira-kira
   `jumlah kata / tempo + jumlah giliran * 0,3`. Ringkas skrip kalau melewati target.

## TTS dan timing

```bash
node <skill>/scripts/tts.mjs audio/lines.json audio/voice
node <skill>/scripts/timing.mjs audio/lines.json audio/voice audio/timing.json
```

`timing.mjs` menaruh kata pertama tiap baris tepat setelah kata terakhir baris sebelumnya ditambah
jeda (`--turn-gap 0.3` antar giliran, `--frame-gap 0.45` antar frame), membuka frame `--lead-in 0.25`
detik sebelum kata pertamanya, dan menahan frame terakhir `--tail 1.8` detik. Hasilnya dipakai oleh
`build-root.mjs`, `SHOTS`, `POSES`, dan timeline view/overlay.

## Musik

Katalog HeyGen (lisensi mengikuti akun user):

```bash
heygen audio sounds list --query "warm upbeat acoustic background for explainer" --limit 6 --min-score 0.5
```

Pilih trek yang lebih panjang dari video supaya tidak perlu loop. Potong dan beri fade:

```bash
ffmpeg -i bed-src.wav -af "atrim=0:<total>,afade=t=in:d=0.6,afade=t=out:st=<total-2.75>:d=2.75" -b:a 192k audio/music/bed.mp3
```

## Karve musik di bawah suara

Karve meredam hanya pita frekuensi suara pada musik dan menurunkannya saat ada dialog, jadi musik
tetap hidup tanpa menutupi suara. Butuh `@hyperframes/core` sebagai devDependency project.

```bash
npm i -D @hyperframes/core@<versi pin CLI>
node <hyperframes-audio>/scripts/carve.mjs --comp index.html
```

Semua klip suara memakai `data-audio-group="voiceover"` (ditulis build-root), musik
`data-audio-group="music"`. `build-root.mjs` mempertahankan atribut karve saat dijalankan ulang;
kalau elemen musik dibuat ulang dari nol, jalankan carve lagi.

## Cek level

Setelah render: `ffmpeg -i video.mp4 -af ebur128=peak=true -f null -`. Target untuk feed sosial
sekitar -14 sampai -16 LUFS, peak di bawah -1 dBFS.
