<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: katalog_items
 *
 * Remark: katalog branding (port dari mab_katalog_items BMD2).
 */
return new class extends Migration
{
    /**
     * Remark fungsi: buat tabel katalog_items.
     */
    public function up(): void
    {
        Schema::create('katalog_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('no')->index();
            $table->string('kode', 20)->unique();
            $table->string('kategori', 100)->index();
            $table->string('foto')->nullable();
            $table->unsignedInteger('lifetime')->nullable()->comment('bulan');
            $table->string('dim_cm', 100)->nullable();
            $table->string('nama_branding');
            $table->text('spek_branding')->nullable();
            $table->string('satuan', 50)->nullable();
            $table->string('tipe_toko', 50)->nullable()->comment('ALL / TRO / MTO');
            $table->decimal('harga_min', 18, 2)->nullable();
            $table->decimal('harga_max', 18, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Remark fungsi: rollback tabel katalog_items.
     */
    public function down(): void
    {
        Schema::dropIfExists('katalog_items');
    }
};
