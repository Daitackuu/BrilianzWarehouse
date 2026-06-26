import { auth, db } from "./firebase-config.js";
import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { ensureUserProfile } from "./auth-guard.js";

await setPersistence(auth, browserLocalPersistence);

const loginForm = document.getElementById("loginForm");

async function handleLogin(e) {
    if (e) e.preventDefault();

    const usernameInput = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!usernameInput || !password) {
        alert("Lengkapi username dan password.");
        return;
    }

    try {
        let email = null;

        const snapshot = await get(child(ref(db), "users"));
        if (snapshot.exists()) {
            snapshot.forEach((user) => {
                const data = user.val();
                if (data.username === usernameInput) email = data.email;
            });
        }

        if (!email && usernameInput.includes("@")) {
            email = usernameInput;
        }

        if (!email) {
            alert("Username tidak ditemukan. Coba login dengan email jika akun baru.");
            return;
        }

        const credential = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(credential.user, {
            username: usernameInput.includes("@") ? undefined : usernameInput
        });

        alert("Login berhasil!");
        window.location.href = "../index.html";
    } catch (error) {
        let message = "Terjadi kesalahan saat login.";

        switch (error.code) {
            case "auth/invalid-credential":
                message = "Password salah.";
                break;
            case "auth/too-many-requests":
                message = "Terlalu banyak percobaan login. Coba lagi nanti.";
                break;
            case "auth/network-request-failed":
                message = "Tidak ada koneksi internet.";
                break;
        }

        alert(message);
        console.error("Login Error:", error);
    }
}

if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
}

window.login = handleLogin;
