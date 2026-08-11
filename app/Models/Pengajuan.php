<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model Pengajuan
 *
 * Remark kelas: header pengajuan branding yang sudah di-submit.
 *
 * @property int $id
 * @property int $user_id
 * @property int $toko_id
 * @property string $status
 * @property string $total_cost
 * @property string $omzet_tahun_ini
 * @property string|null $notes
 */
class Pengajuan extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'toko_id',
        'status',
        'total_cost',
        'omzet_tahun_ini',
        'notes',
    ];

    /**
     * Remark fungsi: cast decimal.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_cost' => 'decimal:2',
            'omzet_tahun_ini' => 'decimal:2',
        ];
    }

    /**
     * Remark fungsi: user yang mengajukan.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Remark fungsi: toko penerima branding.
     *
     * @return BelongsTo<Toko, $this>
     */
    public function toko(): BelongsTo
    {
        return $this->belongsTo(Toko::class);
    }

    /**
     * Remark fungsi: baris item dalam pengajuan.
     *
     * @return HasMany<PengajuanItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PengajuanItem::class);
    }
}
