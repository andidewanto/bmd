<?php

namespace App\Http\Controllers;

use App\Models\Branding;
use App\Models\KatalogItem;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * DashboardController
 *
 * Remark kelas: ringkasan nasional (KPI card atas) untuk halaman Dashboard.
 */
class DashboardController extends Controller
{
    /**
     * Remark: whitelist sort kolom kinerja per area → ekspresi SQL.
     *
     * @var array<string, string>
     */
    private const AREA_SORT_MAP = [
        'area' => 'area',
        'jumlah_toko_branding' => 'jumlah_toko_branding',
        'avg_omzet' => 'avg_omzet',
        'growth_omzet_pct' => 'growth_omzet_pct',
        'avg_cost_ratio_pct' => 'avg_cost_ratio',
        'avg_pencapaian_target_pct' => 'avg_pencapaian_target_pct',
    ];

    /**
     * Remark fungsi: render dashboard + KPI + budget + kinerja area (paginated).
     */
    public function index(Request $request): Response
    {
        $sort = (string) $request->query('sort', 'area');
        $order = strtolower((string) $request->query('order', 'asc'));
        if (! isset(self::AREA_SORT_MAP[$sort])) {
            $sort = 'area';
        }
        if (! in_array($order, ['asc', 'desc'], true)) {
            $order = 'asc';
        }

        $areaPage = $this->buildKinerjaPerArea($sort, $order);

        return Inertia::render('dashboard', [
            'kpiNasional' => $this->buildKpiNasional(),
            'realisasiBudget' => $this->buildRealisasiBudget(),
            'kinerjaPerArea' => $areaPage['rows'],
            'areaFilters' => [
                'sort' => $sort,
                'order' => $order,
            ],
            'areaPagination' => $areaPage['pagination'],
        ]);
    }

    /**
     * Remark fungsi: hitung 5 KPI card atas (asumsi testing + data brandings).
     *
     * @return array{
     *     total_toko_asumsi: int,
     *     budget_tahun_juta: float,
     *     toko_terpasang: int,
     *     realisasi_pct: float,
     *     avg_cost_ratio_pct: float|null,
     *     target_cost_ratio_pct: float,
     *     avg_pencapaian_target_pct: float,
     *     butuh_peremajaan: int,
     *     lifetime_bulan: int,
     *     prospek: int,
     *     on_process: int
     * }
     */
    private function buildKpiNasional(): array
    {
        $cfg = config('bmd.dashboard', []);
        $totalAsumsi = (int) ($cfg['total_toko_asumsi'] ?? 250);
        $budgetJuta = (float) ($cfg['budget_tahun_juta'] ?? 1000);
        $targetRatio = (float) ($cfg['target_cost_ratio_pct'] ?? 1);
        $pencapaian = (float) ($cfg['avg_pencapaian_target_pct'] ?? 70.5);
        $lifetimeDefault = (int) ($cfg['lifetime_bulan_default'] ?? 36);
        $statusTerpasang = (string) ($cfg['status_terpasang'] ?? 'Penjadwalan Branding');

        // Remark: lifetime dari rata-rata katalog bila ada; fallback config
        $lifetimeAvg = KatalogItem::query()
            ->whereNotNull('lifetime')
            ->where('lifetime', '>', 0)
            ->avg('lifetime');
        $lifetimeBulan = $lifetimeAvg !== null
            ? (int) round((float) $lifetimeAvg)
            : $lifetimeDefault;
        if ($lifetimeBulan <= 0) {
            $lifetimeBulan = $lifetimeDefault;
        }

        $tokoTerpasang = Branding::query()
            ->where('status', $statusTerpasang)
            ->whereNotNull('customer_id')
            ->where('customer_id', '!=', '')
            ->distinct()
            ->count('customer_id');

        $realisasiPct = $totalAsumsi > 0
            ? round(($tokoTerpasang / $totalAsumsi) * 100, 1)
            : 0.0;

        // Remark: Avg Cost Ratio = rata-rata (cost/omzet*100) per branding valid
        $avgCostRatio = Branding::query()
            ->whereNotNull('total_cost')
            ->whereNotNull('average_omzet')
            ->where('average_omzet', '>', 0)
            ->selectRaw('AVG((total_cost / average_omzet) * 100) as ratio')
            ->value('ratio');
        $avgCostRatioPct = $avgCostRatio !== null ? round((float) $avgCostRatio, 1) : null;

        // Remark: Butuh Peremajaan — toko punya branding terpasang yang melewati lifetime
        $cutoff = Carbon::now()->subMonths($lifetimeBulan);
        $butuhPeremajaan = Branding::query()
            ->where('status', $statusTerpasang)
            ->whereNotNull('customer_id')
            ->where('customer_id', '!=', '')
            ->whereNotNull('installed_at')
            ->where('installed_at', '<=', $cutoff)
            ->distinct()
            ->count('customer_id');

        // Remark: On Process = toko masih dalam pipeline (bukan terpasang / cancel)
        $onProcess = Branding::query()
            ->whereNotNull('customer_id')
            ->where('customer_id', '!=', '')
            ->whereNotNull('status')
            ->where('status', '!=', '')
            ->where('status', '!=', $statusTerpasang)
            ->where('status', '!=', 'Cancel')
            ->distinct()
            ->count('customer_id');

        // Remark: Prospek = sisa toko belum terpasang (asumsi − terpasang)
        $prospek = max(0, $totalAsumsi - $tokoTerpasang);

        return [
            'total_toko_asumsi' => $totalAsumsi,
            'budget_tahun_juta' => $budgetJuta,
            'toko_terpasang' => $tokoTerpasang,
            'realisasi_pct' => $realisasiPct,
            'avg_cost_ratio_pct' => $avgCostRatioPct,
            'target_cost_ratio_pct' => $targetRatio,
            'avg_pencapaian_target_pct' => $pencapaian,
            'butuh_peremajaan' => $butuhPeremajaan,
            'lifetime_bulan' => $lifetimeBulan,
            'prospek' => $prospek,
            'on_process' => $onProcess,
        ];
    }

