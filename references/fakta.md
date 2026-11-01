# Fakta dan sumber

Video edukasi dibagikan luas dan dipercaya penonton. Satu klaim keliru (nomor pengaduan salah,
janji uang pasti kembali, statistik karangan) bisa merugikan orang yang mengikutinya.

## Cara riset

1. Mulai dari sumber resmi lembaga yang berwenang (regulator, kementerian, lembaga resmi), lalu
   media besar yang mengutip mereka. Catat tanggal dan URL.
2. Tandai setiap klaim: **terverifikasi** (sumber jelas) atau **tidak terverifikasi**. Yang tidak
   terverifikasi tidak masuk skrip.
3. Buka sendiri halaman sumber untuk klaim inti, angka, nomor telepon, nama layanan, dan URL yang
   akan diucapkan atau ditampilkan. Ringkasan dari alat pengambil halaman bisa meleset.
4. Bila agent bisa menjalankan proses atau agent lain di latar belakang, riset bisa berjalan
   bersamaan dengan brief. Minta laporan dengan label terverifikasi/tidak dan daftar
   "aman dipakai" vs "jangan dipakai".

## `SOURCES.md`

```markdown
# Sumber fakta (dicek <tanggal>)

Diverifikasi langsung di halaman sumber:
- <klaim>. <lembaga, nomor dokumen, tanggal>. <URL>

Dari riset (ringkasan, sumber resmi atau media besar):
- <klaim>. <sumber>. <URL>
```

## Yang tidak boleh masuk skrip

- Janji hasil yang tidak dijamin sumber (misalnya "uang pasti kembali").
- Statistik nasional yang tidak ada data resminya, atau angka dari sumber yang saling bertentangan.
- Saran dari pihak non-resmi yang ditulis seolah imbauan lembaga.
- Batas waktu, nomor, atau prosedur yang tidak tercantum di sumber.
- Nama orang, toko, atau merek nyata sebagai contoh pelaku; pakai nama fiktif yang jelas fiktif.

## Kartu sumber hanya mengutip isi sumber

Kesalahan yang pernah terjadi: kartu sumber menyebut siaran pers lembaga resmi untuk klaim yang
tidak tertulis di siaran pers itu; rincian kasusnya ternyata hanya ada di media lain. Aturannya:

- Buka sendiri halaman yang akan ditulis di kartu, lalu cocokkan kalimat kartu dengan isi halaman.
  Kalau kalimatnya tidak ada, ganti sumbernya atau ganti kalimatnya.
- Pertahankan kata kehati-hatian sumber: "diduga", "terindikasi", "sekitar". Kalau sumber menulis
  "diduga jadi korban", kartu tanpa "diduga" melebihi sumber.
- Angka selalu dengan tanggal potong datanya ("<angka> laporan, s.d. <tanggal>"). Angka dari dua
  sumber yang cakupannya berbeda tidak dibandingkan atau digabung.
- Kalau halaman berisi salah ketik (daftar yang mengulang satu item, jumlah di judul berbeda dengan
  daftar), jangan kutip bagian itu; catat di `SOURCES.md`.
- Ringkasan dari alat pengambil halaman atau agent lain adalah petunjuk, bukan bukti. PDF yang gagal
  dibaca agent dibuka sendiri sebelum dikutip.
- Saran praktis (misalnya tips keamanan) tetap butuh sumber, boleh dari bank atau media besar, dan
  ditulis sebagai saran, bukan imbauan lembaga.

## Di layar

Tampilkan sumber singkat di kartu bukti ("Sumber: Kompas") dan di penutup ("Sumber: <lembaga>").
Logo resmi lembaga atau produk (misalnya logo QRIS) tidak dipakai; tulis namanya sebagai teks.
Pola QR dekoratif dibuat acak dan tidak bisa di-scan.
