// Pengaturan viewer. Ubah nilai di sini, tidak perlu menyentuh app.js.
// Daftar bagian (jumlah halaman, folder) ada di naskah/parts.js, dibuat dari IIIF manifest Leiden.
window.VIEWER_CONFIG = {
  // ---------- 01 Layar awal ----------
  coverTitle: "Naskah La Galigo",
  // Petunjuk kecil di bawah judul. Kosongkan ("") untuk menyembunyikan.
  coverHint: "Sentuh layar untuk mulai",

  // ---------- 02 Tentang naskah ----------
  aboutTitle: "Naskah Asli La Galigo",
  // Foto naskah. Kosong = kotak placeholder.
  aboutPhoto: "assets/foto-naskah.webp",
  aboutPhotoLabel: "FOTO\nNaskah La Galigo",
  // Teks penjelasan. Ganti dengan wording final. Teks panjang bisa di-scroll.
  aboutText: [
    "Sebelum hadir dalam bentuk digital, I La Galigo diwariskan melalui manuskrip tulisan tangan berbahasa Bugis dengan aksara Lontara. Melalui proses penulisan, penyalinan, penyimpanan, dan pelestarian lintas generasi, manuskrip ini menjadi bagian penting dari perjalanan panjang I La Galigo hingga dapat terus dikenal dan diakses oleh generasi hari ini."
  ],
  startLabel: "Mulai membaca",

  // ---------- 03 Daftar bagian ----------
  thanks: "Terima kasih kepada Universiteit Leiden",

  // Label tiap bagian di daftar. {n} diganti nomor bagian.
  partLabel: "Bagian {n}",

  // Kembali ke layar awal setelah sekian detik tanpa sentuhan. 0 = nonaktif.
  idleSeconds: 60,

  // Lama animasi balik halaman (ms).
  flipMs: 900,

  // Lama animasi balik halaman saat slider digeser (ms), dibuat lebih cepat agar mengikuti jari.
  scrubFlipMs: 300,

  // Halaman pertama dan terakhir diperlakukan sebagai sampul keras (seperti buku).
  hardCover: true,

  // Hanya halaman sejauh ini dari halaman aktif yang dimuat, supaya memori TV aman.
  preload: 4,
};
