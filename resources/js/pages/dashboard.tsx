/**
 * Remark page: Dashboard — RINGKASAN NASIONAL + realisasi budget + kinerja area.
 */
import { Head, router } from '@inertiajs/react';
import { BmdSortHeader } from '@/components/bmd-sort-header';
import { formatPct, formatRpCompact } from '@/lib/format';
import { dashboard } from '@/routes';

type KpiNasional = {
    total_toko_asumsi: number;
    budget_tahun_juta: number;
    toko_terpasang: number;
    realisasi_pct: number;
    avg_cost_ratio_pct: number | null;
    target_cost_ratio_pct: number;
    avg_pencapaian_target_pct: number;
    butuh_peremajaan: number;
    lifetime_bulan: number;
    prospek: number;
    on_process: number;
};

type RealisasiBudget = {
    budget_terpakai: number;
    budget_alokasi: number;
    realisasi_pct: number;
    bar_pct: number;
};

type KinerjaAreaRow = {
    area: string;
    jumlah_toko_branding: number;
    avg_omzet: number | null;
    growth_omzet_pct: number | null;
    avg_cost_ratio_pct: number | null;
    avg_pencapaian_target_pct: number | null;
};

type AreaSortKey =
    | 'area'
    | 'jumlah_toko_branding'
    | 'avg_omzet'
    | 'growth_omzet_pct'
    | 'avg_cost_ratio_pct'
    | 'avg_pencapaian_target_pct';

type AreaPagination = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type Props = {
    kpiNasional: KpiNasional;
    realisasiBudget: RealisasiBudget;
    kinerjaPerArea: KinerjaAreaRow[];
    areaFilters: {
        sort: AreaSortKey;
        order: 'asc' | 'desc';
    };
    areaPagination: AreaPagination;
};

/** Remark fungsi: format angka id-ID. */
function formatAngka(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value);
}

/** Remark komponen: satu kartu KPI nasional. */
function KpiCard({
    tone,
    title,
    value,
    hint,
    badge,
}: {
    tone: 'green' | 'blue' | 'orange' | 'yellow' | 'pink';
    title?: string;
    value: string;
    hint?: string;
    badge?: string;
}) {
    return (
        <div className={`bmd-dash-kpi is-${tone}`}>
            {badge ? (
                <div className="bmd-dash-kpi-badge">{badge}</div>
            ) : (
                <div className="bmd-dash-kpi-label">{title}</div>
            )}
            <div className="bmd-dash-kpi-value">{value}</div>
            {hint ? <div className="bmd-dash-kpi-hint">{hint}</div> : null}
        </div>
    );
}

