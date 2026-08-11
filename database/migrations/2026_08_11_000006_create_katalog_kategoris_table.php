<?php

use App\Models\KatalogItem;
use App\Models\KatalogKategori;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: katalog_kategoris
 *
 * Remark: master data kategori katalog (editable dari admin).
 */
return new class extends Migration
{
    /**
     * Remark fungsi: buat tabel master + seed dari kategori item existing.
     */
    public function up(): void
    {
        Schema::create('katalog_kategoris', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100)->unique();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Remark: populate dari distinct kategori di katalog_items
        $names = KatalogItem::query()
            ->whereNotNull('kategori')
            ->where('kategori', '!=', '')
            ->distinct()
            ->orderBy('kategori')
            ->pluck('kategori')
            ->values();

        foreach ($names as $index => $nama) {
            KatalogKategori::query()->create([
                'nama' => $nama,
                'sort_order' => $index + 1,
                'is_active' => true,
            ]);
        }

        // Remark: normalisasi satuan legacy "unit" → "Unit"
        DB::table('katalog_items')
            ->whereRaw('LOWER(satuan) = ?', ['unit'])
            ->update(['satuan' => 'Unit']);
    }

    /**
     * Remark fungsi: rollback tabel master kategori.
     */
    public function down(): void
    {
        Schema::dropIfExists('katalog_kategoris');
    }
};
