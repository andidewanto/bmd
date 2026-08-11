<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * KatalogImageOptimizer
 *
 * Remark kelas: kompres & konversi upload gambar katalog ke WebP.
 */
class KatalogImageOptimizer
{
    /** Remark: lebar/tinggi maksimal sisi panjang (px). */
    public const MAX_EDGE = 1600;

    /** Remark: kualitas WebP 0–100. */
    public const QUALITY = 82;

    /**
     * Remark fungsi: simpan upload sebagai WebP di disk public.
     *
     * @return string path relatif di disk public (mis. katalog/1/xxxx.webp)
     */
    public static function storeAsWebp(UploadedFile $file, string $directory): string
    {
        if (! function_exists('imagewebp')) {
            throw new RuntimeException('PHP GD WebP tidak tersedia.');
        }

        $source = self::createImageResource($file);
        $optimized = self::resizeIfNeeded($source);
        if ($optimized !== $source) {
            imagedestroy($source);
            $source = $optimized;
        }

        // Remark: PNG/GIF transparan → truecolor dengan background putih
        if (! imageistruecolor($source)) {
            $true = imagecreatetruecolor(imagesx($source), imagesy($source));
            if ($true === false) {
                imagedestroy($source);
                throw new RuntimeException('Gagal membuat canvas truecolor.');
            }
            $white = imagecolorallocate($true, 255, 255, 255);
            imagefill($true, 0, 0, $white);
            imagecopy($true, $source, 0, 0, 0, 0, imagesx($source), imagesy($source));
            imagedestroy($source);
            $source = $true;
        }

        imagealphablending($source, true);
        imagesavealpha($source, false);

        $filename = Str::uuid()->toString().'.webp';
        $relative = trim($directory, '/').'/'.$filename;
        $absolute = Storage::disk('public')->path($relative);

        Storage::disk('public')->makeDirectory(dirname($relative));

        if (! imagewebp($source, $absolute, self::QUALITY)) {
            imagedestroy($source);
            throw new RuntimeException('Gagal menyimpan WebP.');
        }

        imagedestroy($source);

        return $relative;
    }

    /**
     * Remark fungsi: buat resource GD dari file upload.
     *
     * @return \GdImage
     */
    protected static function createImageResource(UploadedFile $file): \GdImage
    {
        $path = $file->getRealPath();
        if ($path === false) {
            throw new RuntimeException('File upload tidak terbaca.');
        }

        $mime = (string) ($file->getMimeType() ?: '');
        $image = match (true) {
            str_contains($mime, 'jpeg'), str_contains($mime, 'jpg') => @imagecreatefromjpeg($path),
            str_contains($mime, 'png') => @imagecreatefrompng($path),
            str_contains($mime, 'webp') => @imagecreatefromwebp($path),
            str_contains($mime, 'gif') => @imagecreatefromgif($path),
            str_contains($mime, 'bmp') => @imagecreatefrombmp($path),
            default => self::createFromAny($path),
        };

        if ($image === false) {
            throw new RuntimeException('Format gambar tidak didukung untuk konversi WebP.');
        }

        return $image;
    }

    /**
     * Remark fungsi: fallback deteksi format via getimagesize.
     *
     * @return \GdImage|false
     */
    protected static function createFromAny(string $path): \GdImage|false
    {
        $info = @getimagesize($path);
        if ($info === false) {
            return false;
        }

        return match ($info[2] ?? 0) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => @imagecreatefromwebp($path),
            IMAGETYPE_GIF => @imagecreatefromgif($path),
            IMAGETYPE_BMP => @imagecreatefrombmp($path),
            default => false,
        };
    }

    /**
     * Remark fungsi: downscale bila sisi terpanjang > MAX_EDGE.
     *
     * @param  \GdImage  $source
     * @return \GdImage
     */
    protected static function resizeIfNeeded(\GdImage $source): \GdImage
    {
        $width = imagesx($source);
        $height = imagesy($source);
        $max = max($width, $height);

        if ($max <= self::MAX_EDGE) {
            return $source;
        }

        $scale = self::MAX_EDGE / $max;
        $newW = max(1, (int) round($width * $scale));
        $newH = max(1, (int) round($height * $scale));

        $resized = imagecreatetruecolor($newW, $newH);
        if ($resized === false) {
            return $source;
        }

        $white = imagecolorallocate($resized, 255, 255, 255);
        imagefill($resized, 0, 0, $white);
        imagecopyresampled($resized, $source, 0, 0, 0, 0, $newW, $newH, $width, $height);

        return $resized;
    }
}
