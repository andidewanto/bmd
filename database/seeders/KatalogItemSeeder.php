<?php

namespace Database\Seeders;

use App\Models\KatalogItem;
use App\Models\KatalogItemPhoto;
use App\Models\KatalogKategori;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

/**
 * KatalogItemSeeder
 *
 * Remark kelas: import item katalog dari database/data/katalog_items.json
 * (Katalog Branding Avian - Rev 3) + sync thumbnail foto & master kategori.
 */
class KatalogItemSeeder extends Seeder
{
    /**
     * Remark fungsi: seed / upsert seluruh item katalog + foto + kategori.
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
        $kodes = [];

        foreach ($items as $row) {
            $satuanRaw = mb_strtolower(trim((string) ($row['satuan'] ?? 'unit')));
            $satuanRaw = str_replace('²', '2', $satuanRaw);
            $satuan = $satuanRaw === 'm2' ? 'm2' : 'Unit';
            $foto = isset($row['foto']) && is_string($row['foto']) && $row['foto'] !== ''
                ? $row['foto']
                : null;

            $item = KatalogItem::query()->updateOrCreate(
                ['kode' => $row['kode']],
                [
                    'no' => $row['no'],
                    'kategori' => $row['kategori'],
                    'foto' => $foto,
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

            $kodes[] = (string) $row['kode'];
            $this->syncThumbnailPhoto($item, $foto);
        }

        // Remark: hapus item yang tidak ada di Rev 3 (hindari kode stale)
        if ($kodes !== []) {
            KatalogItem::query()->whereNotIn('kode', $kodes)->delete();
        }

        $this->syncKategoris($items);
    }

    /**
     * Remark fungsi: pastikan ada 1 foto thumbnail dari path Excel Rev 3.
     */
    protected function syncThumbnailPhoto(KatalogItem $item, ?string $foto): void
    {
        if ($foto === null) {
            return;
        }

        $existing = $item->photos()->where('path', $foto)->first();
        if ($existing) {
            $item->photos()->where('id', '!=', $existing->id)->update(['is_thumbnail' => false]);
            $existing->forceFill([
                'sort_order' => 0,
                'is_thumbnail' => true,
            ])->save();

            return;
        }

        // Remark: reimport Excel — ganti galeri seed lama dengan 1 foto sumber
        $item->photos()->delete();

        KatalogItemPhoto::query()->create([
            'katalog_item_id' => $item->id,
            'path' => $foto,
            'sort_order' => 0,
            'is_thumbnail' => true,
        ]);
    }

    /**
     * Remark fungsi: upsert master kategori dari daftar item (tambah yang belum ada).
     *
     * @param  list<array<string, mixed>>  $items
     */
    protected function syncKategoris(array $items): void
    {
        $knownKode = [
            'Booth' => 'B',
            'Cat Toko' => 'C',
            'Event' => 'E',
            'Printed Material' => 'P',
            'Rak' => 'R',
            'Signage' => 'S',
            'Tambahan' => 'T',
            'Pengecatan Toko' => 'PT',
        ];

        $names = collect($items)
            ->pluck('kategori')
            ->filter(fn ($n) => is_string($n) && trim($n) !== '')
            ->map(fn ($n) => trim((string) $n))
            ->unique()
            ->sort()
            ->values();

        foreach ($names as $index => $nama) {
            $kategori = KatalogKategori::query()->firstOrNew(['nama' => $nama]);
            $kategori->sort_order = $index + 1;
            $kategori->is_active = true;
            if ($kategori->kode === null || $kategori->kode === '') {
                $kategori->kode = $knownKode[$nama]
                    ?? mb_strtoupper(mb_substr($nama, 0, 1));
            }
            $kategori->save();
        }

        // Remark: nonaktifkan kategori master yang tidak dipakai Rev 3
        KatalogKategori::query()
            ->whereNotIn('nama', $names->all())
            ->update([
                'is_active' => false,
                'sort_order' => 999,
            ]);
    }
}
