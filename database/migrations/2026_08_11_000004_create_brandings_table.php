<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: brandings
 *
 * Remark: port dari mab_brandings BMD2 — sumber daftar toko & status branding.
 */
return new class extends Migration
{
    /**
     * Remark fungsi: buat tabel brandings.
     */
    public function up(): void
    {
        Schema::create('brandings', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('customer_id', 50)->nullable()->index();
            $table->string('created_by', 50)->nullable();
            $table->string('status', 100)->nullable()->index();
            $table->decimal('total_cost', 18, 2)->nullable();
            $table->decimal('average_omzet', 18, 4)->nullable();
            $table->unsignedInteger('branding_type_id')->nullable();
            $table->unsignedInteger('vendor_id')->nullable();
            $table->unsignedInteger('branding_design_team_id')->nullable();
            $table->text('description')->nullable();
            $table->string('handled_by', 100)->nullable();
            $table->string('po_no', 100)->nullable();
            $table->string('pb_no', 100)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Remark fungsi: rollback tabel brandings.
     */
    public function down(): void
    {
        Schema::dropIfExists('brandings');
    }
};
