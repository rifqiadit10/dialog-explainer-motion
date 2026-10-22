# Kamera, dunia, view, overlay

## Rig

`#viewport` (memotong frame) berisi `#world` (yang digerakkan kamera) berisi `#world-fx`
(tempat blur fokus). `#world` memakai `transform-origin: 0 0`, jadi GSAP `x, y, scale` berarti
`layar = (x, y) + scale * dunia`. Untuk menaruh titik dunia **P** di titik layar **Q** pada skala **S**:

```
x = Q.x - S * P.x
y = Q.y - S * P.y
```

Helper di starter: `const cam = (S, P, Q) => ({ scale: S, x: Q[0] - S*P[0], y: Q[1] - S*P[1] })`.
Tiap baris `SHOTS` adalah `[waktu, durasi (0 = cut), S, P, Q, ease]`. Cut memakai `tl.set`,
gerak memakai `tl.to` pada elemen yang sama. Header, subtitle, view, dan overlay ada di luar rig,
jadi tidak ikut terskala.

Latar dunia (dinding, meja) dibuat jauh lebih besar dari 1080x1920 (`left/top: -700px`), supaya
saat kamera zoom atau pan tidak pernah terlihat tepi kosong.

## Peta koordinat dunia bawaan (1080x1920)

| Titik | Koordinat dunia | Catatan |
|---|---|---|
| Wajah karakter A (kiri) | (250, 1060) | svg `left:40 top:860`, kepala svg (210, 200) |
| HP di tangan A (pose `phone`) | (383, 1203) | layar HP berisi centang + nominal |
| Wajah karakter B (kanan) | (830, 1086) | svg `left:620 top:860` |
| Benda utama di meja | (540, 1250) | stand/objek cerita, berdiri di atas meja (y 1350) |
| Papan nama | (330, 364) pusat | `#w-sign`, top 300 |
| Papan menu/info | (825, 434) pusat | `#w-menu`, top 290 |
| Mesin kasir (contoh QRIS) | (910, 1240) | layar status di dunia |
| Meja | mulai y 1350 | bagian bawah frame tertutup subtitle dan UI aplikasi |

Q yang aman untuk subjek di 9:16: x 540, y 620-820. Subjek di atas y 1378 supaya tidak tertutup subtitle.

## Kosakata shot

| Shot | Kapan | Nilai yang terbukti |
|---|---|---|
| Wide establishing | Awal, memperkenalkan tempat | S 1.0 → 1.06 push pelan, 2 detik |
| MCU pembicara | Saat seseorang mulai bicara hal penting | S 2.0-2.25 |
| Close-up benda | Saat benda disebut ("stiker", "harga") | S 2.6-2.75 |
| Pan ke benda | Kata yang menunjuk benda lain | 0,6-0,75 detik `power3.inOut` |
| Cut ke pendengar | Reaksi ("Hah?") | `tl.set` tepat 0,1-0,2 detik sebelum kata |
| Push-through | Masuk ke layar HP lalu ke insert | S naik ke ~7 dalam 0,35 detik `power3.in`, view masuk saat puncak |
| Whip | Pindah ke diagram | view masuk dari kanan, `x 380 → 0` + blur 18 → 0, 0,32 detik |
| Two-shot | Daftar langkah, pendengar ikut terlihat | S 1.35-1.5 |
| Pull back | Penutup, tagline | ke S ~1.22 dalam 1,2-1,4 detik |
| POV dari balik bahu | Membandingkan benda di tangan dengan benda di dunia | overlay HP besar di depan, dunia di belakang, rack focus |

Mulai gerak sekitar 0,2-0,3 detik sebelum kata yang memicunya, supaya kamera tiba bersamaan
dengan kata. Ambil waktu kata dari `audio/timing.json` (`lines[].words[].start`).

Aturan ritme: jangan pakai sudut yang sama lebih dari dua adegan berturut-turut, dan hold yang
panjang tanpa aksi objek butuh perubahan ukuran shot (bukan sekadar napas kamera).

## View potong dan overlay

- **View** (`compositions/views/`): sub-composition layar penuh dengan latar sendiri (insert HP,
  diagram aliran, peta). Saat view tampil, sembunyikan dunia:
  `tl.set("#viewport", { autoAlpha: 0 }, mulai + 0.2)` lalu `autoAlpha: 1` saat kembali.
  Tanpa ini, `check` melaporkan teks dunia bertumpuk dengan teks view.
- **Overlay** (`compositions/overlays/`): transparan, di atas dunia (chip checklist, notifikasi,
  HP foreground untuk POV). Taruh teks overlay di area yang tidak dipakai subjek shot saat itu.
- **Penutup** (`compositions/frames/`): tagline di zona atas. Saat kamera mundur, papan dunia
  akan masuk frame dan menabrak header atau tagline. Pudarkan `#w-sign`/`#w-menu` sejak awal
  penutup dan nyalakan `#scrim` (gradien kertas) di belakang tagline.

## Rack focus

Pasang blur di `#world-fx`, bukan di `#world` (transform dan filter dipisah):
`tl.set("#world-fx", { filter: "blur(7px)" }, t)` saat HP foreground tajam, lalu
`tl.to("#world-fx", { filter: "blur(0px)", duration: 0.35 }, t2)` sambil membuat HP
foreground blur 6px. Rule HyperFrames terkait: `depth-of-field-blur`.

## Peta sebagai instrumen

Contoh `examples/qris-palsu/compositions/views/peta-jawa.html` membangun garis pantai dari titik
(bujur, lintang) dengan proyeksi `X = (bujur - 105) * 100`, `Y = (-lintang - 5.8) * 100`, lalu
dihaluskan dengan Catmull-Rom. Kamera di dalam peta memakai rumus yang sama dengan rig dunia.
Pin digambar di dalam peta (ikut terskala), callout teks di layar (tetap tajam). Untuk wilayah
lain, ganti daftar titik dan proyeksinya.

## Verifikasi

Ambil snapshot di setiap waktu shot dan di tengah tiap view. Periksa: subjek tidak terpotong,
tidak ada tepi dunia kosong, teks overlay tidak menutupi subjek, papan dunia tidak menabrak header.
