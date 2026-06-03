<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NutritionController;
use App\Http\Controllers\TestimonialController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DietaryRuleController;
use App\Http\Controllers\AdminNutritionController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\GuidanceFeedbackController;
use App\Http\Controllers\AssistantController;

Route::get('/conditions', [NutritionController::class, 'getConditions']);
Route::post('/ask', [NutritionController::class, 'ask']);
Route::match(['get', 'post'], '/billing/whish/callback', [BillingController::class, 'callback']);

Route::get('/rules/{condition}', [DietaryRuleController::class, 'getRules']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user/condition', [UserController::class, 'getCondition']);
    Route::post('/user/condition', [UserController::class, 'updateCondition']);
    Route::post('/guidance-feedback', [GuidanceFeedbackController::class, 'store']);
    Route::post('/diet-plan', [NutritionController::class, 'dietPlan']);
    Route::get('/assistant/dashboard', [AssistantController::class, 'dashboard']);
    Route::put('/assistant/profile', [AssistantController::class, 'updateProfile']);
    Route::post('/assistant/food-logs', [AssistantController::class, 'storeFoodLog']);
    Route::post('/assistant/plans', [AssistantController::class, 'savePlan']);
    Route::post('/assistant/plans/edit', [AssistantController::class, 'editPlan']);
    Route::post('/assistant/shopping-list', [AssistantController::class, 'shoppingList']);
    Route::patch('/assistant/reminders/{reminder}', [AssistantController::class, 'updateReminder']);
    Route::get('/rules/{condition}/lookup-food', [DietaryRuleController::class, 'lookupFoodRule']);
    Route::get('/billing/access', [BillingController::class, 'access']);
    Route::get('/billing/history', [BillingController::class, 'history']);
    Route::post('/billing/checkout', [BillingController::class, 'checkout']);
    Route::post('/billing/ai-usage/consume', [BillingController::class, 'consumeAiQuestion']);
});

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/contact-messages', [ContactMessageController::class, 'index']);
    Route::get('/guidance-feedback', [GuidanceFeedbackController::class, 'index']);
    Route::get('/admin/payment-transactions', [BillingController::class, 'adminTransactions']);
    Route::get('/admin/subscriptions', [BillingController::class, 'adminSubscriptions']);
    Route::get('/admin/payment-webhook-logs', [BillingController::class, 'adminWebhookLogs']);
    Route::post('/admin/payment-transactions/{transaction}/mark-paid', [BillingController::class, 'markTransactionPaid']);
    Route::post('/admin/payment-transactions/{transaction}/mark-failed', [BillingController::class, 'markTransactionFailed']);
    Route::post('/admin/users/{user}/premium/grant', [BillingController::class, 'grantPremium']);
    Route::post('/admin/users/{user}/premium/revoke', [BillingController::class, 'revokePremium']);
    Route::post('/admin/users/{user}/ai-usage/reset', [BillingController::class, 'resetAiUsage']);
    Route::post('/admin/users/{user}/diet-plan-access/grant', [BillingController::class, 'grantDietPlanAccess']);
    Route::post('/admin/users/{user}/diet-plan-access/revoke', [BillingController::class, 'revokeDietPlanAccess']);
    Route::post('/testimonials', [TestimonialController::class, 'store']);

    Route::get('/admin/foods', [AdminNutritionController::class, 'foods']);
    Route::post('/admin/foods', [AdminNutritionController::class, 'storeFood']);
    Route::put('/admin/foods/{food}', [AdminNutritionController::class, 'updateFood']);
    Route::delete('/admin/foods/{food}', [AdminNutritionController::class, 'deleteFood']);
    Route::get('/admin/conditions', [AdminNutritionController::class, 'conditions']);
    Route::post('/admin/conditions', [AdminNutritionController::class, 'storeCondition']);
    Route::put('/admin/conditions/{condition}', [AdminNutritionController::class, 'updateCondition']);
    Route::delete('/admin/conditions/{condition}', [AdminNutritionController::class, 'deleteCondition']);
    Route::get('/admin/dietary-rules', [AdminNutritionController::class, 'dietaryRules']);
    Route::post('/admin/dietary-rules', [AdminNutritionController::class, 'storeDietaryRule']);
    Route::put('/admin/dietary-rules/{dietaryRule}', [AdminNutritionController::class, 'updateDietaryRule']);
    Route::delete('/admin/dietary-rules/{dietaryRule}', [AdminNutritionController::class, 'deleteDietaryRule']);
    Route::get('/admin/global-rules', [AdminNutritionController::class, 'globalRules']);
    Route::post('/admin/global-rules', [AdminNutritionController::class, 'storeGlobalRule']);
    Route::put('/admin/global-rules/{globalRule}', [AdminNutritionController::class, 'updateGlobalRule']);
    Route::delete('/admin/global-rules/{globalRule}', [AdminNutritionController::class, 'deleteGlobalRule']);
});

Route::get('/testimonials', [TestimonialController::class, 'index']);
Route::post('/contact-messages', [ContactMessageController::class, 'store']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class,'login']);
