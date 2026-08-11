<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: brandings.installed_at
 *
 * Remark: tanggal pemasangan branding (proxy item-level sampai detail item tersedia).
 * Dipakai KPI "Butuh Peremajaan" = installed_at + lifetime > sekarang.
 */
return new class extends Migration
{
    /** Remark: status dianggap sudah terpasang. */
    private const STATUS_TERPASANG = 'Penjadwalan Branding';

    /**
     * Remark fungsi: tambah kolom + isi sample untuk uji peremajaan.
     */
    public function up(): void
    {
        Schema::table('brandings', function (Blueprint $table) {
            $table->timestamp('installed_at')->nullable()->after('updated_at')->index();
        });

        // Remark: default pemasangan = created_at untuk branding terpasang
        DB::table('brandings')
            ->where('status', self::STATUS_TERPASANG)
            ->whereNull('installed_at')
            ->update(['installed_at' => DB::raw('created_at')]);

        // Remark: backdate sebagian sample agar KPI peremajaan tidak 0 saat testing
        $sampleIds = DB::table('brandings')
            ->where('status', self::STATUS_TERPASANG)
            ->orderBy('id')
            ->limit(12)
            ->pluck('id');

        if ($sampleIds->isNotEmpty()) {
            DB::table('brandings')
                ->whereIn('id', $sampleIds)
                ->update([
                    'installed_at' => now()->subMonths(40)->startOfDay(),
                ]);
        }
    }

    /**
     * Remark fungsi: rollback kolom installed_at.
     */
    public function down(): void
    {
        Schema::table('brandings', function (Blueprint $table) {
            $table->dropColumn('installed_at');
        });
    }
};
