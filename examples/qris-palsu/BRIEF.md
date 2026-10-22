---
workflow: general-video
flow: automation
storyboard: yes
message: "Sebelum bayar QRIS, cek nama merchant di layar HP. Kalau beda, jangan bayar."
destination: reels
aspect: "9:16"
length: 60s
language: id
audience: masyarakat umum pengguna QRIS (pembeli dan pemilik usaha kecil), penonton Reels/TikTok/Shorts
angle: dua teman ngobrol santai; satu baru kena tipu QRIS palsu, satu lagi memberi tips
---

## Intent

Video edukasi sekitar 60 detik tentang modus QRIS palsu, berbentuk percakapan dua teman. Jawaban user: format "Karakter ilustrasi + suara", platform "Reels/TikTok/Shorts (9:16)", durasi "Sekitar 60 detik", cerita "Dua teman ngobrol santai". Brief dikonfirmasi user: "Brief sesuai".

## Customizations

- Suara: TTS HeyGen bahasa Indonesia, satu voice per karakter. Pasangan voice dipilih user dari sampel. HeyGen CLI dipanggil lewat WSL (Windows).
- Musik latar tipis, di-carve di bawah dialog (user: "Musik tipis di bawah suara").
- Musik: lagu akustik hangat dari katalog HeyGen (tidak disertakan di repo), volume 0.32, voiceover carve strength 0.8.

## Notes

- Inferred (bukan jawaban user): karakter fiktif Dika (laki-laki, korban) dan Sari (perempuan, memberi tips); register "aku/kamu"; karakter vektor buatan sendiri dengan mulut mengikuti timestamp kata; subtitle besar di atas zona UI Reels (bawah ~20%, tepi kanan).
- QRIS diucapkan "Kris" (bi.go.id: QRIS dibaca "Kris"). Teks TTS memakai ejaan fonetik, subtitle tetap "QRIS".
- Fakta hanya dari sumber terverifikasi (lihat SOURCES.md). Dilarang: menjanjikan uang pasti kembali, statistik nasional khusus QRIS, "cek NMID" sebagai imbauan BI/OJK, batas waktu lapor tertentu.
