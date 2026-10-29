# HSK Simulator

Simulasi ujian HSK online dengan timer, audio listening, dan penilaian otomatis.

| Halaman | Isi |
|---|---|
| `index.html` | Halaman pembuka: pilih level |
| `hsk1/` | HSK 1: 40 soal, sekitar 36 menit, dengan pinyin |
| `hsk2/` | HSK 2: 60 soal, sekitar 56 menit, dengan pinyin |
| `hsk3/` | HSK 3: 70 soal, sekitar 83 menit |
| `hsk4/` | HSK 4: 70 soal, sekitar 81 menit |
| `hsk5/` | HSK 5: 72 soal, sekitar 105 menit (audio `listening.mp3`, gambar di `img/`) |
| `hsk5/mock1/`, `hsk5/mock2/` | HSK 5 全真模拟试卷 1 & 2 (Listening aktif otomatis saat `listening.mp3` ditaruh di folder masing-masing) |
| `hsk6/` | HSK 6 (H61330): latihan mendengarkan dengan subtitle sinkron (`listening.vtt`) |
| `log/` | Log kesalahan dari semua level, bisa diunduh sebagai CSV |

## Hasil peserta

Setiap peserta mengisi nama sebelum mulai. Saat ujian selesai, hasilnya dikirim ke **Netlify Forms**:
- `hasil-hsk1` untuk HSK 1
- `hasil-hsk2` untuk HSK 2
- `hasil-hsk3` untuk HSK 3
- `hasil-hsk4` untuk HSK 4
- `hasil-hsk5` untuk HSK 5 (样卷), `hasil-hsk5-mock1` dan `hasil-hsk5-mock2` untuk mock test

Hasilnya bisa dilihat di dashboard Netlify, menu **Forms**. Form detection harus aktif.

## Menjalankan di komputer

Jalankan server lokal dari folder ini, misalnya `python3 -m http.server`, lalu buka `http://localhost:8000`.
Pengiriman hasil hanya berfungsi setelah situsnya di-deploy di Netlify.

## Aplikasi (PWA)

Situs ini bisa dipasang sebagai aplikasi di HP dan laptop (`manifest.webmanifest`, `sw.js`, ikon di `icons/`).
- Android / Chrome: tekan tombol **Pasang** di halaman pembuka, atau pilih **Tambahkan ke layar utama** dari menu browser.
- iPhone / Safari: ketuk **Bagikan**, lalu **Tambah ke Layar Utama**.

Halaman yang sudah pernah dibuka bisa dibuka lagi tanpa internet. Untuk memaksa semua pengguna mengambil versi baru, naikkan nama `CACHE` di `sw.js`.

## Log kesalahan

Di halaman hasil setiap ujian, semua soal yang salah masuk ke daftar **Log kesalahan**. Peserta mengisi alasan salah, apa yang perlu diulang, dan tanggal review (otomatis 3 hari lagi), lalu menekan **Simpan ke log**.

- Log disimpan di perangkat peserta (`localStorage`, kunci `hsk-log`) dan bisa dilihat di `/log/`.
- Salinannya juga dikirim ke Netlify Forms dengan nama `log-kesalahan`.
- Kolom CSV: `date,level,section,question,my_answer,correct_answer,why_I_missed_it,what_to_review,review_date`
- Kode bersama ada di `log.js`. Soal Menulis yang dinilai guru (HSK 3 nomor 66–70, HSK 4 nomor 65–70, dan karangan HSK 5) tidak masuk log otomatis.

## Subtitle HSK 6

`hsk6/listening.vtt` adalah file WebVTT biasa dan bisa diedit dengan editor teks apa pun.
- Baris di atas waktu adalah nomor soal. Teks setelah `|` adalah judul bagian.
- Awali teks dengan `[?]` untuk menandai kalimat yang perlu dicek. Tanda ini tampil sebagai "⚑ cek".
- Transkrip saat ini mencakup soal 1–42. Jeda menjawab sekitar 13 detik setelah setiap soal menjadi patokan waktu tiap soal.

## Subtitle HSK 5 mock test 1

Transkrip listening mock test 1 (dari 听力文本) ada di `hsk5/mock1/transcript.json`: `q` = nomor soal, `spk` = 男/女/问, `s`/`e` = detik di audio (null kalau audionya belum ada).
Di halaman ujian setiap soal listening punya tombol **Tampilkan subtitle** sendiri; di halaman hasil ada **Review listening** dengan audio yang bisa diputar ulang.
Waktu subtitle soal 1–16 disinkronkan otomatis dengan speech recognition. Audio soal 17–35 belum tersedia.

## Subtitle interaktif & kosakata

Di subtitle listening (HSK 5 mock 1 dan HSK 6) setiap kata bisa diketuk: muncul pinyin, arti, tombol 🔊 (suara browser), dan **Simpan kata**.
- Pemotongan kata, pinyin, dan arti disiapkan sebelumnya di `words.json` tiap tes (jieba + pypinyin + CC-CEDICT). Arti dalam bahasa Inggris.
- Kode bersama ada di `reader.js`. Kata tersimpan di perangkat (`localStorage`, kunci `hsk-words`) dan tampil di `/kata/` (daftar, latihan kartu, unduh CSV).
- Kamus: CC-CEDICT, lisensi CC BY-SA 4.0 (https://cc-cedict.org).
- Di bagian listening ada tombol ⏯ (jeda/putar), kecepatan 0.75×–1.25×, dan sakelar pinyin. Timer berhenti saat audio dijeda.
