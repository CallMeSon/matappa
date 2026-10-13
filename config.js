// Pengaturan viewer. Ubah nilai di sini, tidak perlu menyentuh app.js.
// Daftar bagian (jumlah halaman, folder) ada di naskah/parts.js, dibuat dari IIIF manifest Leiden.
window.VIEWER_CONFIG = {
  // ---------- 01 Layar awal ----------
  coverTitle: "Naskah La Galigo",
  // Petunjuk kecil di bawah judul. Kosongkan ("") untuk menyembunyikan.
  coverHint: "Sentuh layar untuk mulai",

  // ---------- 02 Tentang naskah ----------
  aboutTitle: "Naskah La Galigo",
  // Foto naskah. Sementara memakai sampul Bagian 1; ganti mis. "assets/foto-naskah.jpg". Kosong = kotak placeholder.
  aboutPhoto: "naskah/part-01/001.jpg",
  aboutPhotoLabel: "FOTO\nNaskah La Galigo",
  // Teks penjelasan. Ganti dengan wording final. Teks panjang bisa di-scroll.
  aboutText: [
    "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.",
    "Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.",
    "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.",
  ],
  startLabel: "Mulai membaca",

  // ---------- 03 Daftar bagian ----------
  thanks: "Terima kasih kepada Universiteit Leiden",
  title: "I La Galigo",
  intro: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Pilih salah satu bagian untuk mulai membaca.",
  ],

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
