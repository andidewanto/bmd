<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: brandings.nama_toko
 *
 * Remark: kolom nama toko resmi dari sample branding (bukan parse description).
 */
return new class extends Migration
{
    /**
     * Remark fungsi: tambah kolom nama_toko.
     */
    public function up(): void
    {
        Schema::table('brandings', function (Blueprint $table) {
            $table->string('nama_toko', 255)->nullable()->after('customer_id');
        });
    }

    /**
     * Remark fungsi: rollback kolom nama_toko.
     */
    public function down(): void
    {
        Schema::table('brandings', function (Blueprint $table) {
            $table->dropColumn('nama_toko');
        });
    }
};
