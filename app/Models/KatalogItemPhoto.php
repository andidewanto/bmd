<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * Model KatalogItemPhoto
 *
 * Remark kelas: satu foto dalam galeri item katalog.
 *
 * @property int $id
 * @property int $katalog_item_id
 * @property string $path
 * @property int $sort_order
 * @property bool $is_thumbnail
 */
class KatalogItemPhoto extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'katalog_item_id',
        'path',
        'sort_order',
        'is_thumbnail',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_thumbnail' => 'boolean',
        ];
    }

    /**
     * Remark fungsi: parent item katalog.
     *
     * @return BelongsTo<KatalogItem, $this>
     */
    public function katalogItem(): BelongsTo
    {
        return $this->belongsTo(KatalogItem::class);
    }

    /**
     * Remark fungsi: URL publik foto (storage atau path legacy assets/).
     */
    public function url(): string
    {
        $path = trim($this->path);
        if ($path === '') {
            return '/assets/katalog/placeholder.svg';
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        if (str_starts_with($path, 'assets/')) {
            return '/'.$path;
        }

        if (str_starts_with($path, '/')) {
            return $path;
        }

        // Remark: file di disk public (storage/app/public/...)
        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->url($path);
        }

        return '/'.$path;
    }
}
