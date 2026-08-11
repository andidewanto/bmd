<?php

namespace App\Support;

/**
 * PengajuanRules
 *
 * Remark kelas: port server-side dari BMD2 `js/pengajuan-rules.js`.
 * Dipakai saat submit pengajuan agar aturan tidak hanya di browser.
 */
class PengajuanRules
{
    /**
     * Remark fungsi: normalisasi kode item (trim + uppercase).
     */
    public static function normalizeKode(?string $kode): string
    {
        return strtoupper(trim((string) $kode));
    }

    /**
     * Remark fungsi: cek apakah kode termasuk family Booth (B…).
     */
    public static function isBKode(?string $kode): bool
    {
        return (bool) preg_match('/^B\d/', self::normalizeKode($kode));
    }

    /**
     * Remark fungsi: normalisasi satuan (m² → m2).
     */
    public static function normalizeSatuan(?string $satuan): string
    {
        $value = mb_strtolower(trim((string) $satuan));

        return str_replace('²', '2', $value);
    }

    /**
     * Remark fungsi: apakah satuan m².
     */
    public static function isM2Satuan(?string $satuan): bool
    {
        return self::normalizeSatuan($satuan) === 'm2';
    }

    /**
     * Remark fungsi: hitung luas m² dari tinggi & lebar (cm).
     */
    public static function calcAreaM2(float|int|string|null $panjangCm, float|int|string|null $lebarCm): ?float
    {
        $p = (float) $panjangCm;
        $l = (float) $lebarCm;
        if (! ($p > 0 && $l > 0)) {
            return null;
        }

        return ($p * $l) / 10000;
    }

    /**
     * Remark fungsi: biaya branding m² = luas × harga_max.
     */
    public static function calcM2Price(
        float|int|string|null $panjangCm,
        float|int|string|null $lebarCm,
        float|int|string|null $hargaMax,
    ): ?float {
        $area = self::calcAreaM2($panjangCm, $lebarCm);
        $max = (float) $hargaMax;
        if ($area === null || ! ($max > 0)) {
            return null;
        }

        return $area * $max;
    }

    /**
     * Remark fungsi: validasi dimensi m² (tinggi & lebar > 0).
     *
     * @return array{ok: bool, message?: string}
     */
    public static function validateDimensions(float|int|string|null $panjangCm, float|int|string|null $lebarCm): array
    {
        if (! ((float) $panjangCm > 0)) {
            return ['ok' => false, 'message' => 'Tinggi (cm) harus diisi dan lebih dari 0.'];
        }
        if (! ((float) $lebarCm > 0)) {
            return ['ok' => false, 'message' => 'Lebar (cm) harus diisi dan lebih dari 0.'];
        }

        return ['ok' => true];
    }

    /**
     * Remark fungsi: ambil nomor urut dari kode B (B01 → 1).
     */
    public static function bNumber(?string $kode): ?int
    {
        if (preg_match('/^B(\d+)/', self::normalizeKode($kode), $m)) {
            return (int) $m[1];
        }

        return null;
    }

    /**
     * Remark fungsi: validasi penambahan 1 kode ke cart (aturan family B).
     *
     * @param  list<array{kode?: string}>  $cart
     * @return array{ok: bool, message?: string}
     */
    public static function validateAddBranding(string $kode, array $cart, string $tokoTipe = 'ALL'): array
    {
        $kode = self::normalizeKode($kode);
        $tokoTipe = self::normalizeKode($tokoTipe);
        $codes = array_values(array_filter(array_map(
            fn (array $row) => self::normalizeKode($row['kode'] ?? ''),
            $cart,
        )));

        if (! self::isBKode($kode)) {
            return ['ok' => true];
        }

        // Aturan 1: setiap kode B hanya sekali
        if (in_array($kode, $codes, true)) {
            return [
                'ok' => false,
                'message' => $kode.' sudah ada di daftar pengajuan. Branding kode B hanya boleh ditambahkan 1 kali.',
            ];
        }

        $hasB02 = in_array('B02', $codes, true);
        $otherBCodes = array_values(array_filter(
            $codes,
            fn (string $c) => self::isBKode($c) && $c !== 'B02',
        ));

        // Aturan 2: B02 hanya TRO & eksklusif terhadap B lain
        if ($kode === 'B02') {
            if ($tokoTipe !== 'TRO') {
                return [
                    'ok' => false,
                    'message' => 'B02 (Backdrop Mesin Tinting) hanya boleh ditambahkan untuk toko dengan kode TRO.',
                ];
            }
            if ($otherBCodes !== []) {
                return [
                    'ok' => false,
                    'message' => 'Tidak boleh menambahkan B02 jika sudah ada branding kode B lainnya.',
                ];
            }
        } elseif (self::isBKode($kode) && $hasB02) {
            return [
                'ok' => false,
                'message' => 'Sudah ada B02 di pengajuan. Tidak boleh menambahkan branding kode B lainnya.',
            ];
        }

        // Aturan 3: B03+ butuh B01
        $num = self::bNumber($kode);
        if ($num !== null && $num >= 3 && ! in_array('B01', $codes, true)) {
            return [
                'ok' => false,
                'message' => $kode.' hanya boleh ditambahkan setelah B01 (Booth Tinting) ada di daftar pengajuan.',
            ];
        }

        return ['ok' => true];
    }

    /**
     * Remark fungsi: validasi seluruh cart sebelum submit.
     *
     * @param  list<array{kode?: string, panjang_cm?: mixed, lebar_cm?: mixed, satuan?: string}>  $cart
     * @return array{ok: bool, message?: string}
     */
    public static function validateCart(array $cart, string $tokoTipe = 'ALL'): array
    {
        $prior = [];
        foreach ($cart as $row) {
            $check = self::validateAddBranding((string) ($row['kode'] ?? ''), $prior, $tokoTipe);
            if (! $check['ok']) {
                return $check;
            }
            $prior[] = $row;

            if (self::isM2Satuan($row['satuan'] ?? null)) {
                $dim = self::validateDimensions($row['panjang_cm'] ?? null, $row['lebar_cm'] ?? null);
                if (! $dim['ok']) {
                    $kode = self::normalizeKode($row['kode'] ?? '');

                    return [
                        'ok' => false,
                        'message' => ($kode !== '' ? $kode.': ' : '').($dim['message'] ?? 'Dimensi tidak valid.'),
                    ];
                }
            }
        }

        return ['ok' => true];
    }
}