    /**
     * Remark fungsi: progress realisasi budget = terpakai / alokasi 1 tahun.
     *
     * @return array{
     *     budget_terpakai: float,
     *     budget_alokasi: float,
     *     realisasi_pct: float,
     *     bar_pct: float
     * }
     */
    private function buildRealisasiBudget(): array
    {
        $cfg = config('bmd.dashboard', []);
        $budgetJuta = (float) ($cfg['budget_tahun_juta'] ?? 1000);

        // Remark: alokasi tahunan (juta rupiah → rupiah)
        $budgetAlokasi = $budgetJuta * 1_000_000;

        // Remark: terpakai = Σ total_cost branding
        $budgetTerpakai = (float) Branding::query()->sum('total_cost');

        $realisasiPct = $budgetAlokasi > 0
            ? round(($budgetTerpakai / $budgetAlokasi) * 100, 1)
            : 0.0;

        // Remark: lebar bar dibatasi 100% (over-budget tetap terlihat di angka/%)
        $barPct = min(100.0, max(0.0, $realisasiPct));

        return [
            'budget_terpakai' => $budgetTerpakai,
            'budget_alokasi' => $budgetAlokasi,
            'realisasi_pct' => $realisasiPct,
            'bar_pct' => $barPct,
        ];
    }

    /**
     * Remark fungsi: tabel kinerja per area + sort + paginasi 10.
     *
     * @return array{
     *     rows: list<array{
     *         area: string,
     *         jumlah_toko_branding: int,
     *         avg_omzet: float|null,
     *         growth_omzet_pct: float|null,
     *         avg_cost_ratio_pct: float|null,
     *         avg_pencapaian_target_pct: float|null
     *     }>,
     *     pagination: array{
     *         current_page: int,
     *         last_page: int,
     *         per_page: int,
     *         total: int,
     *         from: int|null,
     *         to: int|null
     *     }
     * }
     */
    private function buildKinerjaPerArea(string $sort, string $order): array
    {
        $cfg = config('bmd.dashboard', []);
        $statusTerpasang = (string) ($cfg['status_terpasang'] ?? 'Penjadwalan Branding');
        $perPage = 10;

        $sortExpr = self::AREA_SORT_MAP[$sort];
        $orderDir = strtoupper($order);

        // Remark: growth/pencapaian belum ada formula → NULL agar kolom & sort tetap siap
        $query = Branding::query()
            ->selectRaw('UPPER(SUBSTR(customer_id, 1, 2)) as area')
            ->selectRaw(
                'COUNT(DISTINCT CASE WHEN status = ? THEN customer_id END) as jumlah_toko_branding',
                [$statusTerpasang],
            )
            ->selectRaw('AVG(average_omzet) as avg_omzet')
            ->selectRaw('CAST(NULL AS REAL) as growth_omzet_pct')
            ->selectRaw(
                'AVG(CASE
                    WHEN average_omzet IS NOT NULL AND average_omzet > 0 AND total_cost IS NOT NULL
                    THEN (total_cost / average_omzet) * 100
                    ELSE NULL
                END) as avg_cost_ratio',
            )
            ->selectRaw('CAST(NULL AS REAL) as avg_pencapaian_target_pct')
            ->whereNotNull('customer_id')
            ->where('customer_id', '!=', '')
            ->whereRaw('LENGTH(customer_id) >= 2')
            ->groupByRaw('UPPER(SUBSTR(customer_id, 1, 2))')
            ->orderByRaw("{$sortExpr} {$orderDir}")
            ->when($sort !== 'area', fn ($q) => $q->orderBy('area'));

        $paginator = $query->paginate($perPage)->withQueryString();

        $rows = $paginator->getCollection()->values()->map(function ($row) {
            return [
                'area' => (string) $row->area,
                'jumlah_toko_branding' => (int) $row->jumlah_toko_branding,
                'avg_omzet' => $row->avg_omzet !== null ? (float) $row->avg_omzet : null,
                'growth_omzet_pct' => $row->growth_omzet_pct !== null
                    ? (float) $row->growth_omzet_pct
                    : null,
                'avg_cost_ratio_pct' => $row->avg_cost_ratio !== null
                    ? round((float) $row->avg_cost_ratio, 1)
                    : null,
                'avg_pencapaian_target_pct' => $row->avg_pencapaian_target_pct !== null
                    ? (float) $row->avg_pencapaian_target_pct
                    : null,
            ];
        })->all();

        return [
            'rows' => $rows,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }
}
