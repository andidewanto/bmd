<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model KatalogKategori
 *
 * Remark kelas: master data kategori item katalog.
 *
 * @property int $id
 * @property string $nama
 * @property string $kode
 * @property int $sort_order
 * @property bool $is_active
 */
class KatalogKategori extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'nama',
        'kode',
        'sort_order',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Remark fungsi: item katalog yang memakai nama kategori ini.
     *
     * @return HasMany<KatalogItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(KatalogItem::class, 'kategori', 'nama');
    }

    /**
     * Remark fungsi: scope kategori aktif, urut sort_order.
     *
     * @param  Builder<KatalogKategori>  $query
     * @return Builder<KatalogKategori>
     */
    public function scopeActiveOrdered(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('nama');
    }
}
