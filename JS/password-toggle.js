const EYE_ICON = "../Resources/Icons/eye.png";
const EYE_OFF_ICON = "../Resources/Icons/eye-off.png";

function initPasswordToggles() {
    document.querySelectorAll(".password-container").forEach((container) => {
        const input = container.querySelector("input");
        const toggle = container.querySelector(".toggle-password");

        if (!input || !toggle || toggle.dataset.initialized === "true") return;

        const eyeOn = toggle.dataset.eye || EYE_ICON;
        const eyeOff = toggle.dataset.eyeOff || EYE_OFF_ICON;

        let icon = toggle.querySelector("img");
        if (!icon) {
            icon = document.createElement("img");
            icon.alt = "";
            icon.setAttribute("aria-hidden", "true");
            toggle.textContent = "";
            toggle.appendChild(icon);
        }

        icon.src = eyeOn;
        toggle.setAttribute("aria-label", "Tampilkan password");
        toggle.setAttribute("aria-pressed", "false");
        toggle.dataset.initialized = "true";

        toggle.addEventListener("click", () => {
            const isHidden = input.type === "password";
            input.type = isHidden ? "text" : "password";
            icon.src = isHidden ? eyeOff : eyeOn;
            toggle.setAttribute("aria-label", isHidden ? "Sembunyikan password" : "Tampilkan password");
            toggle.setAttribute("aria-pressed", String(isHidden));
        });
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPasswordToggles);
} else {
    initPasswordToggles();
}

window.initPasswordToggles = initPasswordToggles;
