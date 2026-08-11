<?php

namespace Database\Seeders;

use App\Models\Toko;
use Illuminate\Database\Seeder;

/**
 * TokoSeeder
 *
 * Remark kelas: seed toko mock (parity BMD2 pengajuan.php) untuk development.
 */
class TokoSeeder extends Seeder
{
    /**
     * Remark fungsi: isi tabel tokos dengan 3 toko demo.
     */
    public function run(): void
    {
        $rows = [
            [
                'customer_id' => '16D01010051',
                'nama' => 'Toko Sumber Bumi Cabang Sidoarjo',
                'cabang' => '16D',
                'kota' => 'Sidoarjo',
                'tipe_toko' => 'ALL',
                'omzet_tahun_ini' => 76080482.06,
                'target_naik_dasar_pct' => 10.0,
                'is_mock' => true,
            ],
            [
                'customer_id' => '13Q03010002',
                'nama' => 'Toko Mitra Warna Cabang Malang',
                'cabang' => '13Q',
                'kota' => 'Malang',
                'tipe_toko' => 'ALL',
                'omzet_tahun_ini' => 115841139.64,
                'target_naik_dasar_pct' => 10.0,
                'is_mock' => true,
            ],
            [
                'customer_id' => '30B02010013',
                'nama' => 'Mitra Bangunan Cabang Tobelo',
                'cabang' => '30B',
                'kota' => 'Tobelo',
                'tipe_toko' => 'TRO',
                'omzet_tahun_ini' => 148009575.79,
                'target_naik_dasar_pct' => 8.0,
                'is_mock' => true,
            ],
        ];

        foreach ($rows as $row) {
            Toko::query()->updateOrCreate(
                ['customer_id' => $row['customer_id']],
                $row,
            );
        }
    }
}
