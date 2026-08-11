<?php

use App\Models\KatalogItem;
use App\Models\KatalogItemPhoto;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: katalog_item_photos
 *
 * Remark: galeri foto per item katalog (thumbnail + foto tambahan untuk lightbox).
 */
return new class extends Migration
{
    /**
     * Remark fungsi: buat tabel foto + migrasi kolom foto lama sebagai thumbnail.
     */
    public function up(): void
    {
        Schema::create('katalog_item_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('katalog_item_id')->constrained('katalog_items')->cascadeOnDelete();
            $table->string('path');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_thumbnail')->default(false);
            $table->timestamps();

            $table->index(['katalog_item_id', 'sort_order']);
        });

        // Remark: seed awal dari kolom foto legacy
        KatalogItem::query()
            ->whereNotNull('foto')
            ->where('foto', '!=', '')
            ->each(function (KatalogItem $item) {
                KatalogItemPhoto::query()->create([
                    'katalog_item_id' => $item->id,
                    'path' => $item->foto,
                    'sort_order' => 0,
                    'is_thumbnail' => true,
                ]);
            });
    }

    /**
     * Remark fungsi: rollback tabel foto.
     */
    public function down(): void
    {
        Schema::dropIfExists('katalog_item_photos');
    }
};
