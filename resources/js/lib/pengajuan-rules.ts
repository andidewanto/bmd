/**
 * Remark file: port TypeScript dari BMD2 js/pengajuan-rules.js.
 * Dipakai di Katalog (add-to-cart) & Pengajuan (validasi sebelum submit).
 */

export type CartRow = {
    id: number;
    kode?: string;
    qty?: number;
    panjang_cm?: number | null;
    lebar_cm?: number | null;
};

export type KatalogMeta = {
    id: number;
    kode: string;
    satuan?: string | null;
    harga_max?: number | null;
    is_m2?: boolean;
};

type RuleResult = { ok: true } | { ok: false; message: string };

/** Remark fungsi: normalisasi kode item. */
export function normalizeKode(kode?: string | null): string {
    return String(kode ?? '')
        .trim()
        .toUpperCase();
}

/** Remark fungsi: cek family Booth (B…). */
export function isBKode(kode?: string | null): boolean {
    return /^B\d/.test(normalizeKode(kode));
}

/** Remark fungsi: normalisasi satuan. */
export function normalizeSatuan(satuan?: string | null): string {
    return String(satuan ?? '')
        .trim()
        .toLowerCase()
        .replace(/²/g, '2');
}

/** Remark fungsi: apakah satuan m². */
export function isM2Satuan(satuan?: string | null): boolean {
    return normalizeSatuan(satuan) === 'm2';
}

/** Remark fungsi: hitung luas m² dari cm. */
export function calcAreaM2(
    panjangCm?: number | null,
    lebarCm?: number | null,
): number | null {
    const p = Number(panjangCm);
    const l = Number(lebarCm);
    if (!(p > 0 && l > 0)) {
        return null;
    }
    return (p * l) / 10000;
}

/** Remark fungsi: biaya m² = luas × harga max. */
export function calcM2Price(
    panjangCm?: number | null,
    lebarCm?: number | null,
    hargaMax?: number | null,
): number | null {
    const area = calcAreaM2(panjangCm, lebarCm);
    const max = Number(hargaMax);
    if (area == null || !(max > 0)) {
        return null;
    }
    return area * max;
}

/** Remark fungsi: validasi dimensi. */
export function validateDimensions(
    panjangCm?: number | null,
    lebarCm?: number | null,
): RuleResult {
    if (!(Number(panjangCm) > 0)) {
        return { ok: false, message: 'Tinggi (cm) harus diisi dan lebih dari 0.' };
    }
    if (!(Number(lebarCm) > 0)) {
        return { ok: false, message: 'Lebar (cm) harus diisi dan lebih dari 0.' };
    }
    return { ok: true };
}

/** Remark fungsi: nomor urut kode B. */
export function bNumber(kode?: string | null): number | null {
    const match = normalizeKode(kode).match(/^B(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

/** Remark fungsi: kumpulkan kode dari cart. */
function cartKodes(
    cart: CartRow[],
    katalog: Record<string | number, KatalogMeta>,
): string[] {
    return (cart || [])
        .map((row) => {
            const meta = katalog[row.id] || katalog[String(row.id)];
            return normalizeKode(meta?.kode || row.kode);
        })
        .filter((k) => k !== '');
}

/**
 * Remark fungsi: validasi penambahan item (aturan kode B).
 */
export function validateAddBranding(opts: {
    kode: string;
    cart: CartRow[];
    katalog: Record<string | number, KatalogMeta>;
    tokoTipe?: string;
}): RuleResult {
    const kode = normalizeKode(opts.kode);
    const codes = cartKodes(opts.cart, opts.katalog);
    const tokoTipe = normalizeKode(opts.tokoTipe || 'ALL');

    if (!isBKode(kode)) {
        return { ok: true };
    }

    if (codes.includes(kode)) {
        return {
            ok: false,
            message: `${kode} sudah ada di daftar pengajuan. Branding kode B hanya boleh ditambahkan 1 kali.`,
        };
    }

    const hasB02 = codes.includes('B02');
    const otherBCodes = codes.filter((c) => isBKode(c) && c !== 'B02');

    if (kode === 'B02') {
        if (tokoTipe !== 'TRO') {
            return {
                ok: false,
                message:
                    'B02 (Backdrop Mesin Tinting) hanya boleh ditambahkan untuk toko dengan kode TRO.',
            };
        }
        if (otherBCodes.length > 0) {
            return {
                ok: false,
                message:
                    'Tidak boleh menambahkan B02 jika sudah ada branding kode B lainnya.',
            };
        }
    } else if (isBKode(kode) && hasB02) {
        return {
            ok: false,
            message:
                'Sudah ada B02 di pengajuan. Tidak boleh menambahkan branding kode B lainnya.',
        };
    }

    const num = bNumber(kode);
    if (num !== null && num >= 3 && !codes.includes('B01')) {
        return {
            ok: false,
            message: `${kode} hanya boleh ditambahkan setelah B01 (Booth Tinting) ada di daftar pengajuan.`,
        };
    }

    return { ok: true };
}

/**
 * Remark fungsi: validasi seluruh cart sebelum submit.
 */
export function validateCart(
    cart: CartRow[],
    katalog: Record<string | number, KatalogMeta>,
    tokoTipe = 'ALL',
): RuleResult {
    for (let i = 0; i < cart.length; i++) {
        const row = cart[i];
        const meta = katalog[row.id] || katalog[String(row.id)] || {};
        const kode = normalizeKode(meta.kode || row.kode);
        const prior = cart.slice(0, i);
        const check = validateAddBranding({
            kode,
            cart: prior,
            katalog,
            tokoTipe,
        });
        if (!check.ok) {
            return check;
        }

        const satuan = meta.satuan;
        if (isM2Satuan(satuan) || meta.is_m2) {
            const dim = validateDimensions(row.panjang_cm, row.lebar_cm);
            if (!dim.ok) {
                return {
                    ok: false,
                    message: `${kode ? `${kode}: ` : ''}${dim.message}`,
                };
            }
        }
    }
    return { ok: true };
}
