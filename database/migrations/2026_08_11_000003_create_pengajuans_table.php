<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: pengajuans + pengajuan_items
 *
 * Remark: header & detail pengajuan branding yang di-submit dari UI cart.
 */
return new class extends Migration
{
    /**
     * Remark fungsi: buat tabel pengajuans dan pengajuan_items.
     */
    public function up(): void
    {
        Schema::create('pengajuans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('toko_id')->constrained('tokos')->cascadeOnDelete();
            $table->string('status', 100)->default('Pengajuan Branding Baru');
            $table->decimal('total_cost', 18, 2)->default(0);
            $table->decimal('omzet_tahun_ini', 18, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('pengajuan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengajuan_id')->constrained('pengajuans')->cascadeOnDelete();
            $table->foreignId('katalog_item_id')->constrained('katalog_items')->restrictOnDelete();
            $table->string('kode', 20);
            $table->string('nama_branding');
            $table->unsignedInteger('qty')->default(1);
            $table->decimal('panjang_cm', 12, 2)->nullable();
            $table->decimal('lebar_cm', 12, 2)->nullable();
            $table->decimal('luas_m2', 12, 4)->nullable();
            $table->decimal('harga_satuan', 18, 2)->default(0);
            $table->decimal('subtotal', 18, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Remark fungsi: rollback tabel pengajuan.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengajuan_items');
        Schema::dropIfExists('pengajuans');
    }
};
