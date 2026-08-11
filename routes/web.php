<?php

use App\Http\Controllers\Admin\BrandingStatusController;
use App\Http\Controllers\Admin\KatalogAdminController;
use App\Http\Controllers\Admin\KatalogKategoriController;
use App\Http\Controllers\Admin\MasterDataController;
use App\Http\Controllers\KatalogController;
use App\Http\Controllers\PengajuanController;
use App\Http\Controllers\TokoController;
use Illuminate\Support\Facades\Route;

/**
 * Remark file: web routes BMD.
 * Auth wajib (middleware auth + verified), kecuali login/register Fortify.
 */

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Remark: modul prioritas — Toko, Katalog, Pengajuan
    Route::get('/toko', [TokoController::class, 'index'])->name('toko.index');
    Route::get('/katalog', [KatalogController::class, 'index'])->name('katalog.index');
    Route::get('/pengajuan', [PengajuanController::class, 'index'])->name('pengajuan.index');
    Route::post('/pengajuan', [PengajuanController::class, 'store'])->name('pengajuan.store');

    // Remark: hub master data (status branding, kategori, …)
    Route::prefix('admin/master')->name('admin.master.')->group(function () {
        Route::get('/', [MasterDataController::class, 'index'])->name('index');

        Route::get('/status-branding', [BrandingStatusController::class, 'index'])->name('status.index');
        Route::post('/status-branding', [BrandingStatusController::class, 'store'])->name('status.store');
        Route::post('/status-branding/reorder', [BrandingStatusController::class, 'reorder'])->name('status.reorder');
        Route::put('/status-branding/{statusBranding}', [BrandingStatusController::class, 'update'])->name('status.update');
        Route::delete('/status-branding/{statusBranding}', [BrandingStatusController::class, 'destroy'])->name('status.destroy');
    });

    // Remark: admin katalog (CRUD + foto/thumbnail + master kategori)
    Route::prefix('admin/katalog')->name('admin.katalog.')->group(function () {
        Route::get('/', [KatalogAdminController::class, 'index'])->name('index');
        Route::get('/create', [KatalogAdminController::class, 'create'])->name('create');
        Route::post('/', [KatalogAdminController::class, 'store'])->name('store');

        // Remark: master kategori — didefinisikan sebelum {katalog} agar tidak bentrok
        Route::get('/kategori', [KatalogKategoriController::class, 'index'])->name('kategori.index');
        Route::post('/kategori', [KatalogKategoriController::class, 'store'])->name('kategori.store');
        Route::put('/kategori/{kategori}', [KatalogKategoriController::class, 'update'])->name('kategori.update');
        Route::delete('/kategori/{kategori}', [KatalogKategoriController::class, 'destroy'])->name('kategori.destroy');

        Route::get('/{katalog}/edit', [KatalogAdminController::class, 'edit'])->name('edit');
        Route::put('/{katalog}', [KatalogAdminController::class, 'update'])->name('update');
        Route::delete('/{katalog}', [KatalogAdminController::class, 'destroy'])->name('destroy');
        Route::post('/{katalog}/photos', [KatalogAdminController::class, 'storePhoto'])->name('photos.store');
        Route::post('/{katalog}/photos/{photo}/thumbnail', [KatalogAdminController::class, 'setThumbnail'])->name('photos.thumbnail');
        Route::delete('/{katalog}/photos/{photo}', [KatalogAdminController::class, 'destroyPhoto'])->name('photos.destroy');
    });
});

require __DIR__.'/settings.php';