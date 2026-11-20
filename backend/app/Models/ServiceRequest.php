<?php

namespace App\Models;

use App\Enums\RequestPriority;
use App\Enums\RequestStatus;
use Database\Factories\ServiceRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// created_by, status and version are not fillable on purpose:
// the owner comes from the logged-in user and status/version only change through the workflow.
#[Fillable(['title', 'description', 'priority'])]
class ServiceRequest extends Model
{
    /** @use HasFactory<ServiceRequestFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => 'OPEN',
        'version' => 1,
    ];

    protected function casts(): array
    {
        return [
            'created_by' => 'integer',
            'priority' => RequestPriority::class,
            'status' => RequestStatus::class,
            'version' => 'integer',
        ];
    }

    // Title "contains" search. % and _ are wildcards in SQL LIKE, so escape them
    // to search for the literal characters the user typed.
    #[Scope]
    protected function searchTitle(Builder $query, string $search): void
    {
        $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);

        $query->where('title', 'like', "%{$escaped}%");
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(RequestStatusHistory::class);
    }
}
