<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KatalogItem;
use App\Models\KatalogKategori;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * KatalogKategoriController
 *
 * Remark kelas: admin CRUD master kategori katalog.
 */
class KatalogKategoriController extends Controller
{
    /**
     * Remark fungsi: daftar master kategori.
     */
    public function index(): Response
    {
        $items = KatalogKategori::query()
            ->orderBy('sort_order')
            ->orderBy('nama')
            ->get()
            ->map(fn (KatalogKategori $k) => [
                'id' => $k->id,
                'nama' => $k->nama,
                'sort_order' => $k->sort_order,
                'is_active' => $k->is_active,
                'item_count' => KatalogItem::query()->where('kategori', $k->nama)->count(),
            ]);

        return Inertia::render('admin/katalog-kategori/index', [
            'items' => $items,
        ]);
    }

    /**
     * Remark fungsi: tambah kategori baru.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:100', 'unique:katalog_kategoris,nama'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $sort = $data['sort_order'] ?? ((int) KatalogKategori::query()->max('sort_order') + 1);

        KatalogKategori::query()->create([
            'nama' => trim($data['nama']),
            'sort_order' => $sort,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Kategori ditambahkan.');
    }

    /**
     * Remark fungsi: update kategori (+ sync nama ke item katalog).
     */
    public function update(Request $request, KatalogKategori $kategori): RedirectResponse
    {
        $data = $request->validate([
            'nama' => [
                'required',
                'string',
                'max:100',
                Rule::unique('katalog_kategoris', 'nama')->ignore($kategori->id),
            ],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $oldName = $kategori->nama;
        $newName = trim($data['nama']);

        DB::transaction(function () use ($kategori, $data, $oldName, $newName, $request) {
            $kategori->update([
                'nama' => $newName,
                'sort_order' => $data['sort_order'] ?? $kategori->sort_order,
                'is_active' => $request->has('is_active')
                    ? $request->boolean('is_active')
                    : $kategori->is_active,
            ]);

            if ($oldName !== $newName) {
                KatalogItem::query()
                    ->where('kategori', $oldName)
                    ->update(['kategori' => $newName]);
            }
        });

        return back()->with('success', 'Kategori diperbarui.');
    }

    /**
     * Remark fungsi: hapus kategori (ditolak bila masih dipakai item).
     */
    public function destroy(KatalogKategori $kategori): RedirectResponse
    {
        $used = KatalogItem::query()->where('kategori', $kategori->nama)->count();
        if ($used > 0) {
            return back()->with(
                'error',
                "Kategori \"{$kategori->nama}\" masih dipakai {$used} item. Pindahkan dulu itemnya."
            );
        }

        $kategori->delete();

        return back()->with('success', 'Kategori dihapus.');
    }
}
