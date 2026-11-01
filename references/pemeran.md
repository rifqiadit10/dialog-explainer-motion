# Pemeran: karakter, pose, lip-sync

## Anatomi SVG karakter

Tiap karakter adalah satu `<svg class="actor" viewBox="0 0 420 600">` di dalam `#world-fx`,
dengan id karakter sebagai prefiks. Driver di root mencari elemen dengan id berikut, jadi
karakter baru harus memakai nama yang sama polanya:

| Id | Isi | Wajib |
|---|---|---|
| `<id>` | svg karakter | ya |
| `<id>-head` | grup kepala (miring saat bicara) | ya |
| `<id>-eyes` | grup mata (kedip lewat `scaleY`) | ya |
| `<id>-brow-<nama>` | satu grup per ekspresi alis: `neutral`, `worried`, `up` | minimal satu |
| `<id>-mouth-<nama>` | `closed`, `open`, `mid`, `smile` (+ `frown` opsional) | `open`, `mid`, dan satu mulut diam |
| `<id>-arm-<nama>` | pose tangan: `phone`, `explain`, `up` | opsional |

CSS yang dibutuhkan (sudah ada di starter):

```css
.actor .eyes { transform-box: fill-box; transform-origin: 50% 50%; }
#<id>-head { transform-box: view-box; transform-origin: 210px 300px; }   /* pivot di leher */
#<id>-arm-up { transform-box: view-box; transform-origin: <bahu x>px <bahu y>px; }
```

Kunci di `PARTS` (root script) mendaftar varian tiap karakter. Tambah karakter atau varian = tambah
grup SVG + entri di `PARTS`.

## Pose per waktu

```js
const POSES = {
  dika: [
    [0, { brow: "worried", rest: "frown", arm: "none" }],
    [cue("f1-1-dika:bayar"), { arm: "phone" }],   // saat kata "Bayar"
    [cue("f7-2-sari"), { arm: "up" }],             // tos saat baris terakhir mulai
  ],
  sari: [ ... ],
};
```

Tiap entri `[waktu, perubahan]` menimpa keadaan sebelumnya. `rest` adalah mulut saat tidak bicara.
`arm: "up"` dianimasikan berputar dari bahu dengan `back.out` (tos). Tulis waktu sebagai cue kata
(`references/kamera.md`) dengan urutan naik, dan beri pendengar ekspresi juga (alis naik saat kaget,
senyum saat lega).

## Lip-sync

`build-root.mjs` menyuntik `CAST_LINES`: per baris `who`, `start`, `end`, dan per kata
`[mulai, selesai, jumlah suku kata]` (dihitung dari gugus vokal). Saat sebuah kata diucapkan,
mulut bergantian `open`/`mid` per suku kata, dengan `mid` di 28% akhir tiap suku kata. Di luar
kata, mulut kembali ke `rest`. Kepala miring sinus kecil saat bicara; napas dan kedip berjalan
terus. Semua dihitung dari waktu dalam satu driver `onUpdate`, jadi deterministik saat dirender.

## Membuat atau mengubah karakter

- Gambar dengan bentuk datar dan palet hangat yang sama dengan dunia. Kontras baju dengan latar
  harus jelas; baju yang warnanya mirip dinding membuat bahu "hilang".
- Representasikan orang dengan hormat dan beragam. Pakaian seperti jilbab harus berbentuk kain
  sungguhan: kepala bulat dengan ciput di dahi, kain yang membingkai wajah dan melilit di bawah
  dagu, jatuh berlipat ke dada. Bentuk balok lurus dengan cincin wajah tebal terlihat seperti
  kostum; itu kesalahan versi pertama contoh.
- Tangan dan lengan harus tumbuh dari bahu dengan lengan baju; tangan yang muncul dari samping
  terbaca sebagai gumpalan.
- Untuk mengganti nama karakter, ganti prefiks id di SVG, CSS, `PARTS`, `POSES`, dan kunci speaker
  di `lines.json` (huruf kecil di id, chip subtitle memakai huruf besar).
- Setelah mengubah karakter, ambil snapshot close-up wajah (crop dari frame MCU) dan bandingkan
  sebelum/sesudah.
- Wajah harus terasa ramah, terutama di 3D: mata bulat kecil tanpa kilau, tanpa hidung, mulut
  datar, dan close-up yang terlalu rapat dinilai user "serem" pada versi pertama varian isometrik.
  Yang memperbaikinya: mata oval dengan titik kilau putih, hidung kecil, pipi, senyum saat diam yang
  berganti mulut terbuka saat bicara, kepala sedikit lebih besar, dan framing close-up yang lebih
  longgar. Pemeran 3D dijelaskan di `references/isometrik.md`.
