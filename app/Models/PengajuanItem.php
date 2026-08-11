<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model PengajuanItem
 *
 * Remark kelas: detail item branding di dalam satu pengajuan.
 *
 * @property int $id
 * @property int $pengajuan_id
 * @property int $katalog_item_id
 * @property string $kode
 * @property string $nama_branding
 * @property int $qty
 * @property string|null $panjang_cm
 * @property string|null $lebar_cm
 * @property string|null $luas_m2
 * @property string $harga_satuan
 * @property string $subtotal
 */
class PengajuanItem extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'pengajuan_id',
        'katalog_item_id',
        'kode',
        'nama_branding',
        'qty',
        'panjang_cm',
        'lebar_cm',
        'luas_m2',
        'harga_satuan',
        'subtotal',
    ];

    /**
     * Remark fungsi: cast numerik.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'panjang_cm' => 'decimal:2',
            'lebar_cm' => 'decimal:2',
            'luas_m2' => 'decimal:4',
            'harga_satuan' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    /**
     * Remark fungsi: header pengajuan induk.
     *
     * @return BelongsTo<Pengajuan, $this>
     */
    public function pengajuan(): BelongsTo
    {
        return $this->belongsTo(Pengajuan::class);
    }

    /**
     * Remark fungsi: referensi item katalog.
     *
     * @return BelongsTo<KatalogItem, $this>
     */
    public function katalogItem(): BelongsTo
    {
        return $this->belongsTo(KatalogItem::class);
    }
}
