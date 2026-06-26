import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { BW_IDS, ROLES } from "./utils/constants.js";

window.register = async function () {
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const websiteId = document.getElementById("websiteId").value.trim().toUpperCase();

    if (!username || !email || !password) {
        alert("Lengkapi semua data!");
        return;
    }

    let role = ROLES.CUSTOMER;

    if (websiteId === BW_IDS.STOCKIST) {
        role = ROLES.STOCKIST;
    } else if (websiteId === BW_IDS.DEVELOPER) {
        role = ROLES.DEVELOPER;
    } else if (websiteId === BW_IDS.ADMIN) {
        role = ROLES.DEVELOPER;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        await set(ref(db, "users/" + uid), {
            username,
            email,
            role,
            photoURL: "",
            createdAt: new Date().toLocaleDateString("id-ID")
        });

        await signOut(auth);
        alert("Registrasi berhasil!");
        window.location.href = "login.html";
    } catch (error) {
        alert(error.message);
    }
};
