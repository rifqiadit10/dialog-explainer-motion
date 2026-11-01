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

Singkatan yang harus dieja ditulis di `spoken` dengan tanda hubung (`["IASC", "I-A-S-C"]`,
`["AI", "A-I"]`): TTS mengeja per huruf, dan pencocokan kata mengabaikan tanda baca, jadi
`I-A-S-C` tetap cocok dengan `IASC` di subtitle dan cue. Kata yang dibaca lain sama sekali
(`QRIS` dibaca "Kris") tetap butuh entri `spoken` di `beats.json` varian isometrik.

Semua jalur suara berakhir di `audio/voice/<id>.mp3` + `<id>.json` (timestamp kata) per baris, jadi
langkah sesudahnya sama:

| Jalur | Script | Catatan |
|---|---|---|
| HeyGen CLI | `tts.mjs` | TTS dan timestamp sekaligus. Plan gratis hanya voice Orca dan kuota detik bulanan yang kecil; voice ElevenLabs lewat HeyGen butuh plan berbayar. |
| ElevenLabs API/CLI | `tts-el.mjs` | Satu take per baris dengan timing per karakter, tanpa whisper. Voice dari Voice Library lewat API butuh plan berbayar; plan Free hanya voice bawaan atau voice buatan sendiri (Voice Design). |
| ElevenLabs web UI, mode dialog | `split-take.mjs` | Satu generate untuk seluruh dialog (intonasi antar giliran paling nyambung), boleh di plan Free dengan voice library. Timing dari whisper, lalu dipotong per baris. |
| Rekaman atau TTS lain | `align.mjs` | Satu file per baris, timing dari alignment yang ada atau whisper. |

**Lisensi suara:** plan gratis umumnya non-komersial. ElevenLabs Free: "non-commercially with
attribution" (dokumen Billing ElevenLabs). Konten brand atau channel yang dimonetisasi hampir pasti
komersial: buat take final di plan yang memberi lisensi komersial, atau rekam suara sendiri.

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

## ElevenLabs lewat CLI (`tts-el.mjs`)

CLI resmi: `npm i -g @elevenlabs/cli` (atau Homebrew/Scoop). CLI hanya menerima API key dari
`ELEVENLABS_API_KEY`. User membuat key sendiri (sebaiknya dibatasi ke Text to Speech dan Voices
read, dengan batas credit), lalu memasangnya sebagai environment variable akun, bukan di chat atau
`.env` project. Agent tidak pernah menampilkan key; `user get` selalu dengan `--query` field tertentu,
dan jangan `--debug`. Di Windows, shell yang sudah berjalan bisa memuatnya tanpa restart:
`$env:ELEVENLABS_API_KEY = [Environment]::GetEnvironmentVariable('ELEVENLABS_API_KEY','User')`.

`lines.json` menambah blok `tts`:

```json
"tts": {
  "model_id": "eleven_v4",
  "output_format": "mp3_44100_128",
  "effects": { "TELEPON": { "filter_preset_id": "phone" } }
}
```

```bash
node <skill>/scripts/tts-el.mjs audio/lines.json audio/voice --dry-run   # bentuk request + jumlah karakter, tanpa credit
node <skill>/scripts/tts-el.mjs audio/lines.json audio/voice --only f1-1-dika   # uji satu baris dulu
node <skill>/scripts/tts-el.mjs audio/lines.json audio/voice
node <skill>/scripts/align.mjs audio/lines.json audio/voice   # membaca <id>.alignment.json, tanpa whisper
```

Biaya sekitar satu credit per karakter (cek di halaman Subscription). Sebutkan totalnya sebelum
generate penuh. Kalau API menolak voice library (`paid_plan_required`), pakai jalur web UI di bawah.
Di PowerShell, JSON untuk `--params` ditulis dengan kutip tunggal tanpa backslash
(`--params '{"language":"id"}'`).

## Satu take dialog, dipotong per baris (`split-take.mjs`)

Mode dialog ElevenLabs (Text to Speech, "Add speaker") membuat seluruh percakapan dalam satu kali
generate. Tombol "Add speaker" otomatis bergantian dua voice. Isi satu blok per baris `lines.json`
dengan bentuk `spoken`, set bahasa (jangan Auto), lalu generate. Satu generate memberi dua versi;
biarkan user mendengar dan memilih. Tag audio v4 seperti `[panicked]` boleh ditaruh di awal blok;
tag tidak diucapkan dan tidak masuk teks skrip.

