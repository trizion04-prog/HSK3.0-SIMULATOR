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
| `hsk6/` | HSK 6 (H61330): latihan mendengarkan dengan subtitle sinkron (`listening.vtt`) |
| `log/` | Log kesalahan dari semua level, bisa diunduh sebagai CSV |

## Hasil peserta

Setiap peserta mengisi nama sebelum mulai. Saat ujian selesai, hasilnya dikirim ke **Netlify Forms**:
- `hasil-hsk1` untuk HSK 1
- `hasil-hsk2` untuk HSK 2
- `hasil-hsk3` untuk HSK 3
- `hasil-hsk4` untuk HSK 4
- `hasil-hsk5` untuk HSK 5

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
