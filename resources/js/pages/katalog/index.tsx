/**
 * Remark page: Katalog Branding — daftar item + add-to-cart pengajuan.
 */
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BmdWarningDialog } from '@/components/bmd-warning-dialog';
import { KatalogCard } from '@/components/katalog/katalog-card';
import { KatalogFilters } from '@/components/katalog/katalog-filters';
import type { DimState } from '@/components/katalog/katalog-m2-fields';
import {
    KatalogLightbox,
    type KatalogLightboxItem,
} from '@/components/katalog-lightbox';
import { useFlashToast } from '@/hooks/use-flash-toast';
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

type Pagination = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type Props = {
    items: KatalogItem[];
    filters: { q: string; kategori: string; customer_id?: string };
    stats: { total_items: number; total_kategori: number; filter_label: string };
    kategoriList: { kategori: string; item_count: number }[];
    toko: StoredToko | null;
    storageKeys: { items: string; toko: string };
    pagination: Pagination;
    appEnv: string;
};

/** Remark komponen: halaman katalog. */
export default function KatalogIndex({
    items,
    filters,
    stats,
    kategoriList,
    toko,
    storageKeys,
    pagination,
    appEnv,
}: Props) {
    const { bmd } = usePage().props as {
        bmd?: { auth_bypass?: boolean };
    };

    const [search, setSearch] = useState(filters.q || '');
    const [kategori, setKategori] = useState(filters.kategori || '');
    const [cart, setCart] = useState<CartRow[]>([]);
    const [dims, setDims] = useState<Record<number, DimState>>({});
    const [warning, setWarning] = useState<string | null>(null);
    const [lightboxItem, setLightboxItem] = useState<KatalogItem | null>(null);

    useFlashToast();

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

    /** Remark: tombol debug cart hanya di local / auth bypass. */
    const showDebugCart =
        appEnv === 'local' || Boolean(bmd?.auth_bypass);

    /** Remark fungsi: apply filter/page via Inertia. */
    const applyQuery = useCallback(
        (next: { q?: string; kategori?: string; page?: number }) => {
            router.get(
                '/katalog',
                {
                    q: next.q ?? search,
                    kategori: next.kategori ?? kategori,
                    customer_id: toko?.customer_id,
                    page: next.page ?? 1,
                },
                { preserveState: true, replace: true },
            );
        },
        [search, kategori, toko?.customer_id],
    );

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
                setWarning(dimCheck.message || 'Dimensi tidak valid.');
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
            setWarning(check.message || 'Tidak dapat menambahkan item.');
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

                <div className="bmd-panel">
                    <div className="bmd-panel-header">
                        <h2 className="bmd-panel-title">Daftar Katalog</h2>
                        <KatalogFilters
                            search={search}
                            kategori={kategori}
                            kategoriList={kategoriList}
                            onSearchChange={setSearch}
                            onSearchSubmit={() => applyQuery({ q: search })}
                            onKategoriChange={(value) => {
                                setKategori(value);
                                applyQuery({ kategori: value, page: 1 });
                            }}
                        />
                    </div>

                    <div className="katalog-list-body">
                        {items.length === 0 ? (
                            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                Tidak ada item katalog.
                            </div>
                        ) : (
                            <div className="katalog-card-grid">
                                {items.map((item) => (
                                    <KatalogCard
                                        key={item.id}
                                        item={item}
                                        qty={counts[item.id] || 0}
                                        dim={
                                            dims[item.id] || {
                                                panjang: '',
                                                lebar: '',
                                            }
                                        }
                                        onDimChange={(next) =>
                                            setDims((prev) => ({
                                                ...prev,
                                                [item.id]: next,
                                            }))
                                        }
                                        onOpenLightbox={() =>
                                            setLightboxItem(item)
                                        }
                                        onAdd={() => addToCart(item)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {pagination.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-sm">
                            <span className="text-slate-500">
                                Menampilkan {pagination.from ?? 0}–
                                {pagination.to ?? 0} dari {pagination.total}
                            </span>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    className="rounded border px-2 py-1 disabled:opacity-40"
                                    disabled={pagination.current_page <= 1}
                                    onClick={() =>
                                        applyQuery({
                                            page: pagination.current_page - 1,
                                        })
                                    }
                                >
                                    Prev
                                </button>
                                <span className="px-2 py-1 text-slate-600">
                                    {pagination.current_page} /{' '}
                                    {pagination.last_page}
                                </span>
                                <button
                                    type="button"
                                    className="rounded border px-2 py-1 disabled:opacity-40"
                                    disabled={
                                        pagination.current_page >=
                                        pagination.last_page
                                    }
                                    onClick={() =>
                                        applyQuery({
                                            page: pagination.current_page + 1,
                                        })
                                    }
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {showDebugCart && cartTotalQty > 0 && (
                    <button
                        type="button"
                        className="self-start text-xs text-slate-500 underline"
                        onClick={() => {
                            clearCart(storageKeys.items);
                            setCart([]);
                            toast.message('Cart dikosongkan');
                        }}
                    >
                        Kosongkan cart lokal (debug)
                    </button>
                )}
            </div>

            <BmdWarningDialog
                message={warning}
                onClose={() => setWarning(null)}
            />

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
