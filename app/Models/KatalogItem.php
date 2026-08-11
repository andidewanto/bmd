<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model KatalogItem
 *
 * Remark kelas: item katalog branding (Booth, Signage, Cat Toko, dll).
 *
 * @property int $id
 * @property int $no
 * @property string $kode
 * @property string $kategori
 * @property string|null $foto
 * @property int|null $lifetime
 * @property string|null $dim_cm
 * @property string $nama_branding
 * @property string|null $spek_branding
 * @property string|null $satuan
 * @property string|null $tipe_toko
 * @property string|null $harga_min
 * @property string|null $harga_max
 */
class KatalogItem extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'no',
        'kode',
        'kategori',
        'foto',
        'lifetime',
        'dim_cm',
        'nama_branding',
        'spek_branding',
        'satuan',
        'tipe_toko',
        'harga_min',
        'harga_max',
    ];

    /**
     * Remark fungsi: cast harga & lifetime.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'no' => 'integer',
            'lifetime' => 'integer',
            'harga_min' => 'decimal:2',
            'harga_max' => 'decimal:2',
        ];
    }

    /**
     * Remark fungsi: galeri foto item (urut sort_order).
     *
     * @return HasMany<KatalogItemPhoto, $this>
     */
    public function photos(): HasMany
    {
        return $this->hasMany(KatalogItemPhoto::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Remark fungsi: apakah item dihitung per m² (butuh dimensi tinggi×lebar).
     */
    public function isM2(): bool
    {
        $satuan = mb_strtolower(trim((string) $this->satuan));
        $satuan = str_replace('²', '2', $satuan);

        return $satuan === 'm2';
    }

    /**
     * Remark fungsi: URL thumbnail (foto is_thumbnail / kolom foto / placeholder).
     */
    public function fotoUrl(): string
    {
        $thumb = $this->relationLoaded('photos')
            ? $this->photos->firstWhere('is_thumbnail', true) ?? $this->photos->first()
            : $this->photos()->where('is_thumbnail', true)->first() ?? $this->photos()->first();

        if ($thumb) {
            return $thumb->url();
        }

        $foto = trim((string) $this->foto);
        if ($foto === '') {
            return '/assets/katalog/placeholder.svg';
        }

        if (str_starts_with($foto, 'assets/')) {
            return '/'.$foto;
        }

        if (str_starts_with($foto, '/')) {
            return $foto;
        }

        return '/'.$foto;
    }

    /**
     * Remark fungsi: sync kolom foto legacy dari thumbnail aktif.
     */
    public function syncThumbnailColumn(): void
    {
        $thumb = $this->photos()->where('is_thumbnail', true)->first()
            ?? $this->photos()->orderBy('sort_order')->first();

        $this->forceFill([
            'foto' => $thumb?->path,
        ])->save();
    }
}
