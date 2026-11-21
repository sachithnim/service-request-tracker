<?php

namespace App\Http\Requests;

use App\Enums\RequestStatus;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateStatusRequest extends FormRequest
{
    // Runs before validation, so others' requests always get 404.
    public function authorize(): Response
    {
        return Gate::inspect('update', $this->route('serviceRequest'));
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(RequestStatus::class)],
            'expected_version' => ['required', 'integer', 'min:1'],
            'remark' => ['nullable', 'string', 'max:255'],
        ];
    }
}
