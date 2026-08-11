<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Model BrandingStatus
 *
 * Remark kelas: master status proses branding (dari change_status log).
 *
 * @property int $id
 * @property string $nama
 * @property int $sort_order
 * @property bool $is_active
 */
class BrandingStatus extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'nama',
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
     * Remark fungsi: scope status aktif, urut sort_order.
     *
     * @param  Builder<BrandingStatus>  $query
     * @return Builder<BrandingStatus>
     */
    public function scopeActiveOrdered(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('nama');
    }
}
