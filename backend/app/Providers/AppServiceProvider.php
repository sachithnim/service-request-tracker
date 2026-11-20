<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

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
        // Outside production, fail loudly on lazy loading (N+1 queries),
        // non-fillable attributes and missing attributes instead of ignoring them.
        Model::shouldBeStrict(! $this->app->isProduction());

        // We only use cookie sessions, so ignore any "Authorization: Bearer" header.
        // Without this, Sanctum would look for API tokens in a table we don't have.
        Sanctum::getAccessTokenFromRequestUsing(fn () => null);

        // 5 login attempts per minute for each email + IP, so one person
        // can't lock out everyone else on the same network.
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by(Str::lower((string) $request->input('email')).'|'.$request->ip());
        });
    }
}
