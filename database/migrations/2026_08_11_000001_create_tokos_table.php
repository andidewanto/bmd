<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: tokos
 *
 * Remark: master toko/customer minimal untuk modul Pengajuan v1.
 * Modul Toko penuh menyusul — kolom ini cukup untuk ringkasan di halaman pengajuan.
 */
return new class extends Migration
{
    /**
     * Remark fungsi: buat tabel tokos.
     */
    public function up(): void
    {
        Schema::create('tokos', function (Blueprint $table) {
            $table->id();
            $table->string('customer_id', 50)->unique();
            $table->string('nama');
            $table->string('cabang', 10)->nullable();
            $table->string('kota', 100)->nullable();
            $table->string('tipe_toko', 20)->default('ALL'); // ALL | TRO | MTO
            $table->decimal('omzet_tahun_ini', 18, 2)->default(0);
            $table->decimal('target_naik_dasar_pct', 8, 2)->default(10);
            $table->boolean('is_mock')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Remark fungsi: rollback tabel tokos.
     */
    public function down(): void
    {
        Schema::dropIfExists('tokos');
    }
};
