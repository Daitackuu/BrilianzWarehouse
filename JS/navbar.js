import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { NAVBAR_CACHE_KEY } from "./utils/constants.js";
import { ensureUserProfile } from "./auth-guard.js";

window.initNavbar = function () {
    const nav = document.querySelector("nav");
    if (!nav) return;

    initLogo(nav);
    setupMobileToggle(nav);

    const menu = nav.querySelector(".menu");
    renderCache(menu);

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            localStorage.removeItem(NAVBAR_CACHE_KEY);
            removeRoleMenu();
            renderGuest(menu);
            return;
        }

        await ensureUserProfile(user);

        onValue(ref(db, "users/" + user.uid), (snapshot) => {
            const data = snapshot.val() || {};
            localStorage.setItem(NAVBAR_CACHE_KEY, JSON.stringify(data));
            renderUser(menu, data);
            updateRoleMenu(data.role);
        });
    });
};

function getBasePath() {
    const path = window.location.pathname;
    if (path.includes("/HTML/")) return "../";
    return "";
}

function getRepoBase() {
    const path = window.location.pathname;
    if (path.includes("/HTML/")) {
        return path.substring(0, path.indexOf("/HTML/") + 1);
    }
    return path.substring(0, path.lastIndexOf("/") + 1);
}

function initLogo(nav) {
    const logo = nav.querySelector(".logo");
    if (!logo || logo.dataset.logoInit === "true") return;

    const base = getBasePath();
    const markup = `
        <img src="${base}Resources/Images/websitelogo.png" alt="" class="logo-icon">
        <span class="logo-text">Brilianz Warehouse</span>
    `;

    if (logo.tagName === "A") {
        logo.innerHTML = markup;
        logo.setAttribute("aria-label", "Brilianz Warehouse");
        logo.dataset.logoInit = "true";
    } else {
        const link = document.createElement("a");
        link.href = getRepoBase() + "index.html";
        link.className = "logo";
        link.setAttribute("aria-label", "Brilianz Warehouse");
        link.innerHTML = markup;
        link.dataset.logoInit = "true";
        logo.replaceWith(link);
    }
}

function setupMobileToggle(nav) {
    if (nav.querySelector(".nav-toggle")) return;

    const toggle = document.createElement("button");
    toggle.className = "nav-toggle";
    toggle.setAttribute("aria-label", "Toggle menu");
    const base = getBasePath();
    toggle.innerHTML = `<img src="${base}Resources/Icons/menu.png" alt="Menu">`;

    toggle.onclick = () => {
        nav.classList.toggle("nav-open");
    };

    nav.appendChild(toggle);

    document.addEventListener("click", (e) => {
        if (!nav.contains(e.target)) nav.classList.remove("nav-open");
    });
}

function renderGuest(menu) {
    const rb = getRepoBase();
    menu.innerHTML = `
        <a href="${rb}index.html">Home</a>
        <a href="${rb}HTML/produk.html">Produk</a>
        <a href="${rb}HTML/support.html">Support</a>
        <a href="${rb}HTML/login.html" class="btn btn-nav">Login</a>
    `;
}

function renderCache(menu) {
    const cache = localStorage.getItem(NAVBAR_CACHE_KEY);
    if (!cache) return;

    try {
        const data = JSON.parse(cache);
        renderUser(menu, data);
        updateRoleMenu(data.role);
    } catch {
        localStorage.removeItem(NAVBAR_CACHE_KEY);
    }
}

function renderUser(menu, data) {
    const rb = getRepoBase();
    let html = `
        <a href="${rb}index.html">Home</a>
        <a href="${rb}HTML/produk.html">Produk</a>
    `;

    if (data.role === "customer") {
        html += `<a href="${rb}HTML/keranjang.html">Keranjang</a>`;
    }

    const base = getBasePath();
    const dynamicAvatar = data.photoURL || (base + "Resources/Icons/user.png");
    html += `
        <a href="${rb}HTML/support.html">Support</a>
        <a href="${rb}HTML/riwayat-pesan.html">Riwayat</a>
        <a href="${rb}HTML/profile.html" class="profile-nav">
            <span class="profile-name">${data.username || "Profile"}</span>
            <img src="${dynamicAvatar}" class="navbar-avatar" alt="Profile">
        </a>
    `;

    menu.innerHTML = html;
}

function updateRoleMenu(role) {
    if (document.querySelector(".role-fab")) return;

    const currentPage = window.location.pathname;
    const isOnProdukPage = currentPage.endsWith("produk.html");

    if (role === "stockist" && !isOnProdukPage) return;
    if (role !== "stockist" && role !== "developer") return;

    const button = document.createElement("button");
    button.className = "role-fab";
    const base = getBasePath();
    const rb = getRepoBase();
    button.innerHTML = `<img src="${base}Resources/Icons/menu.png" class="role-fab-icon" alt="Admin">`;

    const dropdown = document.createElement("div");
    dropdown.className = "role-dropdown";

    let menu = `
        <a href="${rb}HTML/dashboard.html">
            <img src="${base}Resources/Icons/dashboard.png" class="dropdown-icon" alt="">
            Dashboard Produk
        </a>
    `;

    if (role === "developer") {
        menu += `
            <a href="${rb}HTML/developer-panel.html">
                <img src="${base}Resources/Icons/developer.png" class="dropdown-icon" alt="">
                Developer Panel
            </a>
        `;
    }

    dropdown.innerHTML = menu;

    button.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("show");
    };

    document.addEventListener("click", () => dropdown.classList.remove("show"));
    document.body.appendChild(button);
    document.body.appendChild(dropdown);
}

function removeRoleMenu() {
    document.querySelectorAll(".role-fab, .role-dropdown").forEach((item) => item.remove());
}
