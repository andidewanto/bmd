/**
 * Remark page: Katalog Branding — daftar item + add-to-cart pengajuan (~75% UI BMD2).
 */
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    KatalogLightbox,
    type KatalogLightboxItem,
} from '@/components/katalog-lightbox';
import { formatDimensi, formatHargaAngka } from '@/lib/format';
import {
    clearCart,
    countById,
    loadCart,
    loadToko,
    saveCart,
    saveToko,
    type StoredToko,
} from '@/lib/pengajuan-cart';
import {
    calcM2Price,
    validateAddBranding,
    validateDimensions,
    type CartRow,
    type KatalogMeta,
} from '@/lib/pengajuan-rules';
import { dashboard } from '@/routes';

type KatalogItem = KatalogLightboxItem & {
    foto_url: string;
    is_m2: boolean;
};

type Props = {
    items: KatalogItem[];
    filters: { q: string; kategori: string; customer_id?: string };
    stats: { total_items: number; total_kategori: number; filter_label: string };
    kategoriList: { kategori: string; item_count: number }[];
    toko: StoredToko | null;
    storageKeys: { items: string; toko: string };
};

/** Remark komponen: halaman katalog. */
export default function KatalogIndex({
    items,
    filters,
    stats,
    kategoriList,
    toko,
    storageKeys,
}: Props) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    const [search, setSearch] = useState(filters.q || '');
    const [kategori, setKategori] = useState(filters.kategori || '');
    const [cart, setCart] = useState<CartRow[]>([]);
    const [dims, setDims] = useState<
        Record<number, { panjang: string; lebar: string }>
    >({});
    const [warning, setWarning] = useState<string | null>(null);
    const [lightboxItem, setLightboxItem] = useState<KatalogItem | null>(null);

    // Remark: sync flash server → toast
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    // Remark: hydrate cart + persist toko aktif ke sessionStorage
    useEffect(() => {
        setCart(loadCart(storageKeys.items));
        if (toko) {
            const existing = loadToko(storageKeys.toko);
            if (!existing || existing.customer_id !== toko.customer_id) {
                saveToko(storageKeys.toko, toko);
            }
        }
    }, [storageKeys.items, storageKeys.toko, toko]);

    const counts = useMemo(() => countById(cart), [cart]);
    const cartTotalQty = useMemo(
        () => cart.reduce((n, r) => n + (r.qty || 1), 0),
        [cart],
    );

    const katalogMap = useMemo(() => {
        const map: Record<number, KatalogMeta> = {};
        for (const item of items) {
            map[item.id] = {
                id: item.id,
                kode: item.kode,
                satuan: item.satuan,
                harga_max: item.harga_max,
                is_m2: item.is_m2,
            };
        }
        return map;
    }, [items]);

    /** Remark fungsi: apply filter via Inertia visit. */
    function applyFilters(next: { q?: string; kategori?: string }) {
        router.get(
            '/katalog',
            {
                q: next.q ?? search,
                kategori: next.kategori ?? kategori,
                customer_id: toko?.customer_id,
            },
            { preserveState: true, replace: true },
        );
    }

    /** Remark fungsi: tampilkan warning penting di tengah halaman. */
    function showWarning(message: string) {
        setWarning(message);
    }

    /** Remark fungsi: tambah item ke cart dengan validasi aturan. */
    function addToCart(item: KatalogItem) {
        const dim = dims[item.id] || { panjang: '', lebar: '' };
        let panjang: number | null = null;
        let lebar: number | null = null;

        if (item.is_m2) {
            const dimCheck = validateDimensions(
                Number(dim.panjang),
                Number(dim.lebar),
            );
            if (!dimCheck.ok) {
                showWarning(dimCheck.message || 'Dimensi tidak valid.');
                return;
            }
            panjang = Number(dim.panjang);
            lebar = Number(dim.lebar);
        }

        const check = validateAddBranding({
            kode: item.kode,
            cart,
            katalog: katalogMap,
            tokoTipe: toko?.tipe_toko || 'ALL',
        });
        if (!check.ok) {
            showWarning(check.message || 'Tidak dapat menambahkan item.');
            return;
        }

        const next: CartRow[] = [
            ...cart,
            {
                id: item.id,
                kode: item.kode,
                qty: 1,
                panjang_cm: panjang,
                lebar_cm: lebar,
            },
        ];
        setCart(next);
        saveCart(storageKeys.items, next);
        toast.success(`${item.kode} ditambahkan ke pengajuan`);
    }

    return (
        <>
            <Head title="Katalog Branding" />
            <div className="bmd-page flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Remark section: page header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-bold text-[#5a5c69]">
                        Katalog Branding
                    </h1>
                    <Link href="/pengajuan" className="bmd-btn-primary">
                        <ShoppingCart className="size-3.5" />
                        Lihat Pengajuan
                        {cartTotalQty > 0 ? ` (${cartTotalQty})` : ''}
                    </Link>
                </div>

                {toko?.is_mock && (
                    <div className="rounded border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
                        Toko aktif masih mockup: <strong>{toko.nama}</strong> (
                        {toko.customer_id}) — tipe {toko.tipe_toko}
                    </div>
                )}

                {/* Remark section: statistik ringkas */}
                <div className="bmd-stat-grid">
                    <div className="bmd-stat-card">
                        <div className="bmd-stat-label">Total Item</div>
                        <div className="bmd-stat-value">{stats.total_items}</div>
                    </div>
                    <div className="bmd-stat-card is-info">
                        <div className="bmd-stat-label">Kategori</div>
                        <div className="bmd-stat-value">
                            {stats.total_kategori}
                        </div>
                    </div>
                    <div className="bmd-stat-card is-success">
                        <div className="bmd-stat-label">Filter Aktif</div>
                        <div className="bmd-stat-value text-base">
                            {stats.filter_label}
                        </div>
                    </div>
                </div>

                {/* Remark section: panel daftar + filter */}
                <div className="bmd-panel">
                    <div className="bmd-panel-header">
                        <h2 className="bmd-panel-title">Daftar Katalog</h2>
                        <div className="bmd-filters">
                            <input
                                type="search"
                                placeholder="Cari kode / nama / spek… (Enter)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applyFilters({ q: search });
                                    }
                                }}
                            />
                            <select
                                value={kategori}
                                onChange={(e) => {
                                    setKategori(e.target.value);
                                    applyFilters({ kategori: e.target.value });
                                }}
                            >
                                <option value="">Semua kategori</option>
                                {kategoriList.map((k) => (
                                    <option key={k.kategori} value={k.kategori}>
                                        {k.kategori} ({k.item_count})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="katalog-list-body">
                        {items.length === 0 ? (
                            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                Tidak ada item katalog.
                            </div>
                        ) : (
                            <div className="katalog-card-grid">
                                {items.map((item) => {
                                    const qty = counts[item.id] || 0;
                                    const dim =
                                        dims[item.id] || {
                                            panjang: '',
                                            lebar: '',
                                        };
                                    // Remark: estimasi = (tinggi×lebar / 10000) × harga_max
                                    const estimasi = item.is_m2
                                        ? calcM2Price(
                                              Number(dim.panjang),
                                              Number(dim.lebar),
                                              item.harga_max,
                                          )
                                        : null;
                                    return (
                                        <article
                                            key={item.id}
                                            className="katalog-card"
                                        >
                                            <button
                                                type="button"
                                                className="katalog-card-media"
                                                aria-label={`Lihat detail ${item.kode}`}
                                                onClick={() =>
                                                    setLightboxItem(item)
                                                }
                                            >
                                                <img
                                                    src={item.foto_url}
                                                    alt={`${item.kode} - ${item.nama_branding}`}
                                                    className="katalog-card-img"
                                                    onError={(e) => {
                                                        (
                                                            e.target as HTMLImageElement
                                                        ).src =
                                                            '/assets/katalog/placeholder.svg';
                                                    }}
                                                />
                                            </button>
                                            <div className="katalog-card-body">
                                                <div>
                                                    {/* Remark: judul max 2 baris — KODE - Nama */}
                                                    <h2 className="katalog-card-name">
                                                        {item.kode} -{' '}
                                                        {item.nama_branding}
                                                    </h2>
                                                    {!item.is_m2 && (
                                                        <div className="katalog-card-detail-row">
                                                            <span className="katalog-card-detail-label">
                                                                Dimensi
                                                            </span>
                                                            <span>:</span>
                                                            <span>
                                                                {formatDimensi(
                                                                    item.dim_cm,
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="katalog-card-detail-row">
                                                        <span className="katalog-card-detail-label">
                                                            Harga
                                                        </span>
                                                        <span>:</span>
                                                        <span>
                                                            {formatHargaAngka(
                                                                item.harga_min,
                                                                item.harga_max,
                                                            )}
                                                        </span>
                                                    </div>
                                                    {item.is_m2 && (
                                                        <div className="katalog-m2-form">
                                                            <p className="katalog-m2-form-title">
                                                                Dimensi branding
                                                            </p>
                                                            <div className="katalog-m2-fields">
                                                                <input
                                                                    type="number"
                                                                    min={0.01}
                                                                    step={0.01}
                                                                    placeholder="Tinggi (cm)"
                                                                    value={
                                                                        dim.panjang
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setDims(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                [item.id]:
                                                                                    {
                                                                                        panjang:
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        lebar:
                                                                                            prev[
                                                                                                item
                                                                                                    .id
                                                                                            ]
                                                                                                ?.lebar ||
                                                                                            '',
                                                                                    },
                                                                            }),
                                                                        )
                                                                    }
                                                                />
                                                                <input
                                                                    type="number"
                                                                    min={0.01}
                                                                    step={0.01}
                                                                    placeholder="Lebar (cm)"
                                                                    value={
                                                                        dim.lebar
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setDims(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                [item.id]:
                                                                                    {
                                                                                        panjang:
                                                                                            prev[
                                                                                                item
                                                                                                    .id
                                                                                            ]
                                                                                                ?.panjang ||
                                                                                            '',
                                                                                        lebar: e
                                                                                            .target
                                                                                            .value,
                                                                                    },
                                                                            }),
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                            {estimasi !=
                                                                null && (
                                                                <p className="katalog-m2-estimasi">
                                                                    Estimasi
                                                                    Harga :{' '}
                                                                    <strong>
                                                                        {new Intl.NumberFormat(
                                                                            'id-ID',
                                                                        ).format(
                                                                            Math.round(
                                                                                estimasi,
                                                                            ),
                                                                        )}
                                                                    </strong>
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="katalog-add-wrap">
                                                    <button
                                                        type="button"
                                                        className="katalog-add-pengajuan"
                                                        onClick={() =>
                                                            addToCart(item)
                                                        }
                                                    >
                                                        Tambahkan ke Pengajuan
                                                    </button>
                                                    {qty > 0 && (
                                                        <span className="katalog-add-badge">
                                                            {qty}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Remark: helper clear cart saat debugging */}
                {cartTotalQty > 0 && (
                    <button
                        type="button"
                        className="self-start text-xs text-slate-500 underline"
                        onClick={() => {
                            clearCart(storageKeys.items);
                            setCart([]);
                            toast.message('Cart dikosongkan');
                        }}
                    >
                        Kosongkan cart lokal
                    </button>
                )}
            </div>

            {/* Remark: warning aturan branding — center screen */}
            {warning && (
                <div
                    className="bmd-warning-overlay"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="katalog-warning-title"
                    onClick={() => setWarning(null)}
                >
                    <div
                        className="bmd-warning-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 id="katalog-warning-title">Peringatan</h3>
                        <p>{warning}</p>
                        <button
                            type="button"
                            className="bmd-warning-ok"
                            onClick={() => setWarning(null)}
                        >
                            Mengerti
                        </button>
                    </div>
                </div>
            )}

            <KatalogLightbox
                item={lightboxItem}
                onClose={() => setLightboxItem(null)}
            />
        </>
    );
}

KatalogIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Katalog', href: '/katalog' },
    ],
};
