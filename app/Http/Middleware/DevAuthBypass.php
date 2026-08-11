<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware DevAuthBypass
 *
 * Remark kelas: melewati login di environment local bila flag BMD_AUTH_BYPASS aktif.
 * Tidak boleh diaktifkan di staging/production.
 */
class DevAuthBypass
{
    /**
     * Remark fungsi: auto-login user demo bila bypass diizinkan & user belum login.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Remark: guard ketat — bypass hanya local + flag config
        if ($this->shouldBypass()) {
            if (! Auth::check()) {
                $user = $this->resolveBypassUser();
                Auth::login($user);
            }
        }

        return $next($request);
    }

    /**
     * Remark fungsi: cek apakah bypass boleh dijalankan.
     */
    protected function shouldBypass(): bool
    {
        return app()->environment('local')
            && (bool) config('bmd.auth_bypass', false);
    }

    /**
     * Remark fungsi: ambil / buat user demo untuk bypass login.
     */
    protected function resolveBypassUser(): User
    {
        $email = (string) config('bmd.auth_bypass_email', 'dev@bmd.local');
        $name = (string) config('bmd.auth_bypass_name', 'BMD Dev');

        return User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );
    }
}
