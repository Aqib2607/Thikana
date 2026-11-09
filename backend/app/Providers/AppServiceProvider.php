<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiters();

        ResetPassword::createUrlUsing(function ($user, string $token) {
            $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url', 'http://localhost:5173')), '/');

            return "{$frontendUrl}/reset-password?email=".urlencode($user->email)."&code={$token}";
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Configure application-wide rate limiters for security and abuse prevention.
     */
    protected function configureRateLimiters(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $rawIdentifier = (string) $request->input('identifier', '');
            $normalizedIdentifier = Str::transliterate(Str::lower(preg_replace('/[\s-]/', '', $rawIdentifier) ?? ''));
            $ip = (string) $request->ip();
            $compositeKey = $normalizedIdentifier !== '' ? $normalizedIdentifier.'|'.$ip : $ip;
            $accountKey = $normalizedIdentifier !== '' ? 'account:'.$normalizedIdentifier : 'ip:'.$ip;

            return [
                Limit::perMinute(5)->by($compositeKey),
                Limit::perMinute(5)->by($accountKey),
                Limit::perMinute(30)->by($ip),
            ];
        });

        RateLimiter::for('registration', function (Request $request) {
            return Limit::perMinute(10)->by((string) $request->ip());
        });

        RateLimiter::for('forgot-password', function (Request $request) {
            $rawEmail = (string) $request->input('email', '');
            $normalizedEmail = Str::lower(trim($rawEmail));
            $key = $normalizedEmail !== '' ? $normalizedEmail.'|'.$request->ip() : (string) $request->ip();

            return Limit::perMinute(3)->by($key);
        });

        RateLimiter::for('reset-password', function (Request $request) {
            return Limit::perMinute(5)->by((string) $request->ip());
        });

        RateLimiter::for('verification-resend', function (Request $request) {
            $user = $request->user();
            $key = $user !== null ? (string) $user->getAuthIdentifier() : (string) $request->ip();

            return Limit::perMinute(3)->by($key);
        });
    }
}
