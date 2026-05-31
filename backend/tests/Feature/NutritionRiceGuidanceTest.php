<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NutritionRiceGuidanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_rice_is_allowed_for_non_diabetes_goals(): void
    {
        $this->postJson('/api/ask', [
            'food' => 'basmati rice',
            'condition' => 'high cholesterol',
        ])
            ->assertOk()
            ->assertJsonPath('status', 'allowed')
            ->assertJsonPath('message', 'All rice types are allowed.');
    }

    public function test_only_brown_rice_is_allowed_for_diabetes_goal(): void
    {
        $this->postJson('/api/ask', [
            'food' => 'white rice',
            'condition' => 'diabetes',
        ])
            ->assertOk()
            ->assertJsonPath('status', 'avoid')
            ->assertJsonPath('message', 'Only brown rice is allowed for you.');
    }

    public function test_brown_rice_is_allowed_for_diabetes_goal(): void
    {
        $this->postJson('/api/ask', [
            'food' => 'brown rice',
            'condition' => 'diabetes',
        ])
            ->assertOk()
            ->assertJsonPath('status', 'allowed')
            ->assertJsonPath('message', 'Only brown rice is allowed for you.');
    }
}
