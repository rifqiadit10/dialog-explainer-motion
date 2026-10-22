---
format: 1080x1920
duration: 64.6s
message: "Sebelum bayar QRIS, cek nama merchant di layar HP. Kalau beda, jangan bayar."
arc: Hook (kena tipu) → Pesan (cek nama merchant) → Modus → Bukti nyata → Cara cek → Kalau terlanjur → Tagline
audience: pengguna QRIS (pembeli dan pemilik usaha kecil) di Reels/TikTok/Shorts
mode: collaborative
---

## Frame 1 — Kena tipu

- scene: Wide kedai (papan nama, menu, stand QRIS, mesin kasir) → push MCU Dika + HP saat 'Bayar' → pan ke kasir 'BELUM MASUK' saat 'kasirnya' → cut MCU Sari 'Hah?'
- duration: 10.06s
- transition_in: cut
- status: animated
- src: index.html (#world)
- voiceover: "DIKA: Sar, kayaknya aku kena tipu. Bayar kopi pakai QRIS, saldo kepotong, tapi kasirnya bilang uangnya nggak masuk. / SARI: Hah? Jangan-jangan QRIS palsu."
- shape: camera rules viewport-change (wide → MCU → pan → cut) + sine-wave-loop (idle karakter) + asr-keyword-glow (subtitle)

Hook dalam bahasa penonton: uang sudah terpotong tapi tidak sampai. Langsung ke rasa rugi.

## Frame 2 — Cek nama merchant

- scene: Kamera menembus layar HP Dika ke insert besar; judul 'Cek nama merchant sebelum bayar.'; nama merchant distabilo, kaca pembesar
- duration: 5.41s
- transition_in: push-through
- status: animated
- src: compositions/views/insert-hp.html
- voiceover: "SARI: Makanya, sebelum bayar, cek dulu nama merchant di layar HP kamu."
- shape: camera push-through (viewport-change) + waterfall-entry (judul) + css-marker-patterns (nama merchant)

Pesan inti mendarat di beat kedua (reverse iceberg). Imbauan BI, siaran pers 25/93/DKom.

## Frame 3 — Modusnya

- scene: CU stand QRIS di meja; tangan pelaku menempel stiker palsu saat 'stiker'; whip ke diagram: kas toko dicoret, uang ke rekening pelaku
- duration: 9.8s
- transition_in: cut
- status: animated
- src: index.html (#world) + compositions/views/aliran-uang.html
- voiceover: "DIKA: QRIS palsu gimana? / SARI: Pelaku nempelin stiker QR miliknya di atas QRIS asli. Kamu scan, uangnya masuk ke rekening dia, bukan ke toko."
- shape: camera CU + nudge-curve (stiker ditempel) + whip + svg-path-draw (aliran uang)

Bukti mekanisme: kenapa cek nama itu penting.

## Frame 4 — Beneran terjadi

- scene: Peta Pulau Jawa, zoom ke Jawa Barat; pin Jakarta 2023 dan Bandung 2025 dengan callout + sumber
- duration: 8.18s
- transition_in: push-through
- status: animated
- src: compositions/views/peta-jawa.html
- voiceover: "DIKA: Emang beneran ada? / SARI: Ada. Di Jakarta pernah ditemukan di kotak amal masjid. Di Bandung, pedagang pujasera juga kena."
- shape: instrumen peta: viewport-change (zoom wilayah) + spring-pop-entrance (pin) + callout

Bukti sosial dari kasus terverifikasi (BI, Medcom, Kompas). Tanpa angka kerugian.

## Frame 5 — Cara cek

- scene: POV dari balik bahu: HP di depan, rack focus ke papan nama (≠); pan ke harga di menu (cincin hijau); pan ke stiker (cincin merah); pan ke kasir; chip checklist satu baris
- duration: 13.6s
- transition_in: cut
- status: animated
- src: index.html (#world) + compositions/overlays/f5-pov.html
- voiceover: "DIKA: Terus ngeceknya gimana? / SARI: Satu, nama merchant harus sama dengan nama toko. Dua, cek nominalnya. Tiga, kalau ada QR ditempel di atas QR lain, jangan bayar. Ragu? Tanya kasir."
- shape: camera POV + depth-of-field-blur (rack focus) + viewport-change (pan per poin) + svg-path-draw (cincin) + waterfall-entry (chip)

Inti yang bisa dipraktikkan. Nama toko dan merchant fiktif.

## Frame 6 — Kalau terlanjur

- scene: MCU Dika cemas memegang HP → two-shot; tiga langkah muncul sebagai notifikasi saat 'hubungi', 'simpan', 'lapor'
- duration: 9.65s
- transition_in: cut
- status: animated
- src: index.html (#world) + compositions/overlays/f6-notif.html
- voiceover: "DIKA: Aku udah terlanjur bayar... / SARI: Segera hubungi bank atau e-wallet kamu, simpan bukti bayar, lalu lapor ke Indonesia Anti-Scam Centre OJK."
- shape: camera MCU → two-shot (viewport-change) + spring-pop-entrance (notifikasi)

Jalan keluar resmi. Tidak menjanjikan uang pasti kembali.

## Frame 7 — Cek dulu, baru bayar

- scene: Kamera mundur, papan dipudarkan + scrim kertas; tagline 'Cek dulu, baru bayar.'; Dika dan Sari tos; sumber BI, OJK
- duration: 7.85s
- transition_in: pull-back
- status: animated
- src: compositions/frames/07-tagline.html
- voiceover: "DIKA: Oke, mulai sekarang cek nama dulu, baru bayar. / SARI: Cek dulu, baru bayar!"
- shape: camera pull back + kinetic-beat-slam (tagline) + ambient-glow-bloom

Tagline yang gampang diingat, ditutup dengan sumber.

## Notes — shot pass (2026-10-22)

User: "shotnya kyk masih kurang oke gitu". Diagnosa (aturan anti-slide bang-motion + review-loop):
- Kamera tidak pernah bergerak: satu framing wide yang sama selama 64.5 detik; tidak ada rig kamera, hanya drift latar.
- Adegan berganti karena panel grafik di zona atas di-fade masuk/keluar, bukan karena kamera/dunia bergerak (pola slide).
- Objek cerita tidak hidup di dunia: HP besar melayang sementara HP di tangan Dika kecil; QRIS dan papan toko tidak pernah ada di kedai.
- Sudut pandang sama di 7 frame (aturan: maksimal 2 adegan berturut-turut dengan sudut sama).
- F4 dan F6 memakai 3+ tingkat teks (kicker/judul/sub/sumber).

Usulan (opsi A, direkomendasikan): satu dunia kedai dengan rig kamera `#world`; caption dan header tetap di luar rig.
- F1: wide establishing (papan "KEDAI KOPI KITA", stand QRIS di meja) → push ke medium close-up Dika + HP di tangan → pan ke kasir → cut MCU Sari "Hah?".
- F2: insert close-up layar HP Dika, nama merchant di-highlight.
- F3: close-up stand QRIS di meja, stiker palsu ditempel di atasnya; tarik mundur ke diagram aliran uang.
- F4: instrumen peta Indonesia, pin Jakarta dan Bandung + tag sumber.
- F5: POV dari balik bahu: HP di depan ("TOKO SERBA ADA 21"), papan toko di belakang ("KEDAI KOPI KITA"), rack focus antar keduanya; checklist ringkas di layer layar.
- F6: MCU Dika cemas memegang HP; tiga langkah muncul sebagai notifikasi di layar HP.
- F7: tarik mundur ke wide two-shot, tos, tagline.
Audio, timing, subtitle, dan karakter dipakai ulang. Status: disetujui user ("Bangun opsi A") dan dibangun (v2).

Yang berubah di v2:
- Root: dunia kedai (#world: papan nama, papan menu, rak, lampu, stand QRIS + stiker palsu + tangan pelaku, mesin kasir) dengan 18 shot kamera yang dikunci ke kata; rack focus blur di F5; dunia disembunyikan saat view penuh tampil.
- View baru: compositions/views/insert-hp.html (F2), aliran-uang.html (F3 akhir), peta-jawa.html (F4).
- Overlay baru: compositions/overlays/f5-pov.html (HP foreground, chip satu baris, cincin harga dan stiker), f6-notif.html (langkah sebagai notifikasi, tanpa kicker).
- F7 memakai 07-tagline.html dengan scrim kertas; papan nama/menu dipudarkan saat kamera mundur.
- Verifikasi: check lulus (layout 0 error, contrast 60/60), animation map 271 tween tanpa dead zone.
