# DESIGN - qris-palsu-ngobrol

Concept: obrolan santai di kedai kopi yang berubah jadi alarm. Hangat dan akrab, dengan satu aksen coral untuk bahaya.

## Palette

| Token | Hex | Pakai untuk |
|---|---|---|
| paper | #FFF4E4 | background dinding kedai |
| ink | #1F2633 | teks utama, panel subtitle |
| accent | #E4572E | bahaya: stiker palsu, rekening pelaku, tanda silang |
| safe | #2F9E6E | hanya centang dan "berhasil" |
| highlight | #FFC24A | kata kunci di subtitle |
| card | #FFFDF8 | kartu dan layar HP |
| wood | #B9794A / #9A5F36 | meja kasir |
| dika | #2E6E80 | hoodie Dika, chip nama DIKA |
| sari | #E3A23B | hijab Sari, chip nama SARI |

## Type

- Archivo Black (bundled, 400 only): judul, subtitle, angka langkah. Tracking -0.02em.
- Space Mono 400/700 (bundled): UI di layar HP, label, sumber, URL.
- Ukuran in-feed: judul >= 90px, subtitle 46px, teks kartu >= 32px, label >= 24px.

## Layout 1080x1920

- Header y 168. Zona grafik y 250-890 (sub-composition 1080x640). Karakter y 860-1460. Meja kasir y 1350-1920. Subtitle y 1380-1530.
- Teks penting tetap di x 64-944 (tepi kanan tertutup tombol Reels/TikTok), dan tidak ada teks di bawah y 1536.

## Don'ts

- Tidak memakai logo QRIS resmi; "QRIS" ditulis sebagai teks biasa.
- Pola QR adalah pola acak dekoratif, bukan kode yang bisa di-scan.
- Nama toko dan merchant fiktif: "KEDAI KOPI KITA" dan "TOKO SERBA ADA 21".

## Cast (karakter vektor di index.html)

- Dua karakter setengah badan di balik meja kasir, kiri dan kanan, masuk dari bawah meja di detik awal.
- Dika: hoodie teal #2E6E80, rambut pendek. Sari: jilbab mustard #E3A23B dengan ciput krem, lilitan di bawah dagu, kain berlipat ke dada; blus plum #8E4E6B supaya bahu terbaca.
- Mulut: closed / open / mid / smile (+ frown untuk Dika), dibuka per suku kata dari timestamp kata TTS. Kedip, napas pelan, dan miring kepala saat bicara digerakkan satu driver di timeline root.

## Audio

- Dialog: HeyGen TTS (Orca) satu voice per karakter, timestamp kata dipakai untuk lip-sync dan subtitle karaoke.
- Musik tipis di bawah dialog, volume 0.32, voiceover carve (hyperframes-audio) terhadap grup `voiceover`.
- Subtitle: kartu gelap per potongan kalimat, kata aktif membesar, kata kunci kuning #FFC24A.

## Dunia dan kamera (v2)

- Satu dunia kedai di rig `#world` (transform-origin 0 0); tiap shot menaruh titik dunia P di titik layar Q pada skala S: x = Q.x - S*P.x, y = Q.y - S*P.y. Header, subtitle, view, dan overlay di luar rig.
- Benda cerita hidup di dunia: papan nama, papan menu dengan harga, stand QRIS di meja, mesin kasir dengan layar status. Grafik penjelas tidak melayang di atas karakter.
- Ukuran shot berganti mengikuti kata di dialog: wide, MCU pembicara, close-up benda, pan ke benda yang disebut. Cut ke pendengar untuk reaksi.
- Maksimal dua adegan berturut-turut dengan sudut yang sama. Pemecah monoton: insert layar HP (push-through), diagram, peta (instrumen), POV dari balik bahu dengan rack focus.
- Saat view penuh tampil, `#viewport` disembunyikan. Teks di dunia dipudarkan sebelum menabrak header atau tagline.
- Maksimal dua tingkat teks per adegan di overlay; label dunia (papan, layar mesin) dihitung objek.
