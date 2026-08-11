<?php

/**
 * Konfigurasi domain BMD (Branding Monitoring Dashboard).
 *
 * Remark: semua flag khusus BMD dikumpulkan di sini agar mudah ditemukan
 * programmer lain tanpa mengotak-atik config Laravel inti.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Dev Auth Bypass
    |--------------------------------------------------------------------------
    |
    | Remark fungsi: jika true (hanya efektif saat APP_ENV=local), middleware
    | DevAuthBypass akan auto-login user demo sehingga fitur auth bisa dilewati
    | saat development lokal.
    |
    */
    'auth_bypass' => (bool) env('BMD_AUTH_BYPASS', false),

    /*
    |--------------------------------------------------------------------------
    | Dev Bypass User
    |--------------------------------------------------------------------------
    |
    | Remark fungsi: email user yang dipakai auto-login saat auth bypass aktif.
    | User akan dibuat otomatis oleh seeder / middleware jika belum ada.
    |
    */
    'auth_bypass_email' => env('BMD_AUTH_BYPASS_EMAIL', 'dev@bmd.local'),

    'auth_bypass_name' => env('BMD_AUTH_BYPASS_NAME', 'BMD Dev'),

    /*
    |--------------------------------------------------------------------------
    | Storage key (frontend cart)
    |--------------------------------------------------------------------------
    |
    | Remark fungsi: key sessionStorage untuk cart pengajuan & toko aktif.
    | Disimpan di config agar FE/BE tetap sinkron jika diganti.
    |
    */
    'pengajuan_storage_key' => 'bmd_pengajuan_items',

    'pengajuan_toko_storage_key' => 'bmd_pengajuan_toko',

    /*
    |--------------------------------------------------------------------------
    | Dashboard — asumsi nasional (testing)
    |--------------------------------------------------------------------------
    |
    | Remark: angka asumsi sampai master target/budget resmi tersedia.
    | total_toko_asumsi = denominator kartu Total Toko Branding & Prospek.
    | budget_tahun_juta = total budget tahunan dalam juta rupiah (1000 = Rp 1 M).
    |
    */
    'dashboard' => [
        'total_toko_asumsi' => (int) env('BMD_TOTAL_TOKO_ASUMSI', 250),
        'budget_tahun_juta' => (float) env('BMD_BUDGET_TAHUN_JUTA', 1000),
        'target_cost_ratio_pct' => (float) env('BMD_TARGET_COST_RATIO_PCT', 1),
        'avg_pencapaian_target_pct' => (float) env('BMD_AVG_PENCAPAIAN_TARGET_PCT', 70.5),
        'lifetime_bulan_default' => (int) env('BMD_LIFETIME_BULAN_DEFAULT', 36),
        'status_terpasang' => 'Penjadwalan Branding',
    ],

];
