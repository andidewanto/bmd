<?php

namespace App\Http\Controllers;

use App\Models\KatalogItem;
use App\Models\Pengajuan;
use App\Models\Toko;
use App\Support\PengajuanRules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * PengajuanController
 *
 * Remark kelas: halaman cart pengajuan + submit ke database.
 */
class PengajuanController extends Controller
{
    /**
     * Remark fungsi: render halaman daftar pengajuan (cart client-side + meta toko/katalog).
     */
    public function index(Request $request): Response
    {
        $customerId = trim((string) $request->query('customer_id', ''));
        $toko = $this->resolveToko($customerId);

        // Remark: map katalog by id untuk kalkulasi harga & validasi di FE
        $katalogById = KatalogItem::query()
            ->orderBy('no')
            ->get()
            ->mapWithKeys(function (KatalogItem $item) {
                return [
                    $item->id => [
                        'id' => $item->id,
                        'kode' => $item->kode,
                        'kategori' => $item->kategori,
                        'foto' => $item->foto,
                        'foto_url' => $item->fotoUrl(),
                        'nama' => $item->nama_branding,
                        'satuan' => $item->satuan,
                        'dim_cm' => $item->dim_cm,
                        'harga_min' => $item->harga_min !== null ? (float) $item->harga_min : null,
                        'harga_max' => $item->harga_max !== null ? (float) $item->harga_max : null,
                        'is_m2' => $item->isM2(),
                    ],
                ];
            });

        return Inertia::render('pengajuan/index', [
            'toko' => $toko ? $this->mapToko($toko) : null,
            'tokoList' => Toko::query()->orderBy('nama')->get()->map(fn (Toko $t) => $this->mapToko($t))->values(),
            'katalog' => $katalogById,
            'storageKeys' => [
                'items' => config('bmd.pengajuan_storage_key'),
                'toko' => config('bmd.pengajuan_toko_storage_key'),
            ],
            'recent' => Pengajuan::query()
                ->with(['toko:id,customer_id,nama', 'items:id,pengajuan_id,kode,nama_branding,qty,subtotal'])
                ->latest()
                ->limit(5)
                ->get(),
        ]);
    }

    /**
     * Remark fungsi: simpan pengajuan dari cart FE ke MySQL (validasi aturan server-side).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'toko_id' => ['required', 'integer', 'exists:tokos,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.katalog_item_id' => ['required', 'integer', 'exists:katalog_items,id'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:999'],
            'items.*.panjang_cm' => ['nullable', 'numeric', 'min:0'],
            'items.*.lebar_cm' => ['nullable', 'numeric', 'min:0'],
        ]);

        $toko = Toko::query()->findOrFail($data['toko_id']);

        // Remark: hydrate cart dengan meta katalog untuk validasi aturan
        $cartForRules = [];
        $linePayload = [];
        $totalCost = 0.0;

        foreach ($data['items'] as $row) {
            $katalog = KatalogItem::query()->findOrFail($row['katalog_item_id']);
            $qty = (int) $row['qty'];
            $panjang = $row['panjang_cm'] ?? null;
            $lebar = $row['lebar_cm'] ?? null;

            $cartForRules[] = [
                'kode' => $katalog->kode,
                'satuan' => $katalog->satuan,
                'panjang_cm' => $panjang,
                'lebar_cm' => $lebar,
            ];

            $luas = null;
            $hargaSatuan = (float) ($katalog->harga_max ?? $katalog->harga_min ?? 0);
            $subtotal = $hargaSatuan * $qty;

            if ($katalog->isM2()) {
                $luas = PengajuanRules::calcAreaM2($panjang, $lebar);
                $priced = PengajuanRules::calcM2Price($panjang, $lebar, $katalog->harga_max);
                $hargaSatuan = (float) ($katalog->harga_max ?? 0);
                $subtotal = $priced !== null ? $priced * $qty : 0.0;
            }

            $totalCost += $subtotal;
            $linePayload[] = [
                'katalog_item_id' => $katalog->id,
                'kode' => $katalog->kode,
                'nama_branding' => $katalog->nama_branding,
                'qty' => $qty,
                'panjang_cm' => $panjang,
                'lebar_cm' => $lebar,
                'luas_m2' => $luas,
                'harga_satuan' => $hargaSatuan,
                'subtotal' => $subtotal,
            ];
        }

        $rules = PengajuanRules::validateCart($cartForRules, (string) $toko->tipe_toko);
        if (! $rules['ok']) {
            return back()->withErrors(['items' => $rules['message'] ?? 'Cart tidak valid.']);
        }

        // Remark: simpan header + detail dalam 1 transaksi
        $pengajuan = DB::transaction(function () use ($request, $toko, $data, $totalCost, $linePayload) {
            $header = Pengajuan::query()->create([
                'user_id' => $request->user()->id,
                'toko_id' => $toko->id,
                'status' => 'Pengajuan Branding Baru',
                'total_cost' => $totalCost,
                'omzet_tahun_ini' => $toko->omzet_tahun_ini,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($linePayload as $line) {
                $header->items()->create($line);
            }

            return $header;
        });

        return redirect()
            ->route('pengajuan.index')
            ->with('success', 'Pengajuan #'.$pengajuan->id.' berhasil diajukan.');
    }

    /**
     * Remark fungsi: resolve toko aktif.
     */
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
     * Remark fungsi: map toko ke array FE.
     *
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
