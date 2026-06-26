import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { ROLES } from "./utils/constants.js";

export async function ensureUserProfile(user, defaults = {}) {
    const userRef = ref(db, "users/" + user.uid);
    const snapshot = await get(userRef);
    if (snapshot.exists()) return snapshot.val();

    const profile = {
        username: defaults.username || user.email?.split("@")[0] || "User",
        email: user.email || "",
        role: defaults.role || ROLES.CUSTOMER,
        photoURL: user.photoURL || "",
        createdAt: new Date().toLocaleDateString("id-ID")
    };

    await set(userRef, profile);
    return profile;
}

export function requireAuth(redirectTo = "login.html") {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                window.location.href = redirectTo;
                return;
            }
            resolve(user);
        });
    });
}

export async function requireRole(allowedRoles, redirectTo = "index.html") {
    const user = await requireAuth();
    const data = await ensureUserProfile(user);
    const snapshot = await get(ref(db, "users/" + user.uid));
    const freshData = snapshot.val() || data;

    if (!allowedRoles.includes(freshData.role)) {
        alert("Anda tidak memiliki akses ke halaman ini.");
        window.location.href = redirectTo;
        return null;
    }

    return { user, data: freshData };
}

export async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) return null;

    const snapshot = await get(ref(db, "users/" + user.uid));
    if (snapshot.exists()) return snapshot.val();
    return ensureUserProfile(user);
}

export { ROLES };
