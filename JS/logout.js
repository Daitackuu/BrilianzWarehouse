import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { NAVBAR_CACHE_KEY } from "./utils/constants.js";

window.logout = async function () {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
    }

    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
    localStorage.removeItem(NAVBAR_CACHE_KEY);
    window.location.href = "login.html";
};
