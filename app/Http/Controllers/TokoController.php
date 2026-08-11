<?php

namespace App\Http\Controllers;

use App\Models\Branding;
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
        'cabang' => 'cabang_sort',
        'avg_omzet' => 'avg_omzet',
        'status' => 'statuses',
    ];

    /**
     * Remark fungsi: tampilkan tabel toko + filter + sort.
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

        // Remark: whitelist status dari DB agar filter tidak arbitrary string
        $allowedStatuses = Branding::query()
            ->whereNotNull('status')
            ->where('status', '!=', '')
            ->distinct()
            ->orderBy('status')
            ->pluck('status')
            ->all();
        if ($statusFilter !== '' && ! in_array($statusFilter, $allowedStatuses, true)) {
            $statusFilter = '';
        }

        // Remark: agregasi per customer_id dari brandings (+ kolom bantu sort)
        $query = Branding::query()
            ->select([
                'customer_id',
                DB::raw('AVG(average_omzet) as avg_omzet'),
                DB::raw('COUNT(*) as branding_count'),
                DB::raw('MAX(updated_at) as last_updated'),
                DB::raw('GROUP_CONCAT(DISTINCT status) as statuses'),
                DB::raw('UPPER(SUBSTR(customer_id, 1, 3)) as cabang_sort'),
            ])
            ->whereNotNull('customer_id')
            ->where('customer_id', '!=', '')
            ->whereRaw('LENGTH(customer_id) >= 3')
            ->groupBy('customer_id');

        if ($cabangFilter !== '') {
            $query->whereRaw('UPPER(SUBSTR(customer_id, 1, 3)) = ?', [$cabangFilter]);
        }

        // Remark: filter status — tampilkan toko yang punya minimal 1 branding berstatus tsb
        if ($statusFilter !== '') {
            $statusCustomerIds = Branding::query()
                ->where('status', $statusFilter)
                ->whereNotNull('customer_id')
                ->distinct()
                ->pluck('customer_id');
            $query->whereIn('customer_id', $statusCustomerIds);
        }

        // Remark: filter search via daftar customer_id dulu (aman untuk query GROUP BY)
        if ($search !== '') {
            $like = '%'.$search.'%';
            $matchedIds = Branding::query()
                ->where(function ($q) use ($like) {
                    $q->where('customer_id', 'like', $like)
                        ->orWhere('description', 'like', $like)
                        ->orWhere('status', 'like', $like);
                })
                ->distinct()
                ->pluck('customer_id');

            $query->whereIn('customer_id', $matchedIds);
        }

        // Remark: terapkan sort sesuai header yang diklik
        $sortExpr = self::SORT_MAP[$sort];
        $orderDir = strtoupper($order);
        $paginator = $query
            ->orderByRaw("{$sortExpr} {$orderDir}")
            ->when($sort !== 'customer_id' && $sort !== 'no', fn ($q) => $q->orderBy('customer_id'))
            ->paginate($perPage)
            ->withQueryString();

        // Remark: nama toko sengaja tidak ditampilkan — data description BMD2 belum valid
        $rows = $paginator->getCollection()->values()->map(function ($row, int $index) use ($paginator) {
            $customerId = (string) $row->customer_id;

            $statuses = collect(explode(',', (string) $row->statuses))
                ->map(fn (string $s) => trim($s))
                ->filter()
                ->unique()
                ->values()
                ->all();

            return [
                'no' => ($paginator->firstItem() ?? 1) + $index,
                'customer_id' => $customerId,
                'cabang' => Branding::cabangFromCustomerId($customerId),
                'avg_omzet' => $row->avg_omzet !== null ? (float) $row->avg_omzet : null,
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

        // Remark: daftar status branding untuk filter dropdown
        $statusList = Branding::query()
            ->selectRaw('status')
            ->selectRaw('COUNT(DISTINCT customer_id) as toko_count')
            ->whereNotNull('status')
            ->where('status', '!=', '')
            ->whereNotNull('customer_id')
            ->whereRaw('LENGTH(customer_id) >= 3')
            ->groupBy('status')
            ->orderBy('status')
            ->get();

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
}
