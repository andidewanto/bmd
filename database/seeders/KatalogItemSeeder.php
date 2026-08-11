<?php

namespace Database\Seeders;

use App\Models\KatalogItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

/**
 * KatalogItemSeeder
 *
 * Remark kelas: import 31 item katalog dari database/data/katalog_items.json (ekstrak BMD2).
 */
class KatalogItemSeeder extends Seeder
{
    /**
     * Remark fungsi: seed / upsert seluruh item katalog.
     */
    public function run(): void
    {
        $path = database_path('data/katalog_items.json');
        if (! File::exists($path)) {
            $this->command?->warn('katalog_items.json tidak ditemukan — skip KatalogItemSeeder.');

            return;
        }

        /** @var list<array<string, mixed>> $items */
        $items = json_decode(File::get($path), true, 512, JSON_THROW_ON_ERROR);

        foreach ($items as $row) {
            $satuanRaw = mb_strtolower(trim((string) ($row['satuan'] ?? 'unit')));
            $satuanRaw = str_replace('²', '2', $satuanRaw);
            $satuan = $satuanRaw === 'm2' ? 'm2' : 'Unit';

            KatalogItem::query()->updateOrCreate(
                ['kode' => $row['kode']],
                [
                    'no' => $row['no'],
                    'kategori' => $row['kategori'],
                    'foto' => $row['foto'] ?? null,
                    'lifetime' => $row['lifetime'] ?? null,
                    'dim_cm' => $row['dim_cm'] ?? null,
                    'nama_branding' => $row['nama_branding'],
                    'spek_branding' => $row['spek_branding'] ?? null,
                    'satuan' => $satuan,
                    'tipe_toko' => $row['tipe_toko'] ?? null,
                    'harga_min' => $row['harga_min'] ?? null,
                    'harga_max' => $row['harga_max'] ?? null,
                ],
            );
        }
    }
}
