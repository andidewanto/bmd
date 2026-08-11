<?php

namespace Database\Seeders;

use App\Models\Branding;
use App\Models\Toko;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

/**
 * BrandingSeeder
 *
 * Remark kelas: import brandings dari database/data/brandings.json (ekstrak BMD2),
 * lalu sync master tokos agar modul pengajuan/katalog punya data customer.
 */
class BrandingSeeder extends Seeder
{
    /**
     * Remark fungsi: seed brandings + upsert tokos turunan.
     */
    public function run(): void
    {
        $path = database_path('data/brandings.json');
        if (! File::exists($path)) {
            $this->command?->warn('brandings.json tidak ditemukan — skip BrandingSeeder.');

            return;
        }

        /** @var list<array<string, mixed>> $rows */
        $rows = json_decode(File::get($path), true, 512, JSON_THROW_ON_ERROR);

        foreach ($rows as $row) {
            Branding::query()->updateOrCreate(
                ['id' => $row['id']],
                [
                    'customer_id' => $row['customer_id'] ?? null,
                    'nama_toko' => $row['nama_toko'] ?? null,
                    'created_by' => $row['created_by'] ?? null,
                    'status' => $row['status'] ?? null,
                    'total_cost' => $row['total_cost'] ?? null,
                    'average_omzet' => $row['average_omzet'] ?? null,
                    'branding_type_id' => $row['branding_type_id'] ?? null,
                    'vendor_id' => $row['vendor_id'] ?? null,
                    'branding_design_team_id' => $row['branding_design_team_id'] ?? null,
                    'description' => $row['description'] ?? null,
                    'handled_by' => $row['handled_by'] ?? null,
                    'po_no' => $row['po_no'] ?? null,
                    'pb_no' => $row['pb_no'] ?? null,
                    'created_at' => $row['created_at'] ?? now(),
                    'updated_at' => $row['updated_at'] ?? now(),
                ],
            );
        }

        $this->syncTokosFromBrandings();
    }

    /**
     * Remark fungsi: bangun/update tabel tokos dari agregasi brandings.
     */
    protected function syncTokosFromBrandings(): void
    {
        $grouped = Branding::query()
            ->whereNotNull('customer_id')
            ->where('customer_id', '!=', '')
            ->orderByDesc('updated_at')
            ->get()
            ->groupBy('customer_id');

        foreach ($grouped as $customerId => $items) {
            $customerId = (string) $customerId;
            $avgOmzet = (float) $items->avg('average_omzet');

            // Remark: prioritas nama_toko resmi dari sample; fallback parse description
            $nama = null;
            foreach ($items as $item) {
                $candidate = trim((string) ($item->nama_toko ?? ''));
                if ($candidate !== '') {
                    $nama = $candidate;
                    break;
                }
            }
            if ($nama === null) {
                foreach ($items as $item) {
                    $nama = Branding::namaFromDescription($item->description);
                    if ($nama !== null) {
                        break;
                    }
                }
            }

            Toko::query()->updateOrCreate(
                ['customer_id' => $customerId],
                [
                    'nama' => $nama ?? ('Toko '.Branding::cabangFromCustomerId($customerId)),
                    'cabang' => Branding::cabangFromCustomerId($customerId),
                    'kota' => null,
                    'tipe_toko' => 'ALL',
                    'omzet_tahun_ini' => $avgOmzet,
                    'target_naik_dasar_pct' => 10,
                    'is_mock' => false,
                ],
            );
        }
    }
}
