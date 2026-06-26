export function formatCurrency(value) {
    return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

export function formatDate(dateStr) {
    if (!dateStr) return "-";
    return dateStr;
}

export function stockStatus(stok) {
    const qty = Number(stok || 0);
    if (qty <= 0) return { text: "Stok Habis", className: "badge-danger" };
    if (qty <= 5) return { text: "Stok Menipis", className: "badge-warning" };
    return { text: "Tersedia", className: "badge-success" };
}
