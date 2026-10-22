# Subtitle

`build-root.mjs` membuat satu kartu subtitle per potongan kalimat, masing-masing sebagai clip
dengan waktu sendiri, dan setiap kata sebagai `<span class="w" data-s data-e>`.

## Aturan potongan

- Potong setelah `, . ? !` (minimal dua kata), atau saat sudah 6 kata / 30 karakter.
- Jangan memotong di tengah frasa kata kunci, kecuali sudah 44 karakter.
- Potongan terakhir yang hanya satu kata digabung ke potongan sebelumnya.
- Kartu tampil 0,08 detik sebelum kata pertamanya dan bertahan sampai kartu berikutnya bila
  jedanya kurang dari 0,7 detik; bila tidak, 0,45 detik setelah kata terakhir.
- Tanda hubung diganti tanda hubung tak-putus (`&#8209;`) supaya "Anti-Scam" tidak terbelah ke baris lain.

## Gaya karaoke

Kata yang belum diucapkan redup (opacity 0,45), kata yang sedang diucapkan membesar 8% dengan
cahaya tipis, kata kunci tetap berwarna sorot. Satu driver `onUpdate` mengurus semua kata
(rule HyperFrames: `asr-keyword-glow`). Jangan membuat satu tween per kata.

## Tampilan dan zona aman

- Kartu gelap (`--ink`) dengan chip nama pembicara berwarna sesuai karakter.
- Posisi `top: 1378px`, lebar 880px dari `left: 64px`: di atas zona UI aplikasi (bawah ~20%)
  dan menjauhi tombol di tepi kanan.
- Huruf 46px Archivo Black; kata kunci memakai `--highlight`. Kontras harus lolos `check`.
- Class kata subtitle adalah `.w`. Jangan memakai class `.w` untuk hal lain (misalnya objek dunia
  dengan `position: absolute`): subtitle akan menumpuk.

## Memilih kata kunci

Pilih frasa yang membawa pesan (tindakan, bahaya, nama lembaga), 1-2 per kalimat. Kalau semua kata
disorot, tidak ada yang menonjol.
