import { db } from "./firebase-config.js";
import { requireRole, ROLES } from "./auth-guard.js";
import {
    ref,
    push,
    update,
    remove,
    onValue,
    get
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { PLACEHOLDER_IMAGE, ITEMS_PER_PAGE } from "./utils/constants.js";
import { formatCurrency, stockStatus } from "./utils/format.js";

await requireRole([ROLES.STOCKIST, ROLES.DEVELOPER]);

const produkRef = ref(db, "products");
let semuaProduk = [];
let editID = null;
let mode = "normal";
let currentPage = 1;

const els = {
    totalProduk: document.getElementById("totalProduk"),
    stokTotal: document.getElementById("stokTotal"),
    ratingRata: document.getElementById("ratingRata"),
    totalNilai: document.getElementById("totalNilai"),
    lowStock: document.getElementById("lowStock"),
    listProduk: document.getElementById("listProduk"),
    searchProduk: document.getElementById("searchProduk"),
    sortProduk: document.getElementById("sortProduk"),
    formContainer: document.getElementById("formContainer"),
    judulForm: document.getElementById("judulForm"),
    modeInfo: document.getElementById("modeInfo"),
    btnTambahMode: document.getElementById("btnTambahMode"),
    btnEditMode: document.getElementById("btnEditMode"),
    btnSimpan: document.getElementById("btnSimpan"),
    btnHapus: document.getElementById("btnHapus"),
    btnBatal: document.getElementById("btnBatal"),
    previewGambar: document.getElementById("previewGambar"),
    pagination: document.getElementById("pagination"),
    loadingOverlay: document.getElementById("dashboardLoading"),
    recentActivity: document.getElementById("recentActivity"),
    viewGrid: document.getElementById("viewGrid"),
    viewTable: document.getElementById("viewTable")
};

let viewMode = "grid";

function showLoading(show) {
    if (els.loadingOverlay) els.loadingOverlay.classList.toggle("hidden", !show);
}

showLoading(true);

onValue(produkRef, (snapshot) => {
    semuaProduk = [];
    snapshot.forEach((item) => {
        semuaProduk.push({ id: item.key, ...item.val() });
    });

    localStorage.setItem("products", JSON.stringify(semuaProduk));
    showLoading(false);
    renderStatistik();
    renderProduk();
    renderRecentActivity();
});

function renderStatistik() {
    const total = semuaProduk.length;
    let stok = 0;
    let rating = 0;
    let nilai = 0;
    let lowStockCount = 0;

    semuaProduk.forEach((p) => {
        const s = Number(p.stok || 0);
        stok += s;
        rating += Number(p.rating || 0);
        nilai += Number(p.harga || 0) * s;
        if (s <= 5) lowStockCount++;
    });

    els.totalProduk.textContent = total;
    els.stokTotal.textContent = stok;
    els.ratingRata.textContent = total === 0 ? "0" : (rating / total).toFixed(1);
    els.totalNilai.textContent = formatCurrency(nilai);
    if (els.lowStock) els.lowStock.textContent = lowStockCount;
}

function getFilteredProducts() {
    const keyword = els.searchProduk.value.toLowerCase().trim();
    let hasil = semuaProduk.filter((p) => (p.nama || "").toLowerCase().includes(keyword));

    switch (els.sortProduk.value) {
        case "namaAsc":
            hasil.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
            break;
        case "namaDesc":
            hasil.sort((a, b) => (b.nama || "").localeCompare(a.nama || ""));
            break;
        case "hargaAsc":
            hasil.sort((a, b) => (a.harga || 0) - (b.harga || 0));
            break;
        case "hargaDesc":
            hasil.sort((a, b) => (b.harga || 0) - (a.harga || 0));
            break;
        case "stokDesc":
            hasil.sort((a, b) => (b.stok || 0) - (a.stok || 0));
            break;
        case "ratingDesc":
            hasil.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
    }

    return hasil;
}

function renderPagination(totalItems) {
    if (!els.pagination) return;

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    let html = `<span class="pagination-info">Halaman ${currentPage} dari ${totalPages} (${totalItems} produk)</span><div class="pagination-buttons">`;

    html += `<button class="btn btn-sm" ${currentPage <= 1 ? "disabled" : ""} data-page="${currentPage - 1}">Sebelumnya</button>`;

    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="btn btn-sm ${i === currentPage ? "btn-primary" : ""}" data-page="${i}">${i}</button>`;
    }

    html += `<button class="btn btn-sm" ${currentPage >= totalPages ? "disabled" : ""} data-page="${currentPage + 1}">Berikutnya</button></div>`;
    els.pagination.innerHTML = html;

    els.pagination.querySelectorAll("[data-page]").forEach((btn) => {
        btn.onclick = () => {
            const page = Number(btn.dataset.page);
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                renderProduk();
            }
        };
    });
}

function renderProductGrid(items) {
    els.listProduk.className = "catalog-grid";
    els.listProduk.innerHTML = "";

    items.forEach((produk) => {
        const stok = Number(produk.stok || 0);
        const status = stockStatus(stok);
        const komentar = Array.isArray(produk.komentar) ? produk.komentar.length : 0;
        const bsLabel = produk.bestSeller ? `<span class="badge badge-info" style="margin-left:4px;">Best Seller</span>` : "";

        // Hanya card di mode edit yang bisa diklik (tambah class edit-mode)
        const cardClass = `product-card${mode === "edit" ? " edit-mode" : ""}`;

        els.listProduk.innerHTML += `
            <div class="${cardClass}" data-id="${produk.id}">
                <img src="${produk.gambar || PLACEHOLDER_IMAGE}" alt="${produk.nama || "-"}">
                <h2>${produk.nama || "-"}${bsLabel}</h2>
                <p><strong>Harga:</strong> ${formatCurrency(produk.harga)}</p>
                <p><strong>Stock:</strong> ${stok}</p>
                <p><strong>Status:</strong> <span class="badge ${status.className}">${status.text}</span></p>
                <p><strong>Rating:</strong> ${produk.rating || 0}</p>
                <p><strong>Komentar:</strong> ${komentar}</p>
                <div class="action">
                    <button class="btn detail-btn" data-id="${produk.id}" style="${mode === "normal" ? "" : "display:none"}">Lihat Detail</button>
                </div>
            </div>
        `;
    });
}

function renderProductTable(items) {
    els.listProduk.className = "table-wrapper";
    let html = `<table class="bw-table"><thead><tr>
        <th>Produk</th><th>Harga</th><th>Stok</th><th>Status</th><th>Rating</th><th>Best Seller</th><th>Aksi</th>
    </tr></thead><tbody>`;

    items.forEach((produk) => {
        const stok = Number(produk.stok || 0);
        const status = stockStatus(stok);
        const editRowClass = mode === "edit" ? "edit-mode-row" : "";
        html += `<tr class="${editRowClass}" data-id="${produk.id}">
            <td><div class="table-product"><img src="${produk.gambar || PLACEHOLDER_IMAGE}" alt=""><span>${produk.nama || "-"}</span></div></td>
            <td>${formatCurrency(produk.harga)}</td>
            <td>${stok}</td>
            <td><span class="badge ${status.className}">${status.text}</span></td>
            <td>${produk.rating || 0}</td>
            <td>${produk.bestSeller ? "✅" : "-"}</td>
            <td>${mode === "normal" ? `<button class="btn btn-sm detail-btn" data-id="${produk.id}">Detail</button>` : `<span class="text-muted">Klik baris</span>`}</td>
        </tr>`;
    });

    html += "</tbody></table>";
    els.listProduk.innerHTML = html;
}

function renderProduk() {
    const hasil = getFilteredProducts();

    if (hasil.length === 0) {
        els.listProduk.innerHTML = `
            <div class="empty-state">
                <img src="${PLACEHOLDER_IMAGE}" alt="Kosong">
                <h2>Belum Ada Produk</h2>
                <p>Produk tidak ditemukan.</p>
            </div>
        `;
        if (els.pagination) els.pagination.innerHTML = "";
        return;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = hasil.slice(start, start + ITEMS_PER_PAGE);

    if (viewMode === "table") {
        renderProductTable(pageItems);
    } else {
        renderProductGrid(pageItems);
    }

    renderPagination(hasil.length);
    bindProductEvents();
}

function bindProductEvents() {
    // Detail button - always works in normal mode
    els.listProduk.querySelectorAll(".detail-btn").forEach((btn) => {
        btn.onclick = (e) => {
            e.stopPropagation();
            window.location.href = "detail-produk.html?id=" + btn.dataset.id;
        };
    });

    // Card click - ONLY in edit mode
    if (mode === "edit") {
        const selector = viewMode === "table" ? "tr[data-id]" : ".product-card[data-id]";
        els.listProduk.querySelectorAll(selector).forEach((el) => {
            el.onclick = (e) => {
                if (e.target.classList.contains("detail-btn")) return;
                openEditForm(el.dataset.id);
            };
        });
    }
    // If mode !== "edit", no click handler is bound on cards — so they are not clickable
}

async function renderRecentActivity() {
    if (!els.recentActivity) return;

    const snapshot = await get(ref(db, "orders"));
    const orders = [];

    snapshot.forEach((item) => {
        orders.push({ id: item.key, ...item.val() });
    });

    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = orders.slice(0, 5);

    if (recent.length === 0) {
        els.recentActivity.innerHTML = `<p class="text-muted">Belum ada aktivitas pesanan.</p>`;
        return;
    }

    els.recentActivity.innerHTML = recent.map((o) => `
        <div class="activity-item">
            <div class="activity-dot"></div>
            <div>
                <strong>${o.username || "-"}</strong> memesan <strong>${o.product || "-"}</strong>
                <span class="badge badge-info">${o.status || "pending"}</span>
                <p class="text-muted">${o.date || "-"}</p>
            </div>
        </div>
    `).join("");
}

// Parse harga: accepts "50000" or "50.000" (Indonesian dot-separator format)
function parseHarga(value) {
    if (!value) return 0;
    // Remove dots (Indonesian thousand separator) then parse
    const cleaned = String(value).replace(/\./g, "").replace(/,/g, "");
    return Number(cleaned) || 0;
}

function clearForm() {
    ["nama", "harga", "stok", "rating", "gambar", "galeri", "kegunaan", "deskripsi"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    const bsCheck = document.getElementById("bestSeller");
    if (bsCheck) bsCheck.checked = false;
    els.previewGambar.src = PLACEHOLDER_IMAGE;
}

function openEditForm(id) {
    const produk = semuaProduk.find((p) => p.id === id);
    if (!produk) return;

    editID = id;
    els.judulForm.textContent = "Edit Produk";
    els.btnSimpan.textContent = "Update Produk";
    els.btnHapus.style.display = "inline-flex";

    document.getElementById("nama").value = produk.nama || "";
    document.getElementById("harga").value = produk.harga || 0;
    document.getElementById("stok").value = produk.stok || 0;
    document.getElementById("rating").value = produk.rating || 0;
    document.getElementById("gambar").value = produk.gambar || "";
    document.getElementById("galeri").value = (produk.galeri || []).join(",");
    document.getElementById("kegunaan").value = produk.kegunaan || "";
    document.getElementById("deskripsi").value = produk.deskripsi || "";
    const bsCheck = document.getElementById("bestSeller");
    if (bsCheck) bsCheck.checked = !!produk.bestSeller;
    els.previewGambar.src = produk.gambar || PLACEHOLDER_IMAGE;

    els.formContainer.classList.remove("form-hidden");
    els.formContainer.classList.add("form-show");
    window.scrollTo({ top: 200, behavior: "smooth" });
}

els.searchProduk.oninput = () => { currentPage = 1; renderProduk(); };
els.sortProduk.onchange = () => { currentPage = 1; renderProduk(); };

document.getElementById("gambar").addEventListener("input", () => {
    const url = document.getElementById("gambar").value.trim();
    els.previewGambar.src = url || PLACEHOLDER_IMAGE;
});

els.btnTambahMode.onclick = () => {
    mode = "tambah";
    editID = null;
    clearForm();
    els.judulForm.textContent = "Tambah Produk";
    els.btnSimpan.textContent = "Tambah Produk";
    els.btnHapus.style.display = "none";
    els.modeInfo.style.display = "none";
    els.formContainer.classList.remove("form-hidden");
    els.formContainer.classList.add("form-show");
    window.scrollTo({ top: 200, behavior: "smooth" });
};

els.btnEditMode.onclick = () => {
    if (mode === "edit") {
        mode = "normal";
        editID = null;
        els.modeInfo.style.display = "none";
        els.formContainer.classList.remove("form-show");
        els.formContainer.classList.add("form-hidden");
        renderProduk();
        return;
    }

    mode = "edit";
    editID = null;
    els.modeInfo.style.display = "inline-block";
    els.modeInfo.textContent = "Mode Edit Aktif - Klik produk yang ingin diedit";
    renderProduk();
};

els.btnBatal.onclick = () => {
    mode = "normal";
    editID = null;
    clearForm();
    els.modeInfo.style.display = "none";
    els.formContainer.classList.remove("form-show");
    els.formContainer.classList.add("form-hidden");
    renderProduk();
};

els.btnSimpan.onclick = () => {
    const nama = document.getElementById("nama").value.trim();
    const harga = parseHarga(document.getElementById("harga").value);
    const stok = Number(document.getElementById("stok").value);
    const ratingRaw = Number(document.getElementById("rating").value);
    const rating = Math.min(5, Math.max(0, ratingRaw));
    const gambar = document.getElementById("gambar").value.trim();
    const galeri = document.getElementById("galeri").value.split(",").map((i) => i.trim()).filter(Boolean);
    const kegunaan = document.getElementById("kegunaan").value.trim();
    const deskripsi = document.getElementById("deskripsi").value.trim();
    const bsCheck = document.getElementById("bestSeller");
    const bestSeller = bsCheck ? bsCheck.checked : false;

    if (nama === "" || harga <= 0 || stok < 0) {
        alert("Lengkapi data produk terlebih dahulu.");
        return;
    }

    const data = { nama, harga, stok, rating, gambar, galeri, kegunaan, deskripsi, bestSeller };

    if (editID) {
        update(ref(db, "products/" + editID), data);
        alert("Produk berhasil diperbarui.");
    } else {
        push(produkRef, { ...data, komentar: [] });
        alert("Produk berhasil ditambahkan.");
    }

    // Reset to normal mode after save — form closes, cards no longer clickable
    mode = "normal";
    editID = null;
    clearForm();
    els.formContainer.classList.remove("form-show");
    els.formContainer.classList.add("form-hidden");
    els.modeInfo.style.display = "none";
    // Re-render agar class edit-mode dan event listener klik dihapus dari card
    renderProduk();
};

els.btnHapus.onclick = () => {
    if (!editID) return;
    if (!confirm("Yakin ingin menghapus produk ini?")) return;

    remove(ref(db, "products/" + editID));
    alert("Produk berhasil dihapus.");

    mode = "normal";
    editID = null;
    clearForm();
    els.formContainer.classList.remove("form-show");
    els.formContainer.classList.add("form-hidden");
    els.modeInfo.style.display = "none";
    renderProduk();
};

if (els.viewGrid) {
    els.viewGrid.onclick = () => { viewMode = "grid"; els.viewGrid.classList.add("active"); els.viewTable.classList.remove("active"); renderProduk(); };
}
if (els.viewTable) {
    els.viewTable.onclick = () => { viewMode = "table"; els.viewTable.classList.add("active"); els.viewGrid.classList.remove("active"); renderProduk(); };
}
