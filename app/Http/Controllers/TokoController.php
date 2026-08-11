<?php

namespace App\Http\Controllers;

use App\Models\Branding;
use App\Models\BrandingStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * TokoController
 *
 * Remark kelas: daftar toko dari agregasi brandings (parity BMD2 toko.php).
 */
class TokoController extends Controller
{
    /**
     * Remark: whitelist kolom sort → ekspresi SQL (aman dari injection).
     *
     * @var array<string, string>
     */
    private const SORT_MAP = [
        'no' => 'customer_id',
        'customer_id' => 'customer_id',
        'nama' => 'nama_toko',
        'cabang' => 'cabang_sort',
        'avg_omzet' => 'avg_omzet',
        'total_cost' => 'total_cost',
        'branding_count' => 'branding_count',
        'status' => 'statuses',
    ];

    /** Remark: status dianggap toko selesai / branding terpasang (parity BMD2). */
    private const STATUS_TERPASANG = 'Penjadwalan Branding';

    /**
     * Remark fungsi: tampilkan tabel toko + filter + sort + KPI cards.
     */
    public function index(Request $request): Response
    {
        $cabangFilter = strtoupper(trim((string) $request->query('cabang', '')));
        if ($cabangFilter !== '' && ! preg_match('/^[A-Z0-9]{3}$/', $cabangFilter)) {
            $cabangFilter = '';
        }
        $statusFilter = trim((string) $request->query('status', ''));
        $search = trim((string) $request->query('q', ''));
        $sort = (string) $request->query('sort', 'cabang');
        $order = strtolower((string) $request->query('order', 'asc'));
        if (! isset(self::SORT_MAP[$sort])) {
            $sort = 'cabang';
        }
        if (! in_array($order, ['asc', 'desc'], true)) {
            $order = 'asc';
        }
        $perPage = 20;

        // Remark: whitelist status — prefer master branding_statuses, fallback distinct brandings
        $masterStatuses = BrandingStatus::query()
            ->activeOrdered()
            ->pluck('nama')
            ->all();
        $usedStatuses = Branding::query()
            ->whereNotNull('status')
            ->where('status', '!=', '')
            ->distinct()
            ->pluck('status')
            ->all();
        $allowedStatuses = $masterStatuses !== []
            ? array_values(array_unique(array_merge(
                $masterStatuses,
                array_diff($usedStatuses, $masterStatuses),
            )))
            : $usedStatuses;
        if ($statusFilter !== '' && ! in_array($statusFilter, $allowedStatuses, true)) {
            $statusFilter = '';
        }

        // Remark: customer_id yang masuk scope filter (tabel + KPI memakai set yang sama)
        $scopedCustomerIds = $this->scopedCustomerIds($cabangFilter, $statusFilter, $search);

        // Remark: agregasi per customer_id dari brandings (+ kolom bantu sort)
        $query = Branding::query()
            ->select([
                'customer_id',
                DB::raw('AVG(average_omzet) as avg_omzet'),
                DB::raw('COALESCE(SUM(total_cost), 0) as total_cost'),
                DB::raw('COUNT(*) as branding_count'),
                DB::raw('MAX(updated_at) as last_updated'),
                DB::raw('GROUP_CONCAT(DISTINCT status) as statuses'),
                DB::raw("MAX(CASE WHEN nama_toko IS NOT NULL AND nama_toko != '' THEN nama_toko END) as nama_toko"),
                DB::raw('UPPER(SUBSTR(customer_id, 1, 3)) as cabang_sort'),
            ])
            ->whereIn('customer_id', $scopedCustomerIds)
            ->groupBy('customer_id');

        // Remark: terapkan sort sesuai header yang diklik
        $sortExpr = self::SORT_MAP[$sort];
        $orderDir = strtoupper($order);
        $paginator = $query
            ->orderByRaw("{$sortExpr} {$orderDir}")
            ->when($sort !== 'customer_id' && $sort !== 'no', fn ($q) => $q->orderBy('customer_id'))
            ->paginate($perPage)
            ->withQueryString();

        $rows = $paginator->getCollection()->values()->map(function ($row, int $index) use ($paginator) {
            $customerId = (string) $row->customer_id;

            $statuses = collect(explode(',', (string) $row->statuses))
                ->map(fn (string $s) => trim($s))
                ->filter()
                ->unique()
                ->values()
                ->all();

            $nama = trim((string) ($row->nama_toko ?? ''));

            return [
                'no' => ($paginator->firstItem() ?? 1) + $index,
                'customer_id' => $customerId,
                'nama' => $nama !== '' ? $nama : null,
                'cabang' => Branding::cabangFromCustomerId($customerId),
                'avg_omzet' => $row->avg_omzet !== null ? (float) $row->avg_omzet : null,
                'total_cost' => $row->total_cost !== null ? (float) $row->total_cost : 0.0,
                'statuses' => $statuses,
                'branding_count' => (int) $row->branding_count,
            ];
        });

        // Remark: daftar cabang untuk filter dropdown
        $cabangList = Branding::query()
            ->selectRaw('UPPER(SUBSTR(customer_id, 1, 3)) as cabang')
            ->selectRaw('COUNT(DISTINCT customer_id) as toko_count')
            ->whereNotNull('customer_id')
            ->whereRaw('LENGTH(customer_id) >= 3')
            ->groupByRaw('UPPER(SUBSTR(customer_id, 1, 3))')
            ->orderBy('cabang')
            ->get();

        // Remark: daftar status branding untuk filter dropdown (urut master bila ada)
        $statusCounts = Branding::query()
            ->selectRaw('status')
            ->selectRaw('COUNT(DISTINCT customer_id) as toko_count')
            ->whereNotNull('status')
            ->where('status', '!=', '')
            ->whereNotNull('customer_id')
            ->whereRaw('LENGTH(customer_id) >= 3')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $statusList = collect($allowedStatuses)
            ->map(function (string $status) use ($statusCounts) {
                $row = $statusCounts->get($status);

                return [
                    'status' => $status,
                    'toko_count' => $row ? (int) $row->toko_count : 0,
                ];
            })
            ->filter(fn (array $row) => $row['toko_count'] > 0)
            ->values();

        return Inertia::render('toko/index', [
            'rows' => $rows,
            'filters' => [
                'cabang' => $cabangFilter,
                'status' => $statusFilter,
                'q' => $search,
                'sort' => $sort,
                'order' => $order,
            ],
            'cabangList' => $cabangList,
            'statusList' => $statusList,
            'kpi' => $this->buildKpi($scopedCustomerIds, $cabangFilter),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    /**
     * Remark fungsi: customer_id dalam scope filter aktif (cabang / status / search).
     *
     * @return \Illuminate\Support\Collection<int, string>
     */
    private function scopedCustomerIds(string $cabangFilter, string $statusFilter, string $search)
    {
        $query = $this->baseBrandingQuery();

        if ($cabangFilter !== '') {
            $query->whereRaw('UPPER(SUBSTR(customer_id, 1, 3)) = ?', [$cabangFilter]);
        }

        // Remark: filter status — toko yang punya minimal 1 branding berstatus tsb
        if ($statusFilter !== '') {
            $statusCustomerIds = Branding::query()
                ->where('status', $statusFilter)
                ->whereNotNull('customer_id')
                ->distinct()
                ->pluck('customer_id');
            $query->whereIn('customer_id', $statusCustomerIds);
        }

        if ($search !== '') {
            $like = '%'.$search.'%';
            $matchedIds = Branding::query()
                ->where(function ($q) use ($like) {
                    $q->where('customer_id', 'like', $like)
                        ->orWhere('nama_toko', 'like', $like)
                        ->orWhere('description', 'like', $like)
                        ->orWhere('status', 'like', $like);
                })
                ->distinct()
                ->pluck('customer_id');
            $query->whereIn('customer_id', $matchedIds);
        }

        return $query->distinct()->pluck('customer_id');
    }

    /**
     * Remark fungsi: hitung 4 KPI card dari set toko terfilter.
     *
     * @param  \Illuminate\Support\Collection<int, string>  $scopedCustomerIds
     * @return array{
     *     scope_label: string,
     *     toko_terbranding: int,
     *     total_toko: int,
     *     toko_terbranding_pct: float,
     *     total_cost: float,
     *     total_avg_omzet: float,
     *     cost_ratio_pct: float|null
     * }
     */
    private function buildKpi($scopedCustomerIds, string $cabangFilter): array
    {
        $scopeLabel = $cabangFilter !== '' ? $cabangFilter : 'Semua Cabang';

        if ($scopedCustomerIds->isEmpty()) {
            return [
                'scope_label' => $scopeLabel,
                'toko_terbranding' => 0,
                'total_toko' => 0,
                'toko_terbranding_pct' => 0.0,
                'total_cost' => 0.0,
                'total_avg_omzet' => 0.0,
                'cost_ratio_pct' => null,
            ];
        }

        $base = Branding::query()->whereIn('customer_id', $scopedCustomerIds);

        $totalToko = (clone $base)->distinct()->count('customer_id');

        // Remark: toko selesai branding = punya status Penjadwalan Branding
        $tokoTerbranding = (clone $base)
            ->where('status', self::STATUS_TERPASANG)
            ->distinct()
            ->count('customer_id');

        $sums = (clone $base)
            ->selectRaw('COALESCE(SUM(total_cost), 0) as total_cost')
            ->selectRaw('COALESCE(SUM(average_omzet), 0) as sum_omzet')
            ->first();

        $totalCost = (float) ($sums->total_cost ?? 0);
        $sumOmzet = (float) ($sums->sum_omzet ?? 0);
        $costRatioPct = $sumOmzet > 0 ? ($totalCost / $sumOmzet) * 100 : null;

        $terbrandingPct = $totalToko > 0
            ? round(($tokoTerbranding / $totalToko) * 100, 1)
            : 0.0;

        return [
            'scope_label' => $scopeLabel,
            'toko_terbranding' => $tokoTerbranding,
            'total_toko' => $totalToko,
            'toko_terbranding_pct' => $terbrandingPct,
            'total_cost' => $totalCost,
            'total_avg_omzet' => $sumOmzet,
            'cost_ratio_pct' => $costRatioPct !== null ? round($costRatioPct, 2) : null,
        ];
    }

    /**
     * Remark fungsi: query branding dasar (customer_id valid).
     */
    private function baseBrandingQuery(): Builder
    {
        return Branding::query()
            ->whereNotNull('customer_id')
            ->where('customer_id', '!=', '')
            ->whereRaw('LENGTH(customer_id) >= 3');
    }
}
