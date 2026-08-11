<?php

use App\Models\BrandingStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: branding_statuses
 *
 * Remark: master status proses branding (unik dari mab_log_status_branding.change_status).
 * Urutan default mengikuti alur rata-rata di log BMD.
 */
return new class extends Migration
{
    /**
     * Remark: urutan proses default dari log status branding BMD.
     *
     * @var list<string>
     */
    private const DEFAULT_STATUSES = [
        'Pengajuan Branding Baru',
        'Pemilihan Tim Branding',
        'Pemilihan Vendor',
        'Update Data Aktual Branding',
        'Upload Quotation',
        'Upload Preview Branding',
        'Disetujui Toko',
        'Produksi Vendor',
        'Penjadwalan Branding',
        'Penginputan Nomor PO',
    ];

    /**
     * Remark fungsi: buat tabel master + seed status unik.
     */
    public function up(): void
    {
        Schema::create('branding_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100)->unique();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        foreach (self::DEFAULT_STATUSES as $index => $nama) {
            BrandingStatus::query()->create([
                'nama' => $nama,
                'sort_order' => $index + 1,
                'is_active' => true,
            ]);
        }
    }

    /**
     * Remark fungsi: rollback tabel master status branding.
     */
    public function down(): void
    {
        Schema::dropIfExists('branding_statuses');
    }
};
