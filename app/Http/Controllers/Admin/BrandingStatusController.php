<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branding;
use App\Models\BrandingStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * BrandingStatusController
 *
 * Remark kelas: admin CRUD + reorder master status branding.
 */
class BrandingStatusController extends Controller
{
    /**
     * Remark fungsi: daftar master status (urut sort_order).
     */
    public function index(): Response
    {
        $items = BrandingStatus::query()
            ->orderBy('sort_order')
            ->orderBy('nama')
            ->get()
            ->map(fn (BrandingStatus $row) => [
                'id' => $row->id,
                'nama' => $row->nama,
                'sort_order' => $row->sort_order,
                'is_active' => $row->is_active,
                'usage_count' => Branding::query()->where('status', $row->nama)->count(),
            ]);

        return Inertia::render('admin/master/status-branding', [
            'items' => $items,
        ]);
    }

    /**
     * Remark fungsi: tambah status baru.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:100', 'unique:branding_statuses,nama'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $sort = ((int) BrandingStatus::query()->max('sort_order')) + 1;

        BrandingStatus::query()->create([
            'nama' => trim($data['nama']),
            'sort_order' => $sort,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Status branding ditambahkan.');
    }

    /**
     * Remark fungsi: update nama / aktif.
     */
    public function update(Request $request, BrandingStatus $statusBranding): RedirectResponse
    {
        $data = $request->validate([
            'nama' => [
                'required',
                'string',
                'max:100',
                Rule::unique('branding_statuses', 'nama')->ignore($statusBranding->id),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $oldName = $statusBranding->nama;
        $newName = trim($data['nama']);

        DB::transaction(function () use ($statusBranding, $oldName, $newName, $request) {
            $statusBranding->update([
                'nama' => $newName,
                'is_active' => $request->has('is_active')
                    ? $request->boolean('is_active')
                    : $statusBranding->is_active,
            ]);

            // Remark: sync nama status ke brandings bila diganti
            if ($oldName !== $newName) {
                Branding::query()
                    ->where('status', $oldName)
                    ->update(['status' => $newName]);
            }
        });

        return back()->with('success', 'Status branding diperbarui.');
    }

    /**
     * Remark fungsi: simpan urutan baru dari drag & drop.
     */
    public function reorder(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['integer', 'distinct', 'exists:branding_statuses,id'],
        ]);

        DB::transaction(function () use ($data) {
            foreach (array_values($data['order']) as $index => $id) {
                BrandingStatus::query()
                    ->whereKey($id)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        return back()->with('success', 'Urutan status disimpan.');
    }

    /**
     * Remark fungsi: hapus status (ditolak bila masih dipakai branding).
     */
    public function destroy(BrandingStatus $statusBranding): RedirectResponse
    {
        $used = Branding::query()->where('status', $statusBranding->nama)->count();
        if ($used > 0) {
            return back()->with(
                'error',
                "Status \"{$statusBranding->nama}\" masih dipakai {$used} branding. Ubah dulu datanya."
            );
        }

        $statusBranding->delete();

        return back()->with('success', 'Status branding dihapus.');
    }
}
