# HSK Simulator

Simulasi ujian HSK online dengan timer, audio listening, dan penilaian otomatis.

| Halaman | Isi |
|---|---|
| `index.html` | Halaman pembuka: pilih level |
| `hsk3/` | HSK 3: 70 soal, sekitar 83 menit |
| `hsk5/` | HSK 5: 72 soal, sekitar 105 menit (audio `listening.mp3`, gambar di `img/`) |

## Hasil peserta

Setiap peserta mengisi nama sebelum mulai. Saat ujian selesai, hasilnya dikirim ke **Netlify Forms**:
- `hasil-hsk3` untuk HSK 3
- `hasil-hsk5` untuk HSK 5

Hasilnya bisa dilihat di dashboard Netlify, menu **Forms**. Form detection harus aktif.

## Menjalankan di komputer

Jalankan server lokal dari folder ini, misalnya `python3 -m http.server`, lalu buka `http://localhost:8000`.
Pengiriman hasil hanya berfungsi setelah situsnya di-deploy di Netlify.
