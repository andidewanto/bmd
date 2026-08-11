/**
 * Remark file: persistence cart pengajuan di sessionStorage (parity BMD2).
 */

import type { CartRow } from '@/lib/pengajuan-rules';

export type StoredToko = {
    id: number;
    customer_id: string;
    nama: string;
    cabang?: string | null;
    kota?: string | null;
    tipe_toko: string;
    omzet_tahun_ini: number;
    target_naik_dasar_pct: number;
    is_mock?: boolean;
};

/** Remark fungsi: baca cart dari sessionStorage. */
export function loadCart(storageKey: string): CartRow[] {
    try {
        const raw = sessionStorage.getItem(storageKey);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw) as CartRow[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/** Remark fungsi: simpan cart ke sessionStorage. */
export function saveCart(storageKey: string, cart: CartRow[]): void {
    sessionStorage.setItem(storageKey, JSON.stringify(cart));
}

/** Remark fungsi: kosongkan cart. */
export function clearCart(storageKey: string): void {
    sessionStorage.removeItem(storageKey);
}

/** Remark fungsi: baca toko aktif dari sessionStorage. */
export function loadToko(storageKey: string): StoredToko | null {
    try {
        const raw = sessionStorage.getItem(storageKey);
        if (!raw) {
            return null;
        }
        return JSON.parse(raw) as StoredToko;
    } catch {
        return null;
    }
}

/** Remark fungsi: simpan toko aktif. */
export function saveToko(storageKey: string, toko: StoredToko): void {
    sessionStorage.setItem(storageKey, JSON.stringify(toko));
}

/** Remark fungsi: hitung qty per katalog id di cart. */
export function countById(cart: CartRow[]): Record<number, number> {
    return cart.reduce<Record<number, number>>((acc, row) => {
        acc[row.id] = (acc[row.id] || 0) + (row.qty || 1);
        return acc;
    }, {});
}
