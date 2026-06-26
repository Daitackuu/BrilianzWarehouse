import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { ref, get, push } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { PLACEHOLDER_IMAGE } from "./utils/constants.js";
import { formatCurrency } from "./utils/format.js";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

if (!productId) {
    alert("Produk tidak ditemukan.");
    window.location.href = "produk.html";
}

let currentUser = null;
let produk = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("Silakan login terlebih dahulu!");
        window.location.href = "login.html";
        return;
    }

    const snapshot = await get(ref(db, "users/" + user.uid));
    currentUser = snapshot.val();
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
});

const productSnapshot = await get(ref(db, "products/" + productId));

if (!productSnapshot.exists()) {
    alert("Produk tidak ditemukan!");
    window.location.href = "produk.html";
}

produk = productSnapshot.val();

document.getElementById("namaProduk").textContent = produk.nama || "-";
document.getElementById("hargaProduk").textContent = formatCurrency(produk.harga);
document.getElementById("deskripsiProduk").textContent = produk.deskripsi || "-";
document.getElementById("gambarProduk").src = produk.gambar || PLACEHOLDER_IMAGE;

window.ambilLokasi = function () {
    if (!navigator.geolocation) {
        alert("Geolocation tidak didukung browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        document.getElementById("mapsLink").value = `https://www.google.com/maps?q=${lat},${lng}`;
        alert("Lokasi berhasil diambil!");
    });
};

window.pesanProduk = async function () {
    if (!currentUser) {
        alert("Silakan login terlebih dahulu!");
        window.location.href = "login.html";
        return;
    }

    const metode = document.getElementById("payment").value;
    const alamat = document.getElementById("alamat").value.trim();
    const mapsLink = document.getElementById("mapsLink").value.trim();

    if (alamat === "") {
        alert("Masukkan alamat pengiriman!");
        return;
    }

    const orderData = {
        username: currentUser.username,
        userId: auth.currentUser.uid,
        productId,
        product: produk.nama,
        price: produk.harga,
        payment: metode,
        alamat,
        maps: mapsLink,
        status: "pending",
        date: new Date().toLocaleString("id-ID")
    };

    await push(ref(db, "orders"), orderData);

    let orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push(orderData);
    localStorage.setItem("orders", JSON.stringify(orders));

    const pesan = `Halo Stockist Brilianz Warehouse

Saya ingin memesan produk:

Produk : ${produk.nama}
Harga : ${formatCurrency(produk.harga)}

Alamat :
${alamat}

Google Maps :
${mapsLink || "-"}

Metode Pembayaran :
${metode}

Mohon konfirmasi pesanan saya.`;

    window.open(
        `https://wa.me/6283157258883?text=${encodeURIComponent(pesan)}`,
        "_blank"
    );

    alert("Pesanan berhasil dikirim!");
    window.location.href = "riwayat-pesan.html";
};
