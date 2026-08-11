<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * DatabaseSeeder
 *
 * Remark kelas: entry-point seed BMD — user demo, toko mock, katalog.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Remark fungsi: jalankan seluruh seeder inti.
     */
    public function run(): void
    {
        // Remark: user login biasa (non-bypass)
        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );

        // Remark: user khusus auth bypass
        User::query()->updateOrCreate(
            ['email' => config('bmd.auth_bypass_email', 'dev@bmd.local')],
            [
                'name' => config('bmd.auth_bypass_name', 'BMD Dev'),
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );

        $this->call([
            TokoSeeder::class,
            KatalogItemSeeder::class,
            BrandingSeeder::class, // Remark: juga sync tokos dari brandings BMD2
        ]);
    }
}