/** Remark komponen: progress bar realisasi budget tahunan. */
function RealisasiBudgetBar({ data }: { data: RealisasiBudget }) {
    const overBudget = data.realisasi_pct > 100;

    return (
        <div className="bmd-dash-budget">
            <div className="bmd-dash-budget-label">Realisasi Budget</div>
            <div className="bmd-dash-budget-amount">
                {formatRpCompact(data.budget_terpakai)}
                <span className="bmd-dash-budget-sep"> / </span>
                {formatRpCompact(data.budget_alokasi)}
            </div>
            <div
                className="bmd-dash-budget-track"
                role="progressbar"
                aria-valuenow={Math.round(data.bar_pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Realisasi budget tahunan"
            >
                <div
                    className={`bmd-dash-budget-fill${overBudget ? ' is-over' : ''}`}
                    style={{ width: `${data.bar_pct}%` }}
                />
            </div>
            <div className="bmd-dash-budget-footer">
                Realisasi {formatPct(data.realisasi_pct)}
                {overBudget ? (
                    <span className="bmd-dash-budget-over">
                        {' '}
                        · Melebihi alokasi
                    </span>
                ) : null}
            </div>
        </div>
    );
}

/** Remark komponen: tabel kinerja per area + sort + paginasi. */
function KinerjaPerAreaTable({
    rows,
    filters,
    pagination,
}: {
    rows: KinerjaAreaRow[];
    filters: Props['areaFilters'];
    pagination: AreaPagination;
}) {
    /** Remark fungsi: apply sort/page via Inertia (query string). */
    function applyAreaQuery(next: {
        page?: number;
        sort?: AreaSortKey;
        order?: 'asc' | 'desc';
    }) {
        router.get(
            '/dashboard',
            {
                sort: next.sort ?? filters.sort,
                order: next.order ?? filters.order,
                page: next.page ?? 1,
            },
            { preserveState: true, replace: true },
        );
    }

    function handleSort(column: AreaSortKey, order: 'asc' | 'desc') {
        applyAreaQuery({ sort: column, order, page: 1 });
    }

    return (
        <div className="bmd-panel">
            <div className="bmd-panel-header">
                <h2 className="bmd-panel-title">Kinerja Per Area</h2>
                <div className="text-sm text-slate-500">
                    {pagination.total} area · {pagination.per_page}/halaman
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="bmd-table bmd-dash-area-table">
                    <thead>
                        <tr>
                            <BmdSortHeader
                                label="Area"
                                column="area"
                                sort={filters.sort}
                                order={filters.order}
                                onSort={handleSort}
                            />
                            <BmdSortHeader
                                label="Jumlah Toko Branding"
                                column="jumlah_toko_branding"
                                sort={filters.sort}
                                order={filters.order}
                                align="right"
                                onSort={handleSort}
                            />
                            <BmdSortHeader
                                label="Avg Omzet/Bulan"
                                column="avg_omzet"
                                sort={filters.sort}
                                order={filters.order}
                                align="right"
                                onSort={handleSort}
                            />
                            <BmdSortHeader
                                label="Growth Omzet"
                                column="growth_omzet_pct"
                                sort={filters.sort}
                                order={filters.order}
                                align="right"
                                onSort={handleSort}
                            />
                            <BmdSortHeader
                                label="Avg Cost Ratio"
                                column="avg_cost_ratio_pct"
                                sort={filters.sort}
                                order={filters.order}
                                align="right"
                                onSort={handleSort}
                            />
                            <BmdSortHeader
                                label="Avg Pencapaian Target"
                                column="avg_pencapaian_target_pct"
                                sort={filters.sort}
                                order={filters.order}
                                align="right"
                                onSort={handleSort}
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-slate-500"
                                >
                                    Belum ada data area.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr key={row.area}>
                                    <td>
                                        <span className="bmd-badge-primary">
                                            {row.area}
                                        </span>
                                    </td>
                                    <td className="text-right font-medium">
                                        {formatAngka(row.jumlah_toko_branding)}
                                    </td>
                                    <td className="text-right font-medium">
                                        {row.avg_omzet != null
                                            ? formatRpCompact(row.avg_omzet)
                                            : '—'}
                                    </td>
                                    <td className="text-right text-slate-400">
                                        {formatPct(row.growth_omzet_pct)}
                                    </td>
                                    <td className="text-right font-medium">
                                        {formatPct(row.avg_cost_ratio_pct)}
                                    </td>
                                    <td className="text-right text-slate-400">
                                        {formatPct(
                                            row.avg_pencapaian_target_pct,
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.last_page > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-sm">
                    <span className="text-slate-500">
                        Menampilkan {pagination.from ?? 0}–{pagination.to ?? 0}{' '}
                        dari {pagination.total}
                    </span>
                    <div className="flex gap-1">
                        <button
                            type="button"
                            className="rounded border px-2 py-1 disabled:opacity-40"
                            disabled={pagination.current_page <= 1}
                            onClick={() =>
                                applyAreaQuery({
                                    page: pagination.current_page - 1,
                                })
                            }
                        >
                            Prev
                        </button>
                        <span className="px-2 py-1 text-slate-600">
                            {pagination.current_page} / {pagination.last_page}
                        </span>
                        <button
                            type="button"
                            className="rounded border px-2 py-1 disabled:opacity-40"
                            disabled={
                                pagination.current_page >= pagination.last_page
                            }
                            onClick={() =>
                                applyAreaQuery({
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
    );
}

/** Remark komponen: halaman dashboard. */
export default function Dashboard({
    kpiNasional,
    realisasiBudget,
    kinerjaPerArea = [],
    areaFilters = { sort: 'area', order: 'asc' },
    areaPagination = {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: null,
        to: null,
    },
}: Props) {
    // Remark: guard props agar error backend parsial tidak bikin halaman putih
    if (!kpiNasional || !realisasiBudget) {
        return (
            <>
                <Head title="Dashboard" />
                <div className="bmd-page p-4 text-slate-600">
                    Dashboard belum siap. Muat ulang halaman.
                </div>
            </>
        );
    }

    const kpi = kpiNasional;

    return (
        <>
            <Head title="Dashboard" />
            <div className="bmd-page flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Remark section: RINGKASAN NASIONAL */}
                <section>
                    <h1 className="bmd-dash-section-title">
                        Ringkasan Nasional
                    </h1>
                    <div className="bmd-dash-kpi-grid">
                        <KpiCard
                            tone="green"
                            title="Total Toko Branding"
                            value={`${formatAngka(kpi.toko_terpasang)} / ${formatAngka(kpi.total_toko_asumsi)}`}
                            hint={`Realisasi ${formatPct(kpi.realisasi_pct)}`}
                        />
                        <KpiCard
                            tone="blue"
                            title="Avg Cost Ratio"
                            value={formatPct(kpi.avg_cost_ratio_pct)}
                            hint={`Target Nasional <${formatPct(kpi.target_cost_ratio_pct, 0)}`}
                        />
                        <KpiCard
                            tone="orange"
                            title="Avg Pencapaian Target"
                            value={formatPct(kpi.avg_pencapaian_target_pct)}
                        />
                        <KpiCard
                            tone="yellow"
                            title="Butuh Peremajaan"
                            value={`${formatAngka(kpi.butuh_peremajaan)} Toko`}
                        />
                        <KpiCard
                            tone="pink"
                            badge="PROSPEK"
                            value={formatAngka(kpi.prospek)}
                            hint={`On Process: ${formatAngka(kpi.on_process)} Toko`}
                        />
                    </div>
                </section>

                {/* Remark section: REALISASI BUDGET */}
                <section>
                    <RealisasiBudgetBar data={realisasiBudget} />
                </section>

                {/* Remark section: KINERJA PER AREA */}
                <section>
                    <KinerjaPerAreaTable
                        rows={kinerjaPerArea}
                        filters={areaFilters}
                        pagination={areaPagination}
                    />
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
