/**
 * Remark page: Daftar Pengajuan — cart sessionStorage + omzet/proyeksi + submit.
 */
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Info, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatRp, tokoNamaShort } from '@/lib/format';
import {
    clearCart,
    loadCart,
    loadToko,
    saveCart,
    saveToko,
    type StoredToko,
} from '@/lib/pengajuan-cart';
import {
    calcM2Price,
    validateCart,
    type CartRow,
    type KatalogMeta,
} from '@/lib/pengajuan-rules';
import { dashboard } from '@/routes';

type KatalogEntry = KatalogMeta & {
    nama: string;
    foto_url: string;
    kategori: string;
    dim_cm?: string | null;
    harga_min?: number | null;
};

type RecentPengajuan = {
    id: number;
    status: string;
    total_cost: string;
    created_at: string;
    toko?: { customer_id: string; nama: string };
    items?: { kode: string; nama_branding: string; qty: number; subtotal: string }[];
};

type Props = {
    toko: StoredToko | null;
    tokoList: StoredToko[];
    katalog: Record<string, KatalogEntry>;
    storageKeys: { items: string; toko: string };
    recent: RecentPengajuan[];
};

/** Remark komponen: halaman pengajuan. */
export default function PengajuanIndex({
    toko: serverToko,
    katalog,
    storageKeys,
    recent,
}: Props) {
    const { flash, errors } = usePage().props as {
        flash?: { success?: string; error?: string };
        errors?: Record<string, string>;
    };

    const [cart, setCart] = useState<CartRow[]>([]);
    const [toko, setToko] = useState<StoredToko | null>(serverToko);
    const [showRules, setShowRules] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
            // Remark: setelah submit sukses, kosongkan cart lokal
            clearCart(storageKeys.items);
            setCart([]);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (errors?.items) {
            toast.error(errors.items);
        }
    }, [flash?.success, flash?.error, errors?.items, storageKeys.items]);

    useEffect(() => {
        setCart(loadCart(storageKeys.items));
        const stored = loadToko(storageKeys.toko);
        if (stored) {
            setToko(stored);
        } else if (serverToko) {
            saveToko(storageKeys.toko, serverToko);
            setToko(serverToko);
        }
    }, [storageKeys.items, storageKeys.toko, serverToko]);

    /** Remark fungsi: hitung subtotal 1 baris cart. */
    function lineSubtotal(row: CartRow): number {
        const meta = katalog[String(row.id)];
        if (!meta) {
            return 0;
        }
        const qty = row.qty || 1;
        if (meta.is_m2 || String(meta.satuan).toLowerCase() === 'm2') {
            const priced = calcM2Price(
                row.panjang_cm,
                row.lebar_cm,
                meta.harga_max,
            );
            return (priced ?? 0) * qty;
        }
        const unit = Number(meta.harga_max ?? meta.harga_min ?? 0);
        return unit * qty;
    }

    const summary = useMemo(() => {
        const totalCost = cart.reduce((sum, row) => sum + lineSubtotal(row), 0);
        const totalQty = cart.reduce((n, r) => n + (r.qty || 1), 0);
        const omzet = toko?.omzet_tahun_ini || 0;
        const upliftPct = toko?.target_naik_dasar_pct || 10;
        const uplift = omzet * (upliftPct / 100);
        const target = omzet + uplift;
        const ratio = omzet > 0 ? (totalCost / omzet) * 100 : null;
        return { totalCost, totalQty, omzet, uplift, target, ratio };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart, toko, katalog]);

    /** Remark fungsi: update qty baris. */
    function setQty(index: number, qty: number) {
        const next = cart.map((row, i) =>
            i === index ? { ...row, qty: Math.max(1, qty) } : row,
        );
        setCart(next);
        saveCart(storageKeys.items, next);
    }

    /** Remark fungsi: hapus 1 baris. */
    function removeRow(index: number) {
        const next = cart.filter((_, i) => i !== index);
        setCart(next);
        saveCart(storageKeys.items, next);
    }

    /** Remark fungsi: submit pengajuan ke server. */
    function submit() {
        if (!toko) {
            toast.error('Toko penerima belum dipilih.');
            return;
        }
        const check = validateCart(cart, katalog, toko.tipe_toko);
        if (!check.ok) {
            toast.error(check.message);
            return;
        }

        setSubmitting(true);
        router.post(
            '/pengajuan',
            {
                toko_id: toko.id,
                items: cart.map((row) => ({
                    katalog_item_id: row.id,
                    qty: row.qty || 1,
                    panjang_cm: row.panjang_cm ?? null,
                    lebar_cm: row.lebar_cm ?? null,
                })),
            },
            {
                onFinish: () => setSubmitting(false),
                onError: () => toast.error('Gagal mengajukan. Periksa input.'),
            },
        );
    }

    return (
        <>
            <Head title="Pengajuan" />
            <div className="bmd-page flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Remark section: header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-bold text-[#5a5c69]">
                        Daftar Pengajuan
                    </h1>
                    <Link href="/katalog" className="bmd-btn-primary">
                        <Plus className="size-3.5" />
                        Tambah dari Katalog
                    </Link>
                </div>

                {/* Remark section: kartu toko penerima (tanpa dropdown ganti toko) */}
                <div className="bmd-toko-card">
                    <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#4e73df]">
                        Toko penerima branding
                    </div>
                    <div className="mb-2 text-lg font-bold text-[#5a5c69]">
                        {toko ? tokoNamaShort(toko.nama) : '—'}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <span>
                            Customer ID:{' '}
                            <strong>{toko?.customer_id || '—'}</strong>
                        </span>
                        <span>
                            Cabang: <strong>{toko?.cabang || '—'}</strong>
                        </span>
                        <span>
                            Kota: <strong>{toko?.kota || '—'}</strong>
                        </span>
                        <span>
                            Tipe: <strong>{toko?.tipe_toko || 'ALL'}</strong>
                        </span>
                    </div>
                </div>

                <div className="pengajuan-layout">
                    {/* Remark section: daftar item cart + ringkasan jumlah/biaya */}
                    <div className="bmd-panel">
                        <div className="bmd-panel-header">
                            <h2 className="bmd-panel-title">
                                Item Branding Dipilih
                            </h2>
                            <span className="rounded-full bg-[#4e73df] px-2 py-0.5 text-xs font-bold text-white">
                                {cart.length}
                            </span>
                        </div>
                        {cart.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <p className="mb-3">
                                    Belum ada item di pengajuan.
                                </p>
                                <Link
                                    href="/katalog"
                                    className="bmd-btn-primary"
                                >
                                    Pilih dari Katalog
                                </Link>
                            </div>
                        ) : (
                            <div className="pengajuan-item-list">
                                {cart.map((row, index) => {
                                    const meta = katalog[String(row.id)];
                                    return (
                                        <div
                                            key={`${row.id}-${index}`}
                                            className="pengajuan-item-card"
                                        >
                                            <div className="pengajuan-item-num">
                                                {index + 1}
                                            </div>
                                            <div className="pengajuan-item-foto">
                                                <img
                                                    src={
                                                        meta?.foto_url ||
                                                        '/assets/katalog/placeholder.svg'
                                                    }
                                                    alt={meta?.nama || ''}
                                                    onError={(e) => {
                                                        (
                                                            e.target as HTMLImageElement
                                                        ).src =
                                                            '/assets/katalog/placeholder.svg';
                                                    }}
                                                />
                                            </div>
                                            <div className="pengajuan-item-detail">
                                                <div className="min-w-0">
                                                    <div className="truncate font-bold">
                                                        {meta?.nama ||
                                                            row.kode}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {meta?.kode || row.kode}{' '}
                                                        · {meta?.kategori}
                                                        {row.panjang_cm &&
                                                        row.lebar_cm
                                                            ? ` · ${row.panjang_cm}×${row.lebar_cm} cm`
                                                            : ''}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            className="h-7 w-7 rounded border"
                                                            onClick={() =>
                                                                setQty(
                                                                    index,
                                                                    (row.qty ||
                                                                        1) - 1,
                                                                )
                                                            }
                                                        >
                                                            −
                                                        </button>
                                                        <span className="min-w-6 text-center font-bold">
                                                            {row.qty || 1}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="h-7 w-7 rounded border"
                                                            onClick={() =>
                                                                setQty(
                                                                    index,
                                                                    (row.qty ||
                                                                        1) + 1,
                                                                )
                                                            }
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <div className="min-w-24 text-right font-semibold">
                                                        {formatRp(
                                                            lineSubtotal(row),
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="text-red-500"
                                                        onClick={() =>
                                                            removeRow(index)
                                                        }
                                                        aria-label="Hapus"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Remark: jumlah item + total biaya di panel item branding */}
                        <div className="space-y-2 border-t border-slate-200 px-4 py-3">
                            <div className="pengajuan-summary-row">
                                <span className="text-slate-600">
                                    Jumlah item
                                </span>
                                <strong>{cart.length}</strong>
                            </div>
                            <div className="pengajuan-summary-row">
                                <span className="text-slate-600">
                                    Total qty
                                </span>
                                <strong>{summary.totalQty}</strong>
                            </div>
                            <div className="pengajuan-summary-row">
                                <span className="font-bold">
                                    Total biaya branding
                                </span>
                                <strong className="text-lg text-[#4e73df]">
                                    {formatRp(summary.totalCost)}
                                </strong>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3">
                            <button
                                type="button"
                                className="inline-flex items-center gap-1 text-sm text-red-600"
                                onClick={() => {
                                    clearCart(storageKeys.items);
                                    setCart([]);
                                }}
                            >
                                <Trash2 className="size-3.5" />
                                Kosongkan
                            </button>
                            <button
                                type="button"
                                className="bmd-btn-success !mt-0 !w-auto px-4"
                                disabled={cart.length === 0 || submitting}
                                onClick={submit}
                            >
                                {submitting
                                    ? 'Mengajukan…'
                                    : 'Ajukan Branding'}
                            </button>
                        </div>
                    </div>

                    {/* Remark section: kolom kanan — murni omzet & proyeksi */}
                    <div className="bmd-panel">
                        <div className="bmd-panel-header">
                            <h2 className="bmd-panel-title">
                                Omzet & Proyeksi
                            </h2>
                        </div>
                        <div className="p-4">
                            <div className="pengajuan-summary-row">
                                <span className="text-slate-600">
                                    Omzet tahun ini
                                </span>
                                <strong>{formatRp(summary.omzet)}</strong>
                            </div>
                            <div className="pengajuan-summary-row text-xs text-slate-500">
                                <span>Cost vs omzet</span>
                                <span>
                                    {summary.ratio == null
                                        ? '—'
                                        : `${summary.ratio.toFixed(2)}%`}
                                </span>
                            </div>

                            <div className="pengajuan-projection">
                                <div className="mb-2 text-xs font-bold uppercase text-emerald-600">
                                    Proyeksi target tahun depan
                                </div>
                                <div className="pengajuan-summary-row text-sm">
                                    <span className="text-slate-600">
                                        Uplift dari branding
                                    </span>
                                    <strong className="text-emerald-600">
                                        {formatRp(summary.uplift)}
                                    </strong>
                                </div>
                                <div className="pengajuan-summary-row">
                                    <span className="font-bold">
                                        Target dgn branding
                                    </span>
                                    <strong className="text-lg text-emerald-600">
                                        {formatRp(summary.target)}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Remark: link sekunder di bawah card, rata tengah */}
                <div className="flex flex-wrap items-center justify-center gap-6 py-1">
                    <Link
                        href="/katalog"
                        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#4e73df]"
                    >
                        <ArrowLeft className="size-3.5" />
                        Kembali ke Katalog
                    </Link>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm text-slate-600 underline hover:text-[#4e73df]"
                        onClick={() => setShowRules(true)}
                    >
                        <Info className="size-3.5" />
                        Aturan Branding
                    </button>
                </div>

                {/* Remark section: pengajuan terbaru dari DB */}
                {recent.length > 0 && (
                    <div className="bmd-panel">
                        <div className="bmd-panel-header">
                            <h2 className="bmd-panel-title">
                                Pengajuan terbaru (database)
                            </h2>
                        </div>
                        <div className="divide-y">
                            {recent.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                                >
                                    <div>
                                        <strong>#{p.id}</strong> —{' '}
                                        {p.toko?.nama || 'Toko'}
                                        <div className="text-xs text-slate-500">
                                            {p.status} ·{' '}
                                            {p.items?.length || 0} item
                                        </div>
                                    </div>
                                    <strong>
                                        {formatRp(Number(p.total_cost))}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Remark section: modal aturan branding */}
                {showRules && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
                            <h3 className="mb-3 text-lg font-bold">
                                Aturan Branding
                            </h3>
                            <div className="mb-2 text-xs font-bold uppercase text-amber-600">
                                Kode B
                            </div>
                            <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                                <li>
                                    Setiap kode B hanya boleh ditambahkan{' '}
                                    <strong>1 kali</strong>.
                                </li>
                                <li>
                                    <strong>B02</strong> hanya untuk toko{' '}
                                    <strong>TRO</strong>; eksklusif thd B lain.
                                </li>
                                <li>
                                    <strong>B03+</strong> hanya setelah{' '}
                                    <strong>B01</strong> ada.
                                </li>
                            </ul>
                            <div className="mb-2 text-xs font-bold uppercase text-sky-600">
                                Satuan m²
                            </div>
                            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
                                <li>
                                    Wajib isi tinggi & lebar (cm) dari katalog.
                                </li>
                                <li>
                                    Biaya = luas (m²) × harga max per m².
                                </li>
                            </ul>
                            <button
                                type="button"
                                className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white"
                                onClick={() => setShowRules(false)}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

PengajuanIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pengajuan', href: '/pengajuan' },
    ],
};
