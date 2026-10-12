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
  function loadNear(...centers) {
    state.pageEls.forEach((el, i) => {
      const img = el.querySelector("img");
      if (centers.some((c) => Math.abs(i - c) <= cfg.preload)) {
        if (!img.getAttribute("src")) img.src = state.urls[i];
      } else if (img.getAttribute("src")) {
        img.removeAttribute("src");
      }
    });
  }

  function destroyBook() {
    scrubTarget = null;
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
      useMouseEvents: false,    // geser/ketuk ditangani sendiri di bawah: animasi tidak mengikuti pointer
      startPage: Math.min(state.current, n - 1),
    });
    state.flip.loadFromHTML(state.pageEls);
    state.flip.on("flip", (e) => {
      loadNear(e.data, scrubTarget ?? e.data);
      updateInfo();
    });
    state.flip.on("changeState", (e) => e.data === "read" && pump());
    updateInfo();
  }

  function updateInfo() {
    const i = state.flip.getCurrentPageIndex();
    const n = state.flip.getPageCount();
    const pair = state.flip.getOrientation() === "landscape" && i > 0 && i + 1 < n;
    if (!sliding) $("page-info").textContent = pair ? `${i + 1}–${i + 2} / ${n}` : `${i + 1} / ${n}`;
    const atStart = i === 0;
    const atEnd = i >= n - (pair ? 2 : 1);
    for (const id of ["btn-prev", "btn-first"]) $(id).setAttribute("aria-disabled", atStart);
    for (const id of ["btn-next", "btn-last"]) $(id).setAttribute("aria-disabled", atEnd);
    const slider = $("page-slider");
    slider.max = n;
    if (!sliding) {
      slider.value = i + 1;
      setSliderFill();
    }
  }

  // Lompat ke halaman (indeks 0-based) dengan satu animasi balik halaman.
  function jumpTo(index) {
    if (!state.flip) return;
    const n = state.flip.getPageCount();
    const target = Math.max(0, Math.min(n - 1, index));
    loadNear(state.flip.getCurrentPageIndex(), target);
    state.flip.flip(target);
  }

  // ---------- Slider ----------
  let sliding = false;
  const slider = $("page-slider");
  function setSliderFill() {
    const min = +slider.min, max = +slider.max;
    slider.style.setProperty("--p", max > min ? `${((slider.value - min) / (max - min)) * 100}%` : "0%");
  }
  // Buku mengikuti slider: tiap perpindahan tetap berupa animasi balik halaman.
  // Lompatan jauh diposisikan instan sampai dekat tujuan, lalu dua-tiga halaman terakhir dianimasikan.
  // Animasi dipercepat selama slider digeser; slider sendiri tidak pernah terblokir.
  let scrubTarget = null;
  const settings = () => state.flip?.getSettings?.() ?? state.flip?.app?.getSettings?.();
  function pump() {
    if (scrubTarget === null || !state.flip) return;
    if (state.flip.getState() !== "read") return;   // sedang animasi; lanjut saat kembali ke "read"
    const cur = state.flip.getCurrentPageIndex();
    const n = state.flip.getPageCount();
    const target = Math.max(0, Math.min(n - 1, scrubTarget));
    loadNear(cur, target);
    const s = settings();
    if (s) s.flippingTime = sliding ? cfg.scrubFlipMs : cfg.flipMs;
    // Halaman satu spread = 2 indeks; sudah di spread tujuan bila selisih <= 1 pada posisi yang sama.
    if (cur === target || (state.flip.getOrientation() === "landscape" && cur > 0 && cur + 1 < n && (target === cur || target === cur + 1))) {
      scrubTarget = null;
      if (!sliding) updateInfo();
      return;
    }
    const gap = Math.abs(target - cur);
    if (gap > 4) {
      state.flip.turnToPage(target + (target > cur ? -3 : 3));
      requestAnimationFrame(() => state.flip && state.flip.flip(target));
    } else {
      state.flip.flip(target);
    }
  }
  slider.addEventListener("input", () => {
    sliding = true;
    setSliderFill();
    $("page-info").textContent = `${slider.value} / ${slider.max}`;
    scrubTarget = +slider.value - 1;
    pump();
  });
  slider.addEventListener("change", () => {
    sliding = false;
    pump();
    if (state.flip && scrubTarget === null) updateInfo();
  });

  // ---------- Papan angka ----------
  const gotoEl = $("goto");
  let gotoVal = "";
  function renderGoto() {
    $("goto-val").textContent = gotoVal || "–";
    $("goto-total").textContent = `/ ${state.urls.length}`;
  }
  function openGoto() {
    if (!state.flip) return;
    gotoVal = "";
    renderGoto();
    gotoEl.classList.remove("hidden");
  }
  const closeGoto = () => gotoEl.classList.add("hidden");
  const gotoOpen = () => !gotoEl.classList.contains("hidden");
  function gotoKey(k) {
    const digits = String(state.urls.length).length;
    if (k === "back") gotoVal = gotoVal.slice(0, -1);
    else if (k === "go") {
      const page = parseInt(gotoVal, 10);
      closeGoto();
      if (page) jumpTo(page - 1);
      return;
    } else if (gotoVal.length < digits) gotoVal = (gotoVal + k).replace(/^0+/, "");
    renderGoto();
  }
  $("page-info").addEventListener("click", openGoto);
  $("goto-pad").addEventListener("click", (e) => {
    const k = e.target.closest("[data-k]")?.dataset.k;
    if (k) gotoKey(k);
  });
  $("goto-cancel").addEventListener("click", closeGoto);
  gotoEl.addEventListener("click", (e) => e.target === gotoEl && closeGoto());

  // Geser = balik halaman dengan animasi penuh, sama seperti tombol. Halaman tidak mengikuti jari.
  const SWIPE_MIN = 40;   // px
  const SWIPE_MAX_MS = 800;
  let swipe = null;
  const bookWrap = $("book-wrap");
  bookWrap.addEventListener("pointerdown", (e) => {
    swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, t: Date.now() };
  });
  bookWrap.addEventListener("pointerup", (e) => {
    if (!swipe || swipe.id !== e.pointerId) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    const fast = Date.now() - swipe.t < SWIPE_MAX_MS;
    swipe = null;
    if (!fast || Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) state.flip?.flipNext();
    else state.flip?.flipPrev();
  });
  bookWrap.addEventListener("pointercancel", () => { swipe = null; });

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
    closeGoto();
    state.part = null;
    document.body.classList.remove("reading");
    destroyBook();
  }

  $("btn-close").addEventListener("click", goHome);
  $("status-back").addEventListener("click", goHome);
  $("btn-prev").addEventListener("click", () => state.flip?.flipPrev());
  $("btn-next").addEventListener("click", () => state.flip?.flipNext());
  $("btn-first").addEventListener("click", () => jumpTo(0));
  $("btn-last").addEventListener("click", () => jumpTo(Infinity));
  document.addEventListener("keydown", (e) => {
    if (!state.flip) return;
    if (gotoOpen()) {
      if (/^\d$/.test(e.key)) gotoKey(e.key);
      else if (e.key === "Backspace") gotoKey("back");
      else if (e.key === "Enter") gotoKey("go");
      else if (e.key === "Escape") closeGoto();
      return;
    }
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
