import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { PLACEHOLDER_IMAGE } from "./utils/constants.js";
import { formatCurrency } from "./utils/format.js";

// PERBAIKAN: Jangan cache element di module level —
// gunakan fungsi agar selalu diambil dari DOM yang sudah siap.
function getProdukGrid()   { return document.getElementById("produkGrid"); }
function getLoadingState() { return document.getElementById("produkLoading"); }

function showLoading(show) {
    const loadingState = getLoadingState();
    if (loadingState) loadingState.style.display = show ? "flex" : "none";
}

function renderProducts(products) {
    const produkGrid = getProdukGrid();
    if (!produkGrid) return;

    while (produkGrid.firstChild) produkGrid.removeChild(produkGrid.firstChild);

    if (products.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML = `<img src="${PLACEHOLDER_IMAGE}" alt="Belum Ada Produk"><h2>Belum Ada Produk</h2><p>Tunggu sampai stockist menambahkan produk.</p>`;
        produkGrid.appendChild(empty);
        return;
    }

    products.forEach((produk) => {
        const article = document.createElement("article");
        article.className = "product-card";

        const img = document.createElement("img");
        img.src = produk.gambar || PLACEHOLDER_IMAGE;
        img.alt = produk.nama || "Produk";

        const body = document.createElement("div");
        body.className = "product-card-body";

        const h2 = document.createElement("h2");
        h2.textContent = produk.nama || "-";

        const price = document.createElement("p");
        price.className = "product-price";
        price.textContent = formatCurrency(produk.harga);

        const desc = document.createElement("p");
        desc.className = "product-desc";
        desc.textContent = produk.deskripsi || "-";

        const action = document.createElement("div");
        action.className = "action";

        const linkDetail = document.createElement("a");
        linkDetail.href = "detail-produk.html?id=" + produk.id + "&from=produk";
        linkDetail.className = "btn btn-primary";
        linkDetail.textContent = "Lihat Detail";

        const linkPesan = document.createElement("a");
        linkPesan.href = "pembayaran.html?id=" + produk.id;
        linkPesan.className = "btn btn-secondary";
        linkPesan.textContent = "Pesan Produk";

        action.appendChild(linkDetail);
        action.appendChild(linkPesan);
        body.appendChild(h2);
        body.appendChild(price);
        body.appendChild(desc);
        body.appendChild(action);
        article.appendChild(img);
        article.appendChild(body);
        produkGrid.appendChild(article);
    });
}

// Module scripts selalu defer — DOM sudah pasti siap saat ini dieksekusi.
// onValue Firebase juga aman karena callback-nya async (tidak sync sebelum DOM).
showLoading(true);

onValue(ref(db, "products"), (snapshot) => {
    const products = [];
    snapshot.forEach((item) => {
        products.push({ id: item.key, ...item.val() });
    });

    localStorage.setItem("products", JSON.stringify(products));
    showLoading(false);
    renderProducts(products);
});
