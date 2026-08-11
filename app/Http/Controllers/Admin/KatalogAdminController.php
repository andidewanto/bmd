<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KatalogItem;
use App\Models\KatalogItemPhoto;
use App\Models\KatalogKategori;
use App\Support\KatalogImageOptimizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * KatalogAdminController
 *
 * Remark kelas: CRUD admin item katalog + kelola galeri foto / thumbnail.
 */
class KatalogAdminController extends Controller
{
    /**
     * Remark fungsi: daftar semua item katalog untuk admin.
     */
    public function index(): Response
    {
        $items = KatalogItem::query()
            ->with('photos')
            ->orderBy('no')
            ->get()
            ->map(fn (KatalogItem $item) => $this->mapItem($item));

        return Inertia::render('admin/katalog/index', [
            'items' => $items,
        ]);
    }

    /**
     * Remark fungsi: form create item baru.
     */
    public function create(): Response
    {
        return Inertia::render('admin/katalog/form', [
            'item' => null,
            'kategoriOptions' => $this->kategoriOptions(),
            'satuanOptions' => ['Unit', 'm2'],
        ]);
    }

    /**
     * Remark fungsi: simpan item baru (+ foto awal opsional).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = collect($this->validated($request))->except('foto')->all();

        $item = DB::transaction(function () use ($request, $data) {
            $item = KatalogItem::query()->create($data);

            if ($request->hasFile('foto')) {
                $this->storeUploadedPhoto($item, $request->file('foto'), true);
            }

            return $item;
        });

        return redirect()
            ->route('admin.katalog.edit', $item)
            ->with('success', 'Item katalog dibuat.');
    }

    /**
     * Remark fungsi: form edit item + kelola foto.
     */
    public function edit(KatalogItem $katalog): Response
    {
        $katalog->load('photos');

        $options = $this->kategoriOptions();
        // Remark: jika kategori item nonaktif, tetap tampil di dropdown edit
        if ($katalog->kategori && ! in_array($katalog->kategori, $options, true)) {
            $options[] = $katalog->kategori;
            sort($options);
        }

        return Inertia::render('admin/katalog/form', [
            'item' => $this->mapItem($katalog),
            'kategoriOptions' => $options,
            'satuanOptions' => ['Unit', 'm2'],
        ]);
    }

    /**
     * Remark fungsi: update field item katalog.
     */
    public function update(Request $request, KatalogItem $katalog): RedirectResponse
    {
        $data = collect($this->validated($request, $katalog->id))->except('foto')->all();
        $katalog->update($data);

        return redirect()
            ->route('admin.katalog.edit', $katalog)
            ->with('success', 'Item katalog diperbarui.');
    }

    /**
     * Remark fungsi: hapus item katalog (+ file foto storage).
     */
    public function destroy(KatalogItem $katalog): RedirectResponse
    {
        foreach ($katalog->photos as $photo) {
            $this->deletePhotoFile($photo);
        }
        $katalog->delete();

        return redirect()
            ->route('admin.katalog.index')
            ->with('success', 'Item katalog dihapus.');
    }

    /**
     * Remark fungsi: upload foto tambahan ke galeri item (auto WebP).
     */
    public function storePhoto(Request $request, KatalogItem $katalog): RedirectResponse
    {
        $request->validate([
            'foto' => ['required_without:fotos', 'nullable', 'image', 'max:10240'],
            'fotos' => ['required_without:foto', 'nullable', 'array', 'max:12'],
            'fotos.*' => ['image', 'max:10240'],
            'as_thumbnail' => ['sometimes', 'boolean'],
        ]);

        $files = [];
        if ($request->hasFile('fotos')) {
            $files = array_values(array_filter($request->file('fotos') ?? []));
        } elseif ($request->hasFile('foto')) {
            $files = [$request->file('foto')];
        }

        if ($files === []) {
            return back()->with('error', 'Tidak ada foto yang diunggah.');
        }

        $asThumb = $request->boolean('as_thumbnail')
            || $katalog->photos()->count() === 0;

        foreach ($files as $index => $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }
            $this->storeUploadedPhoto($katalog, $file, $asThumb && $index === 0);
            $asThumb = false;
        }

        $count = count($files);

