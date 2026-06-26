import { auth, db, firebaseConfig } from "./firebase-config.js";
import { requireRole, ROLES } from "./auth-guard.js";
import { onValue, ref, update, push, remove } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

await requireRole([ROLES.DEVELOPER]);

const statsEl = document.getElementById("stats");
const usersEl = document.getElementById("users");
const productsEl = document.getElementById("products");
const pnInput = document.getElementById("pn");
const currentUid = auth.currentUser?.uid;
const authLookupCache = new Map();

async function lookupInFirebase(payload) {
    const key = JSON.stringify(payload);
    if (authLookupCache.has(key)) return authLookupCache.get(key);

    let result = undefined;

    try {
        const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );
        const data = await res.json();
        if (data.users?.length) result = data.users;

        const msg = data.error?.message || "";
        if (msg.includes("USER_NOT_FOUND") || msg.includes("EMAIL_NOT_FOUND")) result = null;
    } catch (_) {}

    authLookupCache.set(key, result);
    return result;
}

async function getUserAuthStatus(email, rtdbUid) {
    const byUid = await lookupInFirebase({ localId: [rtdbUid] });
    if (byUid?.length) return "registered";
    if (byUid === null) return "orphan";

    if (rtdbUid === currentUid) return "registered";

    if (!email) return "unknown";

    const byEmail = await lookupInFirebase({ email: [email.trim()] });
    if (byEmail?.some((user) => user.localId === rtdbUid)) return "registered";
    if (byEmail === null) return "orphan";
    if (byEmail?.length) return "orphan";

    return "unknown";
}

function renderUserCard(uid, u, orphan, alive) {
    const isSelf = uid === currentUid;

    return `
        <div class="user-card${orphan ? " user-card--orphan" : ""}">
            <div class="user-card-body">
                <div class="user-card-header">
                    <strong>${u.username || "-"}</strong>
                    <span class="badge badge-info">${u.role || "-"}</span>
                    ${alive ? `<span class="badge badge-success">Terdaftar di Firebase</span>` : ""}
                </div>
                <p class="text-muted">${u.email || "-"}</p>
                ${orphan ? `<p class="user-orphan-warning">Akun sudah tidak ada di Firebase. Segera hapus user ini.</p>` : ""}
            </div>
            <div class="user-card-actions">
                <select class="bw-select" data-uid="${uid}" ${orphan ? "disabled" : ""}>
                    <option value="customer" ${u.role === "customer" ? "selected" : ""}>Customer</option>
                    <option value="stockist" ${u.role === "stockist" ? "selected" : ""}>Stockist</option>
                    <option value="developer" ${u.role === "developer" ? "selected" : ""}>Developer</option>
                </select>
                ${isSelf ? "" : `<button class="btn btn-danger btn-sm" data-delete-uid="${uid}" data-username="${u.username || u.email || "-"}">Hapus User</button>`}
            </div>
        </div>
    `;
}

function bindUserActions() {
    usersEl.querySelectorAll(".bw-select:not([disabled])").forEach((select) => {
        select.onchange = () => update(ref(db, "users/" + select.dataset.uid), { role: select.value });
    });

    usersEl.querySelectorAll("[data-delete-uid]").forEach((btn) => {
        btn.onclick = () => {
            const uid = btn.dataset.deleteUid;
            const name = btn.dataset.username;

            if (confirm(`Hapus user "${name}" dari database?`)) {
                remove(ref(db, "users/" + uid));
            }
        };
    });
}

onValue(ref(db, "users"), async (snapshot) => {
    const entries = [];
    let customer = 0;
    let stockist = 0;
    let developer = 0;

    snapshot.forEach((child) => {
        const u = child.val();
        entries.push({ uid: child.key, data: u });

        if (u.role === ROLES.CUSTOMER) customer++;
        else if (u.role === ROLES.STOCKIST) stockist++;
        else developer++;
    });

    statsEl.innerHTML = `
        <div class="stat-card"><img src="../Resources/Icons/user.png" class="dashboard-icon" alt=""><div class="dashboard-info"><h3>Total User</h3><h1>${customer + stockist + developer}</h1></div></div>
        <div class="stat-card"><img src="../Resources/Icons/profile.png" class="dashboard-icon" alt=""><div class="dashboard-info"><h3>Customer</h3><h1>${customer}</h1></div></div>
        <div class="stat-card"><img src="../Resources/Icons/stock.png" class="dashboard-icon" alt=""><div class="dashboard-info"><h3>Stockist</h3><h1>${stockist}</h1></div></div>
        <div class="stat-card"><img src="../Resources/Icons/developer.png" class="dashboard-icon" alt=""><div class="dashboard-info"><h3>Developer</h3><h1>${developer}</h1></div></div>
    `;

    if (!entries.length) {
        usersEl.innerHTML = `<p class="text-muted">Belum ada user.</p>`;
        return;
    }

    usersEl.innerHTML = `<p class="text-muted">Memeriksa status akun...</p>`;

    const checks = await Promise.all(
        entries.map(async ({ uid, data }) => {
            const status = await getUserAuthStatus((data.email || "").trim(), uid);
            return {
                uid,
                data,
                alive: status === "registered",
                orphan: status === "orphan"
            };
        })
    );

    usersEl.innerHTML = checks.map(({ uid, data, orphan, alive }) => renderUserCard(uid, data, orphan, alive)).join("");
    bindUserActions();
});

onValue(ref(db, "products"), (snapshot) => {
    let html = "";
    snapshot.forEach((child) => {
        const p = child.val();
        html += `
            <div class="user-card">
                <strong>${p.nama || "-"}</strong>
                <button class="btn btn-danger btn-sm" data-id="${child.key}">Hapus</button>
            </div>
        `;
    });
    productsEl.innerHTML = html || `<p class="text-muted">Belum ada produk.</p>`;

    productsEl.querySelectorAll("[data-id]").forEach((btn) => {
        btn.onclick = () => {
            if (confirm("Hapus produk ini?")) remove(ref(db, "products/" + btn.dataset.id));
        };
    });
});

window.addP = () => {
    const nama = pnInput.value.trim();
    if (!nama) return alert("Masukkan nama produk.");
    push(ref(db, "products"), { nama, stok: 0, harga: 0, rating: 0, komentar: [] });
    pnInput.value = "";
};
