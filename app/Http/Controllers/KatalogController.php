<?php

namespace App\Http\Controllers;

use App\Models\KatalogItem;
use App\Models\KatalogItemPhoto;
use App\Models\Toko;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * KatalogController
 *
 * Remark kelas: halaman katalog branding (user) + data untuk lightbox.
 */
class KatalogController extends Controller
{
    /**
     * Remark fungsi: tampilkan daftar katalog + filter kategori/search + toko aktif.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('q', ''));
        $kategori = trim((string) $request->query('kategori', ''));
        $customerId = trim((string) $request->query('customer_id', ''));

        $query = KatalogItem::query()->with('photos')->orderBy('no');

        if ($kategori !== '') {
            $query->where('kategori', $kategori);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                    ->orWhere('nama_branding', 'like', "%{$search}%")
                    ->orWhere('spek_branding', 'like', "%{$search}%");
            });
        }

        $items = $query->get()->map(fn (KatalogItem $item) => $this->mapItem($item))->values();

        $kategoriList = KatalogItem::query()
            ->selectRaw('kategori, COUNT(*) as item_count')
            ->groupBy('kategori')
            ->orderBy('kategori')
            ->get();

        $toko = $this->resolveToko($customerId);

        return Inertia::render('katalog/index', [
            'items' => $items,
            'filters' => [
                'q' => $search,
                'kategori' => $kategori,
                'customer_id' => $toko?->customer_id,
            ],
            'stats' => [
                'total_items' => KatalogItem::query()->count(),
                'total_kategori' => KatalogItem::query()->distinct('kategori')->count('kategori'),
                'filter_label' => $kategori !== '' ? $kategori : 'Semua kategori',
            ],
            'kategoriList' => $kategoriList,
            'toko' => $toko ? $this->mapToko($toko) : null,
            'storageKeys' => [
                'items' => config('bmd.pengajuan_storage_key'),
                'toko' => config('bmd.pengajuan_toko_storage_key'),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function mapItem(KatalogItem $item): array
    {
        $item->loadMissing('photos');

        $photos = $item->photos->map(fn (KatalogItemPhoto $p) => [
            'id' => $p->id,
            'url' => $p->url(),
            'is_thumbnail' => $p->is_thumbnail,
        ])->values();

        // Remark: pastikan minimal ada 1 foto (thumbnail/legacy) untuk lightbox
        if ($photos->isEmpty()) {
            $photos = collect([[
                'id' => 0,
                'url' => $item->fotoUrl(),
                'is_thumbnail' => true,
            ]]);
        }

        return [
            'id' => $item->id,
            'no' => $item->no,
            'kode' => $item->kode,
            'kategori' => $item->kategori,
            'foto' => $item->foto,
            'foto_url' => $item->fotoUrl(),
            'lifetime' => $item->lifetime,
            'dim_cm' => $item->dim_cm,
            'nama_branding' => $item->nama_branding,
            'spek_branding' => $item->spek_branding,
            'satuan' => $item->satuan,
            'tipe_toko' => $item->tipe_toko,
            'harga_min' => $item->harga_min !== null ? (float) $item->harga_min : null,
            'harga_max' => $item->harga_max !== null ? (float) $item->harga_max : null,
            'is_m2' => $item->isM2(),
            'photos' => $photos,
        ];
    }

    protected function resolveToko(string $customerId): ?Toko
    {
        if ($customerId !== '') {
            $found = Toko::query()->where('customer_id', $customerId)->first();
            if ($found) {
                return $found;
            }
        }

        return Toko::query()->orderBy('id')->first();
    }

    /**
     * @return array<string, mixed>
     */
    protected function mapToko(Toko $toko): array
    {
        return [
            'id' => $toko->id,
            'customer_id' => $toko->customer_id,
            'nama' => $toko->nama,
            'cabang' => $toko->cabang,
            'kota' => $toko->kota,
            'tipe_toko' => $toko->tipe_toko,
            'omzet_tahun_ini' => (float) $toko->omzet_tahun_ini,
            'target_naik_dasar_pct' => (float) $toko->target_naik_dasar_pct,
            'is_mock' => (bool) $toko->is_mock,
        ];
    }
}