        return back()->with(
            'success',
            $count > 1
                ? "{$count} foto ditambahkan (WebP)."
                : 'Foto ditambahkan (WebP).'
        );
    }

    /**
     * Remark fungsi: set foto sebagai thumbnail kartu katalog.
     */
    public function setThumbnail(KatalogItem $katalog, KatalogItemPhoto $photo): RedirectResponse
    {
        abort_unless($photo->katalog_item_id === $katalog->id, 404);

        DB::transaction(function () use ($katalog, $photo) {
            $katalog->photos()->update(['is_thumbnail' => false]);
            $photo->update(['is_thumbnail' => true]);
            $katalog->syncThumbnailColumn();
        });

        return back()->with('success', 'Thumbnail diperbarui.');
    }

    /**
     * Remark fungsi: hapus satu foto dari galeri.
     */
    public function destroyPhoto(KatalogItem $katalog, KatalogItemPhoto $photo): RedirectResponse
    {
        abort_unless($photo->katalog_item_id === $katalog->id, 404);

        $wasThumb = $photo->is_thumbnail;
        $this->deletePhotoFile($photo);
        $photo->delete();

        if ($wasThumb) {
            $next = $katalog->photos()->orderBy('sort_order')->first();
            if ($next) {
                $next->update(['is_thumbnail' => true]);
            }
            $katalog->syncThumbnailColumn();
        }

        return back()->with('success', 'Foto dihapus.');
    }

    /**
     * Remark fungsi: validasi field item katalog.
     *
     * @return array<string, mixed>
     */
    protected function validated(Request $request, ?int $ignoreId = null): array
    {
        $uniqueKode = 'unique:katalog_items,kode';
        if ($ignoreId !== null) {
            $uniqueKode .= ','.$ignoreId;
        }

        return $request->validate([
            'no' => ['required', 'integer', 'min:1'],
            'kode' => ['required', 'string', 'max:20', $uniqueKode],
            'kategori' => [
                'required',
                'string',
                'max:100',
                Rule::exists('katalog_kategoris', 'nama'),
            ],
            'nama_branding' => ['required', 'string', 'max:255'],
            'spek_branding' => ['nullable', 'string'],
            'satuan' => ['required', Rule::in(['Unit', 'm2'])],
            'tipe_toko' => ['nullable', 'string', 'max:50'],
            'lifetime' => ['nullable', 'integer', 'min:0'],
            'dim_cm' => ['nullable', 'string', 'max:100'],
            'harga_min' => ['nullable', 'numeric', 'min:0'],
            'harga_max' => ['nullable', 'numeric', 'min:0'],
            'foto' => ['nullable', 'image', 'max:10240'],
        ]);
    }

    /**
     * Remark fungsi: simpan file upload sebagai WebP + record photo.
     */
    protected function storeUploadedPhoto(KatalogItem $item, UploadedFile $file, bool $asThumbnail): KatalogItemPhoto
    {
        try {
            $path = KatalogImageOptimizer::storeAsWebp($file, 'katalog/'.$item->id);
        } catch (\Throwable $e) {
            report($e);
            abort(422, 'Gagal mengoptimasi gambar ke WebP: '.$e->getMessage());
        }

        $sort = (int) $item->photos()->max('sort_order') + 1;

        if ($asThumbnail) {
            $item->photos()->update(['is_thumbnail' => false]);
        }

        $photo = $item->photos()->create([
            'path' => $path,
            'sort_order' => $sort,
            'is_thumbnail' => $asThumbnail,
        ]);

        if ($asThumbnail) {
            $item->syncThumbnailColumn();
        }

        return $photo;
    }

    /**
     * Remark fungsi: hapus file fisik bila di disk public (bukan assets legacy).
     */
    protected function deletePhotoFile(KatalogItemPhoto $photo): void
    {
        $path = $photo->path;
        if (str_starts_with($path, 'katalog/') && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Remark fungsi: opsi dropdown kategori dari master aktif.
     *
     * @return list<string>
     */
    protected function kategoriOptions(): array
    {
        return KatalogKategori::query()
            ->activeOrdered()
            ->pluck('nama')
            ->all();
    }

    /**
     * Remark fungsi: normalisasi satuan ke Unit | m2.
     */
    protected function normalizeSatuan(?string $satuan): string
    {
        $value = mb_strtolower(trim((string) $satuan));
        $value = str_replace('²', '2', $value);

        return $value === 'm2' ? 'm2' : 'Unit';
    }

    /**
     * @return array<string, mixed>
     */
    protected function mapItem(KatalogItem $item): array
    {
        $item->loadMissing('photos');

        return [
            'id' => $item->id,
            'no' => $item->no,
            'kode' => $item->kode,
            'kategori' => $item->kategori,
            'foto' => $item->foto,
            'foto_url' => $item->fotoUrl(),
            'lifetime' => $item->lifetime,
            'dim_cm' => $item->dim_cm,
            'nama_branding' => $item->nama_branding,
            'spek_branding' => $item->spek_branding,
            'satuan' => $this->normalizeSatuan($item->satuan),
            'tipe_toko' => $item->tipe_toko,
            'harga_min' => $item->harga_min !== null ? (float) $item->harga_min : null,
            'harga_max' => $item->harga_max !== null ? (float) $item->harga_max : null,
            'is_m2' => $item->isM2(),
            'photos' => $item->photos->map(fn (KatalogItemPhoto $p) => [
                'id' => $p->id,
                'url' => $p->url(),
                'path' => $p->path,
                'sort_order' => $p->sort_order,
                'is_thumbnail' => $p->is_thumbnail,
            ])->values(),
        ];
    }
}
