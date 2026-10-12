(() => {
  const cfg = window.VIEWER_CONFIG;
  const parts = window.NASKAH_PARTS;
  const $ = (id) => document.getElementById(id);
  const pageUrl = (part, i) => `naskah/${part.dir}/${String(i + 1).padStart(3, "0")}.jpg`;

  const state = {
    part: null,
    urls: [],
    ratio: 0.69,     // lebar / tinggi halaman, diperbarui dari gambar pertama
    pageEls: [],
    flip: null,
    current: 0,
  };

  // ---------- Home ----------
  $("home-title").textContent = cfg.title;
  for (const text of cfg.intro) {
    const p = document.createElement("p");
    p.textContent = text;
    $("home-text").appendChild(p);
  }

  for (const part of parts) {
    const btn = document.createElement("button");
    btn.className = "part";
    btn.innerHTML = `
      <div class="part-thumb"><img alt="" draggable="false"></div>
      <span class="part-label"></span>
      <span class="part-meta"></span>`;
    const thumb = btn.querySelector(".part-thumb");
    const timg = thumb.querySelector("img");
    timg.onerror = () => thumb.classList.add("missing");
    timg.onload = () => thumb.classList.remove("missing");
    timg.src = pageUrl(part, 0);
    btn.querySelector(".part-label").textContent = cfg.partLabel.replace("{n}", part.n);
    btn.querySelector(".part-meta").textContent = `${part.pages} halaman`;
    btn.addEventListener("click", () => openPart(part));
    $("parts").appendChild(btn);
  }

  // ---------- Status ----------
  // showBack: tampilkan tombol Kembali di overlay (untuk kondisi error).
  function setStatus(text, showBack = false) {
    $("status").classList.remove("hidden");
    $("status-text").textContent = text;
    $("status-back").hidden = !showBack;
  }
  const hideStatus = () => $("status").classList.add("hidden");

  // ---------- Buku ----------
  function pageSize() {
    const wrap = $("book-wrap");
    const cs = getComputedStyle(wrap);
    const W = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const H = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const r = state.ratio;
    // Dua halaman berdampingan bila keduanya muat tanpa menyusut di bawah 80% tinggi area;
    // kalau tidak, tampilkan satu halaman saja.
    const spread = W >= 2 * r * H * 0.8;
    const ph = Math.floor(Math.min(H, W / (spread ? 2 * r : r)));
    return { pw: Math.floor(ph * r), ph, spread };
  }

  // Muat gambar hanya di sekitar halaman aktif; lepas yang jauh agar memori tidak penuh.
  function loadNear(index) {
    state.pageEls.forEach((el, i) => {
      const img = el.querySelector("img");
      if (Math.abs(i - index) <= cfg.preload) {
        if (!img.getAttribute("src")) img.src = state.urls[i];
      } else if (img.getAttribute("src")) {
        img.removeAttribute("src");
      }
    });
  }

  function destroyBook() {
    if (state.flip) state.flip.destroy();
    state.flip = null;
    state.pageEls = [];
    $("book").innerHTML = "";
  }

  function buildBook() {
    if (state.flip) state.current = state.flip.getCurrentPageIndex();
    destroyBook();
    const holder = $("book");
    const { pw, ph, spread } = pageSize();
    if (pw <= 0 || ph <= 0) return;
    const book = document.createElement("div");
    holder.style.width = book.style.width = (spread ? pw * 2 : pw) + "px";
    holder.style.height = book.style.height = ph + "px";
    holder.appendChild(book);

    const n = state.urls.length;
    state.pageEls = state.urls.map((_, i) => {
      const el = document.createElement("div");
      el.className = "page";
      if (cfg.hardCover && (i === 0 || i === n - 1)) el.dataset.density = "hard";
      const img = document.createElement("img");
      img.alt = `Halaman ${i + 1}`;
      img.draggable = false;
      // Halaman yang file-nya belum ada diganti placeholder, buku tetap bisa dibalik.
      img.onerror = () => img.getAttribute("src") && el.classList.add("missing");
      img.onload = () => el.classList.remove("missing");
      el.appendChild(img);
      book.appendChild(el);
      return el;
    });
    loadNear(state.current);

    state.flip = new St.PageFlip(book, {
      width: pw,
      height: ph,
      size: "fixed",
      showCover: cfg.hardCover,
      usePortrait: !spread,
      flippingTime: cfg.flipMs,
      maxShadowOpacity: 0.6,
      mobileScrollSupport: false,
      showPageCorners: false,   // layar sentuh: tanpa efek lipatan sudut saat pointer lewat tepi
      swipeDistance: 40,
      startPage: Math.min(state.current, n - 1),
    });
    state.flip.loadFromHTML(state.pageEls);
    state.flip.on("flip", (e) => {
      loadNear(e.data);
      updateInfo();
    });
    updateInfo();
  }

  function updateInfo() {
    const i = state.flip.getCurrentPageIndex();
    const n = state.flip.getPageCount();
    const pair = state.flip.getOrientation() === "landscape" && i > 0 && i + 1 < n;
    $("page-info").textContent = pair ? `${i + 1}–${i + 2} / ${n}` : `${i + 1} / ${n}`;
    $("btn-prev").setAttribute("aria-disabled", i === 0);
    $("btn-next").setAttribute("aria-disabled", i >= n - (pair ? 2 : 1));
  }

  // Sentuhan di buku tidak boleh memicu event mouse tiruan (hover/klik di tepi kiri-kanan).
  $("book-wrap").addEventListener("touchend", (e) => e.cancelable && e.preventDefault(), { passive: false });

  // Ukur ulang buku setiap area naskah berubah ukuran (resize jendela, rotasi layar).
  let resizeTimer;
  let lastSize = "";
  new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    const size = `${Math.round(width)}x${Math.round(height)}`;
    if (size === lastSize || !width || !height) return;
    lastSize = size;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => state.flip && buildBook(), 200);
  }).observe($("book-wrap"));

  // ---------- Navigasi layar ----------
  function openPart(part) {
    state.part = part;
    state.urls = Array.from({ length: part.pages }, (_, i) => pageUrl(part, i));
    state.current = 0;
    destroyBook();
    document.body.classList.add("reading");
    setStatus("Memuat naskah…");

    const probe = new Image();
    probe.onload = () => {
      if (state.part !== part) return;
      state.ratio = probe.naturalWidth / probe.naturalHeight;
      hideStatus();
      buildBook();
    };
    probe.onerror = () => {
      if (state.part !== part) return;
      setStatus(`${cfg.partLabel.replace("{n}", part.n)} belum tersedia. Silakan pilih bagian lain.`, true);
    };
    probe.src = state.urls[0];
  }

  function goHome() {
    state.part = null;
    document.body.classList.remove("reading");
    destroyBook();
  }

  $("btn-close").addEventListener("click", goHome);
  $("status-back").addEventListener("click", goHome);
  $("btn-prev").addEventListener("click", () => state.flip?.flipPrev());
  $("btn-next").addEventListener("click", () => state.flip?.flipNext());
  document.addEventListener("keydown", (e) => {
    if (!state.flip) return;
    if (e.key === "ArrowRight") state.flip.flipNext();
    if (e.key === "ArrowLeft") state.flip.flipPrev();
    if (e.key === "Escape") goHome();
  });

  // Kembali ke Home bila tidak disentuh.
  let idleTimer;
  function resetIdle() {
    clearTimeout(idleTimer);
    if (cfg.idleSeconds > 0) idleTimer = setTimeout(goHome, cfg.idleSeconds * 1000);
  }
  ["pointerdown", "keydown"].forEach((ev) => document.addEventListener(ev, resetIdle));
  resetIdle();

  // Blokir menu klik kanan / tekan lama di layar sentuh.
  document.addEventListener("contextmenu", (e) => e.preventDefault());
})();
