import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { PLACEHOLDER_IMAGE } from "./utils/constants.js";
import { formatCurrency } from "./utils/format.js";

const cartList = document.getElementById("cartList");
const cartEmpty = document.getElementById("cartEmpty");
const cartTotal = document.getElementById("cartTotal");

function getCartKey(uid) {
    return "bw_cart_" + uid;
}

function loadCart(uid) {
    return JSON.parse(localStorage.getItem(getCartKey(uid)) || "[]");
}

function saveCart(uid, cart) {
    localStorage.setItem(getCartKey(uid), JSON.stringify(cart));
}

function renderCart(uid) {
    const cart = loadCart(uid);
    let total = 0;

    if (cart.length === 0) {
        cartList.innerHTML = "";
        if (cartEmpty) cartEmpty.style.display = "flex";
        if (cartTotal) cartTotal.textContent = formatCurrency(0);
        return;
    }

    if (cartEmpty) cartEmpty.style.display = "none";
    cartList.innerHTML = "";

    cart.forEach((item, index) => {
        total += Number(item.harga || 0) * Number(item.qty || 1);
        cartList.innerHTML += `
            <div class="cart-item">
                <img src="${item.gambar || PLACEHOLDER_IMAGE}" alt="${item.nama}">
                <div class="cart-item-info">
                    <h3>${item.nama}</h3>
                    <p>${formatCurrency(item.harga)} x ${item.qty || 1}</p>
                </div>
                <button class="btn btn-danger btn-sm" data-index="${index}">Hapus</button>
            </div>
        `;
    });

    if (cartTotal) cartTotal.textContent = formatCurrency(total);

    cartList.querySelectorAll("[data-index]").forEach((btn) => {
        btn.onclick = () => {
            const cart = loadCart(uid);
            cart.splice(Number(btn.dataset.index), 1);
            saveCart(uid, cart);
            renderCart(uid);
        };
    });
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    renderCart(user.uid);
});

export function addToCart(uid, product, qty = 1) {
    const cart = loadCart(uid);
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
        existing.qty = Number(existing.qty || 1) + qty;
    } else {
        cart.push({ ...product, qty });
    }
    saveCart(uid, cart);
}

window.checkoutCart = function () {
    const user = auth.currentUser;
    if (!user) return;

    const cart = loadCart(user.uid);
    if (cart.length === 0) {
        alert("Keranjang masih kosong.");
        return;
    }

    if (cart.length === 1) {
        window.location.href = "pembayaran.html?id=" + cart[0].id;
        return;
    }

    alert("Checkout multi-produk akan segera tersedia. Silakan pesan satu per satu.");
};
