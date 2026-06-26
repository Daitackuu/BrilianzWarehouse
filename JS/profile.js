import { auth, db } from "./firebase-config.js";
import {
    onAuthStateChanged,
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { DEFAULT_AVATAR, ROLES } from "./utils/constants.js";
import { ensureUserProfile } from "./auth-guard.js";
import "./logout.js";

const profileImage = document.getElementById("profileImage");
let currentUid = null;
let userData = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUid = user.uid;
    userData = await ensureUserProfile(user);

    ["username", "email", "role", "createdAt"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = userData[id] || "-";
    });

    if (profileImage) {
        profileImage.src = userData.photoURL || DEFAULT_AVATAR;
    }

    localStorage.setItem("currentUser", JSON.stringify(userData));
    setupRoleMenus(userData.role);
});

function setupRoleMenus(role) {
    const stockistMenu = document.getElementById("stockistMenu");
    const developerMenu = document.getElementById("developerMenu");

    if (stockistMenu && (role === ROLES.STOCKIST || role === ROLES.DEVELOPER)) {
        stockistMenu.style.display = "block";
    }

    if (developerMenu && role === ROLES.DEVELOPER) {
        developerMenu.style.display = "block";
    }
}

window.editPhoto = () => document.getElementById("photoInput").click();

document.addEventListener("change", async (e) => {
    if (e.target.id !== "photoInput" || !currentUid) return;

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
        await update(ref(db, "users/" + currentUid), { photoURL: reader.result });
        if (profileImage) profileImage.src = reader.result;
    };
    reader.readAsDataURL(file);
});

window.editUsername = async () => {
    const value = prompt("Username baru:", userData.username || "");
    if (!value || !value.trim()) return;

    await update(ref(db, "users/" + currentUid), { username: value.trim() });
    document.getElementById("username").textContent = value.trim();
    userData.username = value.trim();
    localStorage.setItem("currentUser", JSON.stringify(userData));
    alert("Username berhasil diperbarui.");
};

window.editEmail = async () => {
    const value = prompt("Email baru:", userData.email || "");
    if (!value || !value.trim()) return;

    await update(ref(db, "users/" + currentUid), { email: value.trim() });
    document.getElementById("email").textContent = value.trim();
    userData.email = value.trim();
    localStorage.setItem("currentUser", JSON.stringify(userData));
    alert("Email berhasil diperbarui.");
};

window.editPassword = async () => {
    const current = prompt("Masukkan password saat ini:");
    if (!current) return;

    const newPass = prompt("Masukkan password baru:");
    if (!newPass || newPass.length < 6) {
        alert("Password minimal 6 karakter.");
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, current);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPass);
        alert("Password berhasil diperbarui.");
    } catch (error) {
        alert("Gagal memperbarui password. Pastikan password lama benar.");
        console.error(error);
    }
};
