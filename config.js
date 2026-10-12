// Pengaturan viewer. Ubah nilai di sini, tidak perlu menyentuh app.js.
// Daftar bagian (jumlah halaman, folder) ada di naskah/parts.js, dibuat dari IIIF manifest Leiden.
window.VIEWER_CONFIG = {
  // Teks halaman Home. Ganti dengan wording final.
  title: "I La Galigo",
  intro: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Pilih salah satu bagian untuk mulai membaca.",
  ],

  // Label tiap bagian di daftar. {n} diganti nomor bagian.
  partLabel: "Bagian {n}",

  // Kembali ke Home setelah sekian detik tanpa sentuhan. 0 = nonaktif.
  idleSeconds: 120,

  // Lama animasi balik halaman (ms).
  flipMs: 900,

  // Halaman pertama dan terakhir diperlakukan sebagai sampul keras (seperti buku).
  hardCover: true,

  // Hanya halaman sejauh ini dari halaman aktif yang dimuat, supaya memori TV aman.
  preload: 4,
};
