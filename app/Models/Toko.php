<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model Toko
 *
 * Remark kelas: representasi toko/customer penerima branding.
 *
 * @property int $id
 * @property string $customer_id
 * @property string $nama
 * @property string|null $cabang
 * @property string|null $kota
 * @property string $tipe_toko
 * @property string $omzet_tahun_ini
 * @property string $target_naik_dasar_pct
 * @property bool $is_mock
 */
class Toko extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'customer_id',
        'nama',
        'cabang',
        'kota',
        'tipe_toko',
        'omzet_tahun_ini',
        'target_naik_dasar_pct',
        'is_mock',
    ];

    /**
     * Remark fungsi: cast kolom numerik & boolean.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'omzet_tahun_ini' => 'decimal:2',
            'target_naik_dasar_pct' => 'decimal:2',
            'is_mock' => 'boolean',
        ];
    }

    /**
     * Remark fungsi: relasi ke semua pengajuan milik toko.
     *
     * @return HasMany<Pengajuan, $this>
     */
    public function pengajuans(): HasMany
    {
        return $this->hasMany(Pengajuan::class);
    }
}
