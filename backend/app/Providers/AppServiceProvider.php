<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

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
    }
}