1. Simpan take pilihan sebagai `audio/voice/dialog-take.raw.mp3` (minta izin user sebelum mengunduh).
2. Ukur loudness; take ElevenLabs bisa sekitar -25 LUFS. Normalkan sebelum dipotong, kalau tidak
   mix akhir jatuh di sekitar -22 LUFS:
   ```bash
   ffmpeg -i audio/voice/dialog-take.raw.mp3 -af "acompressor=threshold=-24dB:ratio=3:attack=5:release=80:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=7" -ar 44100 -c:a libmp3lame -b:a 160k audio/voice/dialog-take.mp3
   ```
3. Timestamp kata untuk seluruh take: buat spec berisi satu "baris" gabungan semua teks, lalu
   `align.mjs` (whisper):
   ```bash
   node -e 'const s=require("./audio/lines.json");require("fs").writeFileSync("audio/_whole.lines.json",JSON.stringify({language:s.language,spoken:s.spoken,lines:[{id:"dialog-take",frame:1,speaker:"MIX",text:s.lines.map(l=>l.text).join(" ")}]}))'
   node <skill>/scripts/align.mjs audio/_whole.lines.json audio/voice --model small --language id
   ```
4. Potong dan susun timeline:
   ```bash
   node <skill>/scripts/split-take.mjs audio/lines.json audio/voice dialog-take audio/timing.json --start 1.8 --gap f7-2-b=1.0 --detect dialog-take.raw
   ```
   Kata dibagi ke baris secara berurutan; titik potong di tengah jeda antar giliran (dideteksi dari
   take mentah lewat `--detect`, karena kompresi mengangkat jeda), dan kata pertama/terakhir tiap
   baris dirapikan ke jeda itu. Klip diletakkan di posisi aslinya, jadi ritme take terjaga.
   `--start` memberi ruang di awal (misalnya dering telepon), `--gap <id>=<detik>` menambah jeda
   sebelum satu baris dan menggeser baris sesudahnya. Speaker di `tts.filters` (filter ffmpeg)
   diberi efek pada klipnya, misalnya suara telepon:
   `highpass=f=300,lowpass=f=3400,acompressor=threshold=-20dB:ratio=4:attack=5:release=60,acrusher=bits=12:mix=0.15,volume=1.4`.

## Memilih pasangan suara

1. Ambil 2-3 kandidat pasangan (satu voice per karakter, berbeda gender atau warna suara).
2. Buat sampel dengan baris pembuka asli: `lines.json` kecil per pasangan, lalu `tts.mjs`
   (atau TTS lain + `align.mjs`).
3. Gabungkan per pasangan, potong hening di awal/akhir tiap baris berdasarkan timestamp kata,
   samakan loudness (`loudnorm=I=-16:TP=-1.5`), beri jeda 0,3 detik, lalu biarkan user memilih.
4. Hitung tempo (kata per detik) tiap pasangan dari sampel. Durasi akhir kira-kira
   `jumlah kata / tempo + jumlah giliran * 0,3`. Ringkas skrip kalau melewati target.

## Audio dari sumber lain (`align.mjs`)

Taruh satu file per baris `lines.json` sebagai `audio/voice/<id>.mp3` (.wav, .m4a, .ogg, dan .flac
diubah ke mp3 dengan ffmpeg), lalu:

```bash
node <skill>/scripts/align.mjs audio/lines.json audio/voice --model small --language id
```

`align.mjs` menulis `<id>.json` dengan format yang sama seperti `tts.mjs`. Sumber timestamp, urut:

1. `<id>.json` yang sudah berisi kata (dilewati kecuali `--force`).
2. `<id>.alignment.json`: respons ElevenLabs `with-timestamps` atau objek `alignment`-nya
   (`characters`, `character_start_times_seconds`, `character_end_times_seconds`).
3. `<id>.words.json`: `[{ "word" atau "text", "start", "end" }]` dalam detik, dari aligner atau TTS
   apa pun (WhisperX, Azure word boundary, dan lain-lain).
4. Selain itu `npx hyperframes transcribe` (whisper lokal).

Kata yang dikenali dicocokkan balik ke teks skrip (setelah substitusi `spoken`), termasuk kata yang
terdengar terpecah atau tergabung, jadi subtitle dan cue tetap memakai kata skrip. Kata yang
terlewat diisi interpolasi. Baris dengan kecocokan rendah diberi tanda `<- check this line`.

Catatan whisper:

- Bahasa selain Inggris: pakai model multibahasa (`small`, `medium`, `large-v3-turbo`) dan
  `--language`. Model `*.en` menerjemahkan ucapan ke bahasa Inggris.
