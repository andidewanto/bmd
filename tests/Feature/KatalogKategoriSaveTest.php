<?php

namespace Tests\Feature;

use App\Models\KatalogItem;
use App\Models\KatalogKategori;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KatalogKategoriSaveTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_store_katalog_kategori(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/admin/katalog/kategori', [
            'nama' => 'Kategori Baru Test',
            'kode' => 'kb',
            'sort_order' => 50,
            'is_active' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('katalog_kategoris', [
            'nama' => 'Kategori Baru Test',
            'kode' => 'KB',
            'sort_order' => 50,
            'is_active' => 1,
        ]);
    }

    public function test_admin_can_update_katalog_kategori_and_sync_item_names(): void
    {
        $user = User::factory()->create();
        $kategori = KatalogKategori::query()->create([
            'nama' => 'Nama Lama',
            'kode' => 'NL',
            'sort_order' => 1,
            'is_active' => true,
        ]);
        $item = KatalogItem::query()->create([
            'no' => 999,
            'kode' => 'Z99',
            'kategori' => 'Nama Lama',
            'nama_branding' => 'Item Uji',
            'satuan' => 'Unit',
        ]);

        $response = $this->actingAs($user)->put('/admin/katalog/kategori/'.$kategori->id, [
            'nama' => 'Nama Baru',
            'kode' => 'NB',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $response->assertRedirect();
        $this->assertSame('Nama Baru', $kategori->fresh()->nama);
        $this->assertSame('NB', $kategori->fresh()->kode);
        $this->assertSame('Nama Baru', $item->fresh()->kategori);
    }

    public function test_store_accepts_empty_sort_order_string(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->from('/admin/katalog/kategori')
            ->post('/admin/katalog/kategori', [
                'nama' => 'Tanpa Urutan',
                'kode' => 'TU',
                'sort_order' => '',
                'is_active' => true,
            ]);

        $response->assertRedirect('/admin/katalog/kategori');
        $response->assertSessionDoesntHaveErrors();
        $this->assertDatabaseHas('katalog_kategoris', [
            'nama' => 'Tanpa Urutan',
            'kode' => 'TU',
        ]);
    }

    public function test_inertia_json_boolean_false_updates_is_active(): void
    {
        $user = User::factory()->create();
        $kategori = KatalogKategori::query()->create([
            'nama' => 'Aktif Dulu',
            'kode' => 'AD',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)
            ->withHeaders([
                'X-Inertia' => 'true',
                'X-Requested-With' => 'XMLHttpRequest',
                'Accept' => 'text/html, application/xhtml+xml',
            ])
            ->put('/admin/katalog/kategori/'.$kategori->id, [
                'nama' => 'Aktif Dulu',
                'kode' => 'AD',
                'sort_order' => 1,
                'is_active' => false,
            ]);

        $response->assertRedirect();
        $this->assertFalse((bool) $kategori->fresh()->is_active);
    }

    public function test_store_rejects_duplicate_kode(): void
    {
        $user = User::factory()->create();
        KatalogKategori::query()->create([
            'nama' => 'Booth',
            'kode' => 'B',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)
            ->from('/admin/katalog/kategori')
            ->post('/admin/katalog/kategori', [
                'nama' => 'Booth Lain',
                'kode' => 'b',
                'sort_order' => 2,
                'is_active' => true,
            ]);

        $response->assertRedirect('/admin/katalog/kategori');
        $response->assertSessionHasErrors('kode');
    }
}
