/**
 * Remark file: helper format tampilan (harga, dimensi) — parity BMD2 helpers.php.
 */

/** Remark fungsi: format angka rupiah tanpa prefix "Rp". */
export function formatHargaAngka(
    min: number | null | undefined,
    max: number | null | undefined,
): string {
    if (min == null && max == null) {
        return '—';
    }
    if (min != null && max != null && Math.abs(min - max) < 0.01) {
        return new Intl.NumberFormat('id-ID').format(min);
    }
    if (min != null && max != null) {
        return `${new Intl.NumberFormat('id-ID').format(min)} – ${new Intl.NumberFormat('id-ID').format(max)}`;
    }
    const single = min ?? max ?? 0;
    return new Intl.NumberFormat('id-ID').format(single);
}

/** Remark fungsi: format rupiah lengkap. */
export function formatRp(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) {
        return '—';
    }
    return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(value))}`;
}

/** Remark fungsi: format persen (id-ID), null → em dash. */
export function formatPct(
    value: number | null | undefined,
    digits = 1,
): string {
    if (value == null || Number.isNaN(value)) {
        return '—';
    }
    return `${new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits,
    }).format(value)}%`;
}

/**
 * Remark fungsi: format rupiah ringkas (Juta / Miliar) untuk progress budget.
 */
export function formatRpCompact(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) {
        return '—';
    }

    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (abs >= 1_000_000_000) {
        const miliar = abs / 1_000_000_000;
        return `${sign}Rp ${new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: miliar >= 10 ? 0 : 1,
        }).format(miliar)} Miliar`;
    }

    if (abs >= 1_000_000) {
        const juta = abs / 1_000_000;
        return `${sign}Rp ${new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: juta >= 100 ? 0 : 1,
        }).format(juta)} Juta`;
    }

    return `${sign}${formatRp(abs)}`;
}

/** Remark fungsi: tampilan dimensi katalog. */
export function formatDimensi(dimCm: string | null | undefined): string {
    const dim = (dimCm ?? '').trim();
    if (!dim) {
        return '—';
    }
    return `${dim} cm`;
}

/** Remark fungsi: nama toko dipotong jika terlalu panjang. */
export function tokoNamaShort(nama: string, max = 64): string {
    const value = nama.trim();
    if (value.length <= max) {
        return value;
    }
    return `${value.slice(0, max - 1)}…`;
}
