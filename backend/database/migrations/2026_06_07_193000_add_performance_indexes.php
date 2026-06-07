<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->addIndex('conditions', ['name'], 'conditions_name_idx');
        $this->addIndex('conditions', ['name_ar'], 'conditions_name_ar_idx');
        $this->addIndex('foods', ['name_ar'], 'foods_name_ar_idx');
        $this->addIndex('foods', ['meal_type', 'meal_role'], 'foods_meal_type_role_idx');
        $this->addIndex('dietary_rules', ['condition_id', 'status'], 'dietary_rules_condition_status_idx');
        $this->addIndex('dietary_rules', ['condition_id', 'food_id'], 'dietary_rules_condition_food_idx');
        $this->addIndex('global_rules', ['food_id', 'status'], 'global_rules_food_status_idx');
        $this->addIndex('subscriptions', ['user_id', 'plan', 'status', 'expires_at'], 'subscriptions_access_idx');
        $this->addIndex('diet_plan_purchases', ['user_id', 'condition_id', 'duration', 'status', 'expires_at'], 'diet_plan_purchases_access_idx');
        $this->addIndex('payment_transactions', ['user_id', 'status', 'created_at'], 'payment_transactions_user_status_created_idx');
    }

    public function down(): void
    {
        foreach ([
            ['payment_transactions', 'payment_transactions_user_status_created_idx'],
            ['diet_plan_purchases', 'diet_plan_purchases_access_idx'],
            ['subscriptions', 'subscriptions_access_idx'],
            ['global_rules', 'global_rules_food_status_idx'],
            ['dietary_rules', 'dietary_rules_condition_food_idx'],
            ['dietary_rules', 'dietary_rules_condition_status_idx'],
            ['foods', 'foods_meal_type_role_idx'],
            ['foods', 'foods_name_ar_idx'],
            ['conditions', 'conditions_name_ar_idx'],
            ['conditions', 'conditions_name_idx'],
        ] as [$table, $index]) {
            if ($this->indexExists($table, $index)) {
                Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropIndex($index));
            }
        }
    }

    private function addIndex(string $table, array $columns, string $name): void
    {
        if (! Schema::hasTable($table) || $this->indexExists($table, $name)) {
            return;
        }

        Schema::table($table, fn (Blueprint $blueprint) => $blueprint->index($columns, $name));
    }

    private function indexExists(string $table, string $name): bool
    {
        if (DB::getDriverName() === 'sqlite') {
            return collect(DB::select("pragma index_list('{$table}')"))
                ->contains(fn ($index) => ($index->name ?? null) === $name);
        }

        $database = DB::getDatabaseName();

        return ! empty(DB::select(
            'select 1 from information_schema.statistics where table_schema = ? and table_name = ? and index_name = ? limit 1',
            [$database, $table, $name]
        ));
    }
};
