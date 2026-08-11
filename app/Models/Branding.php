<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model Branding
 *
 * Remark kelas: riwayat/pengajuan branding per customer (port mab_brandings).
 *
 * @property int $id
 * @property string|null $customer_id
 * @property string|null $nama_toko
 * @property string|null $status
 * @property string|null $total_cost
 * @property string|null $average_omzet
 * @property string|null $description
 */
class Branding extends Model
{
    public $incrementing = false;

    protected $keyType = 'int';

    /** @var list<string> */
    protected $fillable = [
        'id',
        'customer_id',
        'nama_toko',
        'created_by',
        'status',
        'total_cost',
        'average_omzet',
        'branding_type_id',
        'vendor_id',
        'branding_design_team_id',
        'description',
        'handled_by',
        'po_no',
        'pb_no',
        'created_at',
        'updated_at',
    ];

    /**
     * Remark fungsi: cast numerik.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_cost' => 'decimal:2',
            'average_omzet' => 'decimal:4',
            'branding_type_id' => 'integer',
            'vendor_id' => 'integer',
            'branding_design_team_id' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Remark fungsi: ekstrak nama toko dari baris pertama description (parity BMD2).
     */
    public static function namaFromDescription(?string $description): ?string
    {
        $desc = trim((string) $description);
        if ($desc === '') {
            return null;
        }

        $firstLine = preg_split('/\r\n|\r|\n/', $desc)[0] ?? '';
        $firstLine = trim((string) preg_replace('/^\d+\.\s*/', '', $firstLine));

        // Remark: potong di " - " agar lebih pendek (parity toko_nama_short)
        $parts = preg_split('/\s+-\s+/u', $firstLine, 2);
        $nama = trim((string) ($parts[0] ?? ''));

        return $nama !== '' ? $nama : null;
    }

    /**
     * Remark fungsi: cabang = 3 karakter pertama customer_id.
     */
    public static function cabangFromCustomerId(?string $customerId): string
    {
        $id = trim((string) $customerId);
        if (strlen($id) < 3) {
            return '—';
        }

        return strtoupper(substr($id, 0, 3));
    }
}
