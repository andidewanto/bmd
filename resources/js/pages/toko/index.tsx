/**
 * Remark page: Daftar Toko — agregasi brandings + sort ASC/DESC per kolom.
 */
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { BmdSortHeader } from '@/components/bmd-sort-header';
import { formatPct, formatRp } from '@/lib/format';
import { dashboard } from '@/routes';

type TokoRow = {
    no: number;
    customer_id: string;
    nama: string | null;
    cabang: string;
    avg_omzet: number | null;
    total_cost: number;
    statuses: string[];
    branding_count: number;
};

type TokoKpi = {
    scope_label: string;
    toko_terbranding: number;
    total_toko: number;
    toko_terbranding_pct: number;
    total_cost: number;
    total_avg_omzet: number;
    cost_ratio_pct: number | null;
};

type SortKey =
    | 'no'
    | 'customer_id'
    | 'nama'
    | 'cabang'
    | 'avg_omzet'
    | 'total_cost'
    | 'branding_count'
    | 'status';

type Props = {
    rows: TokoRow[];
    filters: {
        cabang: string;
        status: string;
        q: string;
        sort: SortKey;
        order: 'asc' | 'desc';
    };
    cabangList: { cabang: string; toko_count: number }[];
    statusList: { status: string; toko_count: number }[];
    kpi: TokoKpi;
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
};

/** Remark fungsi: warna badge status branding (parity BMD2). */
function statusClass(status: string): string {
    const map: Record<string, string> = {
        'Pengajuan Branding Baru': 'bmd-badge-info',
        'Pemilihan Tim Branding': 'bmd-badge-secondary',
        'Pemilihan Vendor': 'bmd-badge-secondary',
        'Upload Preview Branding': 'bmd-badge-warning',
        'Update Data Aktual Branding': 'bmd-badge-warning',
        'Penjadwalan Branding': 'bmd-badge-success',
        'Penginputan Nomor PO': 'bmd-badge-primary',
        'Produksi Vendor': 'bmd-badge-primary',
        Cancel: 'bmd-badge-danger',
        'Disetujui Toko': 'bmd-badge-success',
    };
    return map[status] ?? 'bmd-badge-muted';
}