- Pada contoh QRIS, `small` + `id` meleset dari timestamp HeyGen dengan median 0,14 detik (p90
  0,31 detik). Cukup untuk cue kamera dan subtitle. Untuk lip-sync yang lebih rapat, pakai TTS yang
  memberi timestamp atau `words.json` dari WhisperX.
- `transcribe` memakai whisper.cpp dan membangunnya sendiri bila belum ada (butuh cmake dan
  compiler C). Di WSL tanpa sudo, `uv tool install cmake` cukup. Alternatifnya, arahkan
  `HYPERFRAMES_WHISPER_PATH` ke `whisper-cli` yang sudah ada.
- Kalau `transcribe` membalas `{"ok":false,"skipped":true,"reason":"whisper_unavailable"}` (Windows
  tanpa build whisper), jalankan `whisper-cli` langsung (misalnya build hyperframes di WSL,
  `~/.cache/hyperframes/whisper/whisper.cpp/build/bin/whisper-cli` dengan model
  `~/.cache/hyperframes/whisper/models/ggml-small.bin`) pada wav 16 kHz mono:
  `whisper-cli -m ggml-small.bin -f take-16k.wav -l id -ml 1 -sow -ojf -of take`. Ubah
  `take.json` (`transcription[].text` dan `offsets.from/to` dalam milidetik) menjadi `<id>.words.json`,
  lalu jalankan `align.mjs`. Dari Windows, panggil `wsl` lewat PowerShell dengan path `/mnt/c/...`;
  Git Bash mengubah path dan backslash sebelum sampai ke WSL.

## TTS dan timing

```bash
node <skill>/scripts/tts.mjs audio/lines.json audio/voice
node <skill>/scripts/timing.mjs audio/lines.json audio/voice audio/timing.json
```

`timing.mjs` menaruh kata pertama tiap baris tepat setelah kata terakhir baris sebelumnya ditambah
jeda (`--turn-gap 0.3` antar giliran, `--frame-gap 0.45` antar frame), membuka frame `--lead-in 0.25`
detik sebelum kata pertamanya, dan menahan frame terakhir `--tail 1.8` detik. Hasilnya dipakai oleh
`build-root.mjs` (audio, subtitle, lip-sync) dan oleh semua cue kata (`references/kamera.md`).
`node <skill>/scripts/build-root.mjs --words` mencetak kata per baris untuk ditulis sebagai cue.

## Musik

Dari sumber dengan lisensi yang jelas. Katalog HeyGen (lisensi mengikuti akun user):

```bash
heygen audio sounds list --query "warm upbeat acoustic background for explainer" --limit 6 --min-score 0.5
```

Pilih trek yang lebih panjang dari video supaya tidak perlu loop. Potong dan beri fade:

```bash
ffmpeg -i bed-src.wav -af "atrim=0:<total>,afade=t=in:d=0.6,afade=t=out:st=<total-2.75>:d=2.75" -b:a 192k audio/music/bed.mp3
```

Kalau trek lebih pendek dari video, musik berhenti di tengah adegan. Sambung bagian tengahnya dengan
crossfade, lalu fade-out sendiri (contoh: trek 64,5 s menjadi 74,6 s):

```bash
ffmpeg -i bed.mp3 -filter_complex "[0:a]atrim=0:56,asetpts=PTS-STARTPTS[a];[0:a]atrim=40:64.5,asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=2:c1=tri:c2=tri,atrim=0:74.6,afade=t=out:st=72.4:d=2.2" -b:a 192k bed-74.mp3
```

Efek suara sederhana (dering, nada sambung, bunyi tutup telepon) bisa disintesis tanpa urusan
lisensi, misalnya dering dua nada dan nada sambung 425 Hz:

```bash
ffmpeg -f lavfi -i "aevalsrc='0.32*sin(2*PI*if(lt(mod(t\,0.1)\,0.05)\,1046\,1318)*t)*lt(mod(t\,1.05)\,0.7)':s=44100:d=2.1" -af "afade=t=in:d=0.02,afade=t=out:st=1.95:d=0.15,lowpass=f=5000" audio/sfx/ring.wav
ffmpeg -f lavfi -i "aevalsrc='0.22*sin(2*PI*425*t)':s=44100:d=0.8" -af "afade=t=in:d=0.03,afade=t=out:st=0.7:d=0.1,highpass=f=300,lowpass=f=3400" audio/sfx/ringback.wav
```

Varian isometrik mencue efek lewat `audio/sfx.json` (`scripts/audio-tags.mjs`).

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
