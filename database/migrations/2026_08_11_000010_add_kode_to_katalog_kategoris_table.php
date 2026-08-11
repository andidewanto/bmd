<?php

use App\Models\KatalogKategori;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: add kode huruf ke katalog_kategoris
 *
 * Remark: dipakai sebagai prefix pengkodean item katalog (B01, C02, …).
 */
return new class extends Migration
{
    /**
     * Remark fungsi: tambah kolom kode + backfill dari nama / peta Rev3.
     */
    public function up(): void
    {
        Schema::table('katalog_kategoris', function (Blueprint $table) {
            $table->string('kode', 5)->nullable()->after('nama');
        });

        // Remark: peta resmi kategori Rev3 → huruf kode item
        $known = [
            'Booth' => 'B',
            'Cat Toko' => 'C',
            'Event' => 'E',
            'Printed Material' => 'P',
            'Rak' => 'R',
            'Signage' => 'S',
            'Tambahan' => 'T',
            // Remark: alias lama nonaktif — bedakan dari Printed Material (P) & Cat Toko (C)
            'Pengecatan Toko' => 'PT',
        ];

        $used = [];
        KatalogKategori::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->each(function (KatalogKategori $kategori) use ($known, &$used) {
                $nama = trim((string) $kategori->nama);
                $kode = $known[$nama] ?? mb_strtoupper(mb_substr($nama, 0, 1));
                if ($kode === '') {
                    $kode = 'X';
                }

                $candidate = $kode;
                $n = 2;
                while (in_array($candidate, $used, true)) {
                    $candidate = $kode.$n;
                    $n++;
                }
                $used[] = $candidate;

                $kategori->forceFill(['kode' => $candidate])->save();
            });

        Schema::table('katalog_kategoris', function (Blueprint $table) {
            $table->unique('kode');
        });
    }

    /**
     * Remark fungsi: rollback kolom kode.
     */
    public function down(): void
    {
        Schema::table('katalog_kategoris', function (Blueprint $table) {
            $table->dropUnique(['kode']);
            $table->dropColumn('kode');
        });
    }
};