/** Remark komponen: halaman daftar toko. */
export default function TokoIndex({
    rows,
    filters,
    cabangList,
    statusList,
    kpi,
    pagination,
}: Props) {
    const [search, setSearch] = useState(filters.q || '');
    const [cabang, setCabang] = useState(filters.cabang || '');
    const [status, setStatus] = useState(filters.status || '');

    /** Remark fungsi: apply filter/sort via Inertia. */
    function applyFilters(next: {
        q?: string;
        cabang?: string;
        status?: string;
        page?: number;
        sort?: SortKey;
        order?: 'asc' | 'desc';
    }) {
        router.get(
            '/toko',
            {
                q: next.q ?? search,
                cabang: next.cabang ?? cabang,
                status: next.status ?? status,
                page: next.page ?? 1,
                sort: next.sort ?? filters.sort,
                order: next.order ?? filters.order,
            },
            { preserveState: true, replace: true },
        );
    }

    /** Remark fungsi: set sort dari klik header. */
    function handleSort(column: SortKey, order: 'asc' | 'desc') {
        applyFilters({ sort: column, order, page: 1 });
    }

    const terbrandingLabel = `${kpi.toko_terbranding}/${kpi.total_toko} - ${formatPct(kpi.toko_terbranding_pct)}`;

    return (
        <>
            <Head title="Toko" />
            <div className="bmd-page flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Remark section: header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-bold text-[#5a5c69]">Toko</h1>
                    <div className="text-sm text-slate-500">
                        Total {pagination.total} toko · {kpi.scope_label}
                    </div>
                </div>

                {/* Remark section: KPI cards (mengikuti filter aktif) */}
                <div className="bmd-stat-grid is-4">
                    <div className="bmd-stat-card is-success">
                        <div className="bmd-stat-label">Toko Terbranding</div>
                        <div className="bmd-stat-value">{terbrandingLabel}</div>
                        <div className="bmd-stat-hint">
                            Toko selesai branding / total toko ·{' '}
                            {kpi.scope_label}
                        </div>
                    </div>
                    <div className="bmd-stat-card is-warning">
                        <div className="bmd-stat-label">
                            Cost Ratio · {kpi.scope_label}
                        </div>
                        <div className="bmd-stat-value">
                            {formatPct(kpi.cost_ratio_pct, 2)}
                        </div>
                        <div className="bmd-stat-hint">
                            Total cost branding / total average omzet
                        </div>
                    </div>
                    <div className="bmd-stat-card is-muted">
                        <div className="bmd-stat-label">KPI Cadangan</div>
                        <div className="bmd-stat-value text-base text-slate-400">
                            —
                        </div>
                        <div className="bmd-stat-hint">
                            Belum ditentukan — placeholder untuk metrik berikutnya
                        </div>
                    </div>
                    <div className="bmd-stat-card is-muted">
                        <div className="bmd-stat-label">KPI Cadangan</div>
                        <div className="bmd-stat-value text-base text-slate-400">
                            —
                        </div>
                        <div className="bmd-stat-hint">
                            Belum ditentukan — placeholder untuk metrik berikutnya
                        </div>
                    </div>
                </div>

                {/* Remark section: panel tabel + filter */}
                <div className="bmd-panel">
                    <div className="bmd-panel-header">
                        <h2 className="bmd-panel-title">Daftar Toko</h2>
                        <div className="bmd-filters">
                            <input
                                type="search"
                                placeholder="Cari cust id / nama toko / status…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applyFilters({ q: search });
                                    }
                                }}
                            />
                            <select
                                value={cabang}
                                onChange={(e) => {
                                    setCabang(e.target.value);
                                    applyFilters({ cabang: e.target.value });
                                }}
                                aria-label="Filter cabang"
                            >
                                <option value="">Semua cabang</option>
                                {cabangList.map((c) => (
                                    <option key={c.cabang} value={c.cabang}>
                                        {c.cabang} ({c.toko_count} toko)
                                    </option>
                                ))}
                            </select>
                            {/* Remark: filter status branding di sebelah filter cabang */}
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                aria-label="Filter status branding"
                            >
                                <option value="">Semua status</option>
                                {statusList.map((s) => (
                                    <option key={s.status} value={s.status}>
                                        {s.status} ({s.toko_count} toko)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="bmd-table">
                            <thead>
                                <tr>
                                    <BmdSortHeader
                                        label="NO"
                                        column="no"
                                        sort={filters.sort}
                                        order={filters.order}
                                        onSort={handleSort}
                                    />
                                    <BmdSortHeader
                                        label="Cust Id"
                                        column="customer_id"
                                        sort={filters.sort}
                                        order={filters.order}
                                        onSort={handleSort}
                                    />
                                    <BmdSortHeader
                                        label="Nama Toko"
                                        column="nama"
                                        sort={filters.sort}
                                        order={filters.order}
                                        onSort={handleSort}
                                    />
                                    <BmdSortHeader
                                        label="Cabang"
                                        column="cabang"
                                        sort={filters.sort}
                                        order={filters.order}
                                        onSort={handleSort}
                                    />
                                    <BmdSortHeader
                                        label="AVG Omzet"
                                        column="avg_omzet"
                                        sort={filters.sort}
                                        order={filters.order}
                                        align="right"
                                        onSort={handleSort}
                                    />
                                    <BmdSortHeader
                                        label="Total Cost Branding"
                                        column="total_cost"
                                        sort={filters.sort}
                                        order={filters.order}
                                        align="right"
                                        onSort={handleSort}
                                    />
                                    <BmdSortHeader
                                        label="Jumlah Branding"
                                        column="branding_count"
                                        sort={filters.sort}
                                        order={filters.order}
                                        align="right"
                                        onSort={handleSort}
                                    />
                                    <BmdSortHeader
                                        label="Status Branding"
                                        column="status"
                                        sort={filters.sort}
                                        order={filters.order}
                                        onSort={handleSort}
                                    />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-slate-500"
                                        >
                                            Tidak ada data toko.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr key={row.customer_id}>
                                            <td>{row.no}</td>
                                            <td className="font-semibold">
                                                {row.customer_id}
                                            </td>
                                            <td>{row.nama || '—'}</td>
                                            <td>
                                                <span className="bmd-badge-primary">
                                                    {row.cabang}
                                                </span>
                                            </td>
                                            <td className="text-right font-medium">
                                                {formatRp(row.avg_omzet)}
                                            </td>
                                            <td className="text-right font-medium">
                                                {formatRp(row.total_cost)}
                                            </td>
                                            <td className="text-right font-medium">
                                                {row.branding_count}
                                            </td>
                                            <td>
                                                <div className="flex flex-wrap gap-1">
                                                    {row.statuses.length ===
                                                    0 ? (
                                                        <span className="text-slate-400">
                                                            —
                                                        </span>
                                                    ) : (
                                                        row.statuses.map(
                                                            (status) => (
                                                                <span
                                                                    key={
                                                                        status
                                                                    }
                                                                    className={statusClass(
                                                                        status,
                                                                    )}
                                                                >
                                                                    {status}
                                                                </span>
                                                            ),
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Remark section: pagination */}
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
                                        applyFilters({
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
                                        applyFilters({
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
            </div>
        </>
    );
}

TokoIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Toko', href: '/toko' },
    ],
};
