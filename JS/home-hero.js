import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { PLACEHOLDER_IMAGE } from "./utils/constants.js";

const NO_BEST_SELLER_IMG = "Resources/Images/nobestseller.png";

let allProducts  = [];
let heroProducts = [];
let currentIndex = 0;
let slideInterval = null;
let isAnimating   = false;

const SLIDE_MS = 450;
const AUTO_MS  = 5000;

function el(id) { return document.getElementById(id); }

// ─── FIREBASE LISTENER ───────────────────────────────────
onValue(ref(db, "products"), (snapshot) => {
    const newAll = [];
    snapshot.forEach((item) => { newAll.push({ id: item.key, ...item.val() }); });
    allProducts = newAll;
    localStorage.setItem("products", JSON.stringify(allProducts));

    const newHero = allProducts.filter((p) => {
        const v = p.bestSeller;
        return v === true || v === "true" || v === 1 || v === "1";
    });

    if (newHero.length !== heroProducts.length) {
        currentIndex = 0;
        stopAutoSlide();
    }
    heroProducts = newHero;

    renderCatalog();
    renderHero();
});

// ─── HERO ────────────────────────────────────────────────
function renderHero() {
    if (heroProducts.length === 0) {
        showBadge(false);
        toggleNav(false);
        const dots = el("heroDots");
        if (dots) dots.innerHTML = "";
        const pName = el("productName");
        const pDesc = el("productDesc");
        const pImg  = el("productImage");
        const pLink = el("heroProductLink");
        if (pName) pName.textContent = allProducts.length === 0 ? "Belum Ada Produk" : "Temukan produk terbaik Anda!";
        if (pDesc) pDesc.textContent = allProducts.length === 0 ? "Tunggu sampai stockist menambahkan produk." : "Nikmati pengalaman berbelanja produk unggulan yang cocok untuk Anda dengan layanan terbaik kami.";
        if (pImg)  pImg.src = NO_BEST_SELLER_IMG;
        if (pLink) pLink.href = "HTML/produk.html";
        return;
    }

    showBadge(true);
    if (currentIndex >= heroProducts.length) currentIndex = 0;
    setHeroContent(heroProducts[currentIndex]);
    renderDots();
    toggleNav(heroProducts.length > 1);
    if (heroProducts.length > 1) startAutoSlide();
    else stopAutoSlide();
}

function setHeroContent(p) {
    const pName = el("productName");
    const pDesc = el("productDesc");
    const pImg  = el("productImage");
    const pLink = el("heroProductLink");
    if (pName) pName.textContent = p.nama      || "-";
    if (pDesc) pDesc.textContent = p.deskripsi || "-";
    if (pImg)  pImg.src          = p.gambar    || PLACEHOLDER_IMAGE;
    if (pLink) pLink.href        = p.id ? `HTML/detail-produk.html?id=${p.id}&from=hero` : "HTML/produk.html";
}

function showBadge(visible) {
    const badge = el("bestSellerBadge");
    if (badge) badge.style.display = visible ? "" : "none";
}

// ─── DOTS ────────────────────────────────────────────────
function renderDots() {
    const heroDots = el("heroDots");
    if (!heroDots) return;
    heroDots.innerHTML = heroProducts
        .map((_, i) => `<button type="button" class="hero-dot${i === currentIndex ? " active" : ""}" data-index="${i}" aria-label="Produk ${i + 1}"></button>`)
        .join("");
    heroDots.querySelectorAll(".hero-dot").forEach((dot) => {
        dot.onclick = () => {
            const idx = Number(dot.dataset.index);
            if (idx === currentIndex || isAnimating) return;
            goToSlide(idx, idx > currentIndex ? 1 : -1);
        };
    });
}

function toggleNav(show) {
    const prev = el("heroPrev");
    const next = el("heroNext");
    if (prev) prev.style.display = show ? "" : "none";
    if (next) next.style.display = show ? "" : "none";
}

// ─── SLIDE ───────────────────────────────────────────────
function goToSlide(index, direction) {
    const heroInner = el("heroInner");
    if (isAnimating || heroProducts.length <= 1 || !heroInner) return;
    isAnimating = true;
    stopAutoSlide();

    const outClass = direction >= 0 ? "slide-out-left" : "slide-out-right";
    const inClass  = direction >= 0 ? "slide-in-right" : "slide-in-left";

    heroInner.classList.add(outClass);
    setTimeout(() => {
        currentIndex = ((index % heroProducts.length) + heroProducts.length) % heroProducts.length;
        setHeroContent(heroProducts[currentIndex]);
        renderDots();
        heroInner.classList.remove(outClass);
        heroInner.style.transition = "none";
        heroInner.classList.add(inClass);
        void heroInner.offsetWidth;
        heroInner.style.transition = "";
        requestAnimationFrame(() => {
            heroInner.classList.remove(inClass);
            isAnimating = false;
            startAutoSlide();
        });
    }, SLIDE_MS);
}

function nextSlide() { goToSlide(currentIndex + 1,  1); }
function prevSlide() { goToSlide(currentIndex - 1, -1); }

function startAutoSlide() {
    stopAutoSlide();
    if (heroProducts.length <= 1) return;
    slideInterval = setInterval(nextSlide, AUTO_MS);
}
function stopAutoSlide() {
    if (slideInterval) { clearInterval(slideInterval); slideInterval = null; }
}

// ─── KATALOG ─────────────────────────────────────────────
function renderCatalog() {
    const homeCatalog = el("homeCatalog");
    if (!homeCatalog) return;

    // Hapus semua child lama
    while (homeCatalog.firstChild) homeCatalog.removeChild(homeCatalog.firstChild);

    if (allProducts.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML = `<img src="${PLACEHOLDER_IMAGE}" alt=""><h2>Belum Ada Produk</h2><p>Tunggu sampai stockist menambahkan produk.</p>`;
        homeCatalog.appendChild(empty);
        return;
    }

    allProducts.forEach((produk) => {
        const article = document.createElement("article");
        article.className = "product-card";

        const img = document.createElement("img");
        img.src = produk.gambar || PLACEHOLDER_IMAGE;
        img.alt = produk.nama || "";

        const body = document.createElement("div");
        body.className = "product-card-body";

        const h2 = document.createElement("h2");
        h2.textContent = produk.nama || "-";

        const desc = document.createElement("p");
        desc.className = "product-desc";
        desc.textContent = produk.deskripsi || "";

        const action = document.createElement("div");
        action.className = "action";

        const link = document.createElement("a");
        link.href = "HTML/detail-produk.html?id=" + produk.id + "&from=katalog";
        link.className = "btn btn-primary";
        link.textContent = "Lihat Detail";

        action.appendChild(link);
        body.appendChild(h2);
        body.appendChild(desc);
        body.appendChild(action);
        article.appendChild(img);
        article.appendChild(body);
        homeCatalog.appendChild(article);
    });
}

// ─── EVENTS ──────────────────────────────────────────────
// Gunakan pola "ready or later" — aman baik kalau DOMContentLoaded
// sudah lewat maupun belum (modul defer bisa fire setelah event)
function onReady(fn) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fn);
    } else {
        fn();
    }
}

onReady(() => {
    const prev = el("heroPrev");
    const next = el("heroNext");
    if (prev) prev.addEventListener("click", prevSlide);
    if (next) next.addEventListener("click", nextSlide);
});
