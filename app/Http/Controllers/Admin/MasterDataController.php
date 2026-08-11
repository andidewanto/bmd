<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BrandingStatus;
use App\Models\KatalogKategori;
use Inertia\Inertia;
use Inertia\Response;

/**
 * MasterDataController
 *
 * Remark kelas: hub halaman admin master data BMD.
 */
class MasterDataController extends Controller
{
    /**
     * Remark fungsi: daftar master data yang tersedia.
     */
    public function index(): Response
    {
        return Inertia::render('admin/master/index', [
            'masters' => [
                [
                    'key' => 'status-branding',
                    'title' => 'Status Branding',
                    'description' => 'Master status proses branding (dari log change_status). Bisa diurutkan drag & drop.',
                    'href' => '/admin/master/status-branding',
                    'count' => BrandingStatus::query()->count(),
                ],
                [
                    'key' => 'kategori-katalog',
                    'title' => 'Kategori Katalog',
                    'description' => 'Master kategori item katalog untuk form admin & filter.',
                    'href' => '/admin/katalog/kategori',
                    'count' => KatalogKategori::query()->count(),
                ],
            ],
        ]);
    }
}
