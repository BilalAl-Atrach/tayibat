export interface Condition { id: number; name: string; name_ar?: string | null }

export interface FoodRule {
  id: number;
  food?: { name: string; name_ar?: string | null };
  status: "allowed" | "avoid" | "moderate";
  reason?: string | null;
  reason_ar?: string | null;
  max_servings?: string | number | null;
}

export interface PlanMeal {
  meal: string;
  food: string;
  food_ar?: string | null;
  status: string;
  reason?: string | null;
  reason_ar?: string | null;
  max_servings?: string | number | null;
}

export interface PlanDay { day: number; label: string; meals: PlanMeal[] }

export interface DietPlanResponse {
  condition?: string;
  condition_ar?: string | null;
  duration?: string;
  days?: number;
  message?: string;
  plan: PlanDay[];
}

export interface ChatMessage { role: "user" | "assistant"; text: string }

export interface StoredDietPlan {
  conditionId: number;
  conditionName: string;
  duration: string;
  dietPlan: DietPlanResponse;
}

export interface StoredChatHistory {
  conditionId: number;
  conditionName: string;
  messages: ChatMessage[];
}

export interface BillingAccess {
  premium: boolean;
  prices: {
    premium: number;
    diet_plans: Record<string, number>;
  };
  ai: {
    free_limit: number;
    used: number;
    remaining: number | null;
    unlimited: boolean;
  };
  diet_plan_access: Record<string, boolean>;
}

export type GuidanceLanguage = "en" | "ar";
export type ActiveTab = "goals" | "foods" | "chat" | "plan" | "feedback";
