"use client";

import axios from "axios";
import { Download, X, Send, Leaf, ChevronRight, Star, MessageCircle, CalendarDays, Utensils, RefreshCw, Lock, CreditCard } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import MedicalDisclaimerBanner from "@/components/MedicalDisclaimerBanner";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Condition { id: number; name: string; name_ar?: string | null }
interface FoodRule {
  id: number;
  food?: { name: string; name_ar?: string | null };
  status: "allowed" | "avoid" | "moderate";
  reason?: string | null; reason_ar?: string | null;
  max_servings?: string | number | null;
}
interface PlanMeal {
  meal: string; food: string; food_ar?: string | null;
  status: string; reason?: string | null; reason_ar?: string | null;
  max_servings?: string | number | null;
}
interface PlanDay { day: number; label: string; meals: PlanMeal[] }
interface DietPlanResponse {
  condition?: string; condition_ar?: string | null;
  duration?: string; days?: number; message?: string;
  plan: PlanDay[];
}
interface ChatMessage { role: "user" | "assistant"; text: string }
interface StoredDietPlan { conditionId: number; conditionName: string; duration: string; dietPlan: DietPlanResponse }
interface StoredChatHistory { conditionId: number; conditionName: string; messages: ChatMessage[] }
interface BillingAccess {
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
type GuidanceLanguage = "en" | "ar";
type ActiveTab = "goals" | "foods" | "chat" | "plan" | "feedback";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const durations = ["1 week", "1 month", "3 months"];
let conditionsRequest: Promise<Condition[]> | null = null;

const dietPlanInstructions = {
  en: [
    "Don't eat until you feel hungry.",
    "Don't drink until you feel thirsty.",
    "Train 5 days a week for 30–45 minutes.",
    "Avoid food marked as 'avoid' in your selected goal, even if it appears in other general diets.",
    "If a meal causes stomach discomfort, stop and consult a qualified health professional.",
    "It is not necessary to eat breakfast, lunch, and dinner every day. You may choose breakfast and lunch, breakfast and dinner, or all three meals depending on your appetite and hunger levels. If you prefer eating three meals a day, keep the portions moderate and balanced.",
  ],
  ar: [
    "لا تأكل حتى تشعر بالجوع.",
    "لا تشرب حتى تشعر بالعطش.",
    "تمرن 5 أيام في الأسبوع لمدة 30-45 دقيقة.",
    "تجنب الأطعمة المحددة كأطعمة يجب تجنبها في هدفك الصحي.",
    "إذا سبب لك أي طعام انزعاجاً في المعدة، توقف عنه واستشر مختصاً صحياً.",
    "تجنب الأدوية قدر الإمكان إلا عند الحاجة وتحت إشراف مختص.",
    "\u0644\u064a\u0633 \u0645\u0646 \u0627\u0644\u0636\u0631\u0648\u0631\u064a \u062a\u0646\u0627\u0648\u0644 \u0648\u062c\u0628\u0627\u062a \u0627\u0644\u0625\u0641\u0637\u0627\u0631 \u0648\u0627\u0644\u063a\u062f\u0627\u0621 \u0648\u0627\u0644\u0639\u0634\u0627\u0621 \u064a\u0648\u0645\u064a\u0627\u064b. \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0627\u0643\u062a\u0641\u0627\u0621 \u0628\u0648\u062c\u0628\u062a\u064a\u0646 \u0641\u0642\u0637\u060c \u0645\u062b\u0644 \u0627\u0644\u0625\u0641\u0637\u0627\u0631 \u0648\u0627\u0644\u063a\u062f\u0627\u0621 \u0623\u0648 \u0627\u0644\u0625\u0641\u0637\u0627\u0631 \u0648\u0627\u0644\u0639\u0634\u0627\u0621\u060c \u0648\u0630\u0644\u0643 \u062d\u0633\u0628 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062c\u0648\u0639 \u0648\u0627\u0644\u0634\u0647\u064a\u0629 \u0644\u062f\u064a\u0643. \u0648\u0625\u0630\u0627 \u0643\u0646\u062a \u062a\u0641\u0636\u0644 \u062a\u0646\u0627\u0648\u0644 \u062b\u0644\u0627\u062b \u0648\u062c\u0628\u0627\u062a \u064a\u0648\u0645\u064a\u0627\u064b\u060c \u0641\u0627\u062d\u0631\u0635 \u0639\u0644\u0649 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0627\u0644\u0643\u0645\u064a\u0627\u062a \u0645\u0639\u062a\u062f\u0644\u0629 \u0648\u0645\u062a\u0648\u0627\u0632\u0646\u0629.",
  ],
};

const conditionDietPlanInstructions = {
  healthy: {
    en: [
      "Read food labels before buying packaged foods.",
      "Prepare healthy meals at home more often.",
      "Focus on the drinks in your diet plan.",
    ],
    ar: [
      "\u0627\u0642\u0631\u0623 \u0645\u0644\u0635\u0642\u0627\u062a \u0627\u0644\u0637\u0639\u0627\u0645 \u0642\u0628\u0644 \u0634\u0631\u0627\u0621 \u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u0645\u0639\u0644\u0628\u0629.",
      "\u062d\u0636\u0631 \u0648\u062c\u0628\u0627\u062a \u0635\u062d\u064a\u0629 \u0641\u064a \u0627\u0644\u0645\u0646\u0632\u0644 \u0628\u0634\u0643\u0644 \u0623\u0643\u062b\u0631.",
      "\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u0631\u0648\u0628\u0627\u062a \u0627\u0644\u0645\u0648\u062c\u0648\u062f\u0629 \u0641\u064a \u062e\u0637\u0629 \u0646\u0638\u0627\u0645\u0643 \u0627\u0644\u063a\u0630\u0627\u0626\u064a.",
    ],
  },
  diabetes: {
    en: [
      "Never eat carbs alone — always pair with protein or healthy fat to slow glucose absorption",
      "We supported your diet plan with limit healthy sugar to stay energized.",
      "Choose whole grain bread and brown rice.",
      "Drink green tea daily — it helps with insulin sensitivity.",
      "Use olive oil as your only cooking fat.",
    ],
    ar: [
      "\u0644\u0627 \u062a\u0623\u0643\u0644 \u0627\u0644\u0643\u0631\u0628\u0648\u0647\u064a\u062f\u0631\u0627\u062a \u0648\u062d\u062f\u0647\u0627\u061b \u0627\u062c\u0645\u0639\u0647\u0627 \u062f\u0627\u0626\u0645\u0627\u064b \u0645\u0639 \u0628\u0631\u0648\u062a\u064a\u0646 \u0623\u0648 \u062f\u0647\u0648\u0646 \u0635\u062d\u064a\u0629 \u0644\u0625\u0628\u0637\u0627\u0621 \u0627\u0645\u062a\u0635\u0627\u0635 \u0627\u0644\u063a\u0644\u0648\u0643\u0648\u0632.",
      "\u062f\u0639\u0645\u0646\u0627 \u062e\u0637\u062a\u0643 \u0627\u0644\u063a\u0630\u0627\u0626\u064a\u0629 \u0628\u0643\u0645\u064a\u0629 \u0645\u062d\u062f\u0648\u062f\u0629 \u0645\u0646 \u0627\u0644\u0633\u0643\u0631 \u0627\u0644\u0635\u062d\u064a \u0644\u062a\u0628\u0642\u0649 \u0646\u0634\u064a\u0637\u0627\u064b.",
      "\u0627\u062e\u062a\u0631 \u062e\u0628\u0632 \u0627\u0644\u062d\u0628\u0648\u0628 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u0648\u0627\u0644\u0623\u0631\u0632 \u0627\u0644\u0628\u0646\u064a.",
      "\u0627\u0634\u0631\u0628 \u0627\u0644\u0634\u0627\u064a \u0627\u0644\u0623\u062e\u0636\u0631 \u064a\u0648\u0645\u064a\u0627\u064b\u061b \u0641\u0647\u0648 \u064a\u0633\u0627\u0639\u062f \u0639\u0644\u0649 \u062d\u0633\u0627\u0633\u064a\u0629 \u0627\u0644\u0623\u0646\u0633\u0648\u0644\u064a\u0646.",
      "\u0627\u0633\u062a\u062e\u062f\u0645 \u0632\u064a\u062a \u0627\u0644\u0632\u064a\u062a\u0648\u0646 \u0643\u062f\u0647\u0646 \u0627\u0644\u0637\u0647\u064a \u0627\u0644\u0648\u062d\u064a\u062f.",
    ],
  },
  weight: {
    en: [
      "Count portions not just food types — a healthy food in large amounts still causes weight gain.",
      "Prioritize protein and fiber-rich foods to support fullness.",
      "Eat slowly.",
      "Make dinner your lightest meal of the day.",
    ],
    ar: [
      "\u0627\u062d\u0633\u0628 \u0627\u0644\u062d\u0635\u0635 \u0648\u0644\u064a\u0633 \u0646\u0648\u0639 \u0627\u0644\u0637\u0639\u0627\u0645 \u0641\u0642\u0637\u061b \u0641\u0627\u0644\u0637\u0639\u0627\u0645 \u0627\u0644\u0635\u062d\u064a \u0628\u0643\u0645\u064a\u0627\u062a \u0643\u0628\u064a\u0631\u0629 \u0642\u062f \u064a\u0633\u0628\u0628 \u0632\u064a\u0627\u062f\u0629 \u0627\u0644\u0648\u0632\u0646.",
      "\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0628\u0631\u0648\u062a\u064a\u0646 \u0648\u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u063a\u0646\u064a\u0629 \u0628\u0627\u0644\u0623\u0644\u064a\u0627\u0641 \u0644\u062f\u0639\u0645 \u0627\u0644\u0634\u0628\u0639.",
      "\u062a\u0646\u0627\u0648\u0644 \u0627\u0644\u0637\u0639\u0627\u0645 \u0628\u0628\u0637\u0621.",
      "\u0627\u062c\u0639\u0644 \u0627\u0644\u0639\u0634\u0627\u0621 \u0623\u062e\u0641 \u0648\u062c\u0628\u0629 \u0641\u064a \u0627\u0644\u064a\u0648\u0645.",
    ],
  },
  digestive: {
    en: [
      "Eat slowly and stop any meal that causes stomach discomfort.",
      "Avoid spicy or irritating foods, especially if symptoms are active.",
      "Chew your food thoroughly — digestion begins in the mouth.",
    ],
    ar: [
      "\u062a\u0646\u0627\u0648\u0644 \u0627\u0644\u0637\u0639\u0627\u0645 \u0628\u0628\u0637\u0621 \u0648\u062a\u0648\u0642\u0641 \u0639\u0646 \u0623\u064a \u0648\u062c\u0628\u0629 \u062a\u0633\u0628\u0628 \u0627\u0646\u0632\u0639\u0627\u062c\u0627\u064b \u0641\u064a \u0627\u0644\u0645\u0639\u062f\u0629.",
      "\u062a\u062c\u0646\u0628 \u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u062d\u0627\u0631\u0629 \u0623\u0648 \u0627\u0644\u0645\u0647\u064a\u062c\u0629\u060c \u062e\u0627\u0635\u0629 \u0639\u0646\u062f \u0648\u062c\u0648\u062f \u0623\u0639\u0631\u0627\u0636.",
      "\u0627\u0645\u0636\u063a \u0637\u0639\u0627\u0645\u0643 \u062c\u064a\u062f\u0627\u064b\u061b \u0641\u0627\u0644\u0647\u0636\u0645 \u064a\u0628\u062f\u0623 \u0641\u064a \u0627\u0644\u0641\u0645.",
    ],
  },
  cholesterol: {
    en: [
      "Prefer foods with healthy fats.",
      "Limit saturated fats, fried foods, and heavy cheese-based meals.",
      "Use olive oil as your only fat.",
      "Avoid butter.",
    ],
    ar: [
      "\u0641\u0636\u0644 \u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u062a\u064a \u062a\u062d\u062a\u0648\u064a \u0639\u0644\u0649 \u062f\u0647\u0648\u0646 \u0635\u062d\u064a\u0629.",
      "\u0642\u0644\u0644 \u0627\u0644\u062f\u0647\u0648\u0646 \u0627\u0644\u0645\u0634\u0628\u0639\u0629 \u0648\u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u0645\u0642\u0644\u064a\u0629 \u0648\u0627\u0644\u0648\u062c\u0628\u0627\u062a \u0627\u0644\u062b\u0642\u064a\u0644\u0629 \u0627\u0644\u0645\u0639\u062a\u0645\u062f\u0629 \u0639\u0644\u0649 \u0627\u0644\u062c\u0628\u0646.",
      "\u0627\u0633\u062a\u062e\u062f\u0645 \u0632\u064a\u062a \u0627\u0644\u0632\u064a\u062a\u0648\u0646 \u0643\u062f\u0647\u0646\u0643 \u0627\u0644\u0648\u062d\u064a\u062f.",
      "\u062a\u062c\u0646\u0628 \u0627\u0644\u0632\u0628\u062f\u0629.",
    ],
  },
  cancer: {
    en: [
      "Avoid raw or undercooked foods.",
      "Stop any food that causes discomfort to your stomach.",
      "Focus on the nature drinks on you diet plan.",
    ],
    ar: [
      "\u062a\u062c\u0646\u0628 \u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u0646\u064a\u0626\u0629 \u0623\u0648 \u063a\u064a\u0631 \u0627\u0644\u0645\u0637\u0647\u0648\u0629 \u062c\u064a\u062f\u0627\u064b.",
      "\u062a\u0648\u0642\u0641 \u0639\u0646 \u0623\u064a \u0637\u0639\u0627\u0645 \u064a\u0633\u0628\u0628 \u0627\u0646\u0632\u0639\u0627\u062c\u0627\u064b \u0644\u0645\u0639\u062f\u062a\u0643.",
      "\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u0631\u0648\u0628\u0627\u062a \u0627\u0644\u0637\u0628\u064a\u0639\u064a\u0629 \u0641\u064a \u062e\u0637\u0629 \u0646\u0638\u0627\u0645\u0643 \u0627\u0644\u063a\u0630\u0627\u0626\u064a.",
    ],
  },
} as const;

const getConditionInstructionKey = (conditionName?: string | null) => {
  const normalized = (conditionName || "").toLowerCase();

  if (normalized.includes("diabetes")) return "diabetes";
  if (normalized.includes("weight")) return "weight";
  if (normalized.includes("digestive")) return "digestive";
  if (normalized.includes("cholesterol")) return "cholesterol";
  if (normalized.includes("cancer")) return "cancer";
  if (normalized.includes("healthy")) return "healthy";

  return null;
};

const getDietPlanInstructions = (conditionName: string | null | undefined, language: GuidanceLanguage) => {
  const conditionKey = getConditionInstructionKey(conditionName);
  const conditionInstructions = conditionKey ? conditionDietPlanInstructions[conditionKey][language] : [];

  return [...dietPlanInstructions[language], ...conditionInstructions];
};

const uiText = {
  en: {
    languageLabel: "عربي",
    pageName: "Healthy Diet Guide",
    headline: "Your personal food compass",
    intro: "Choose a health goal, explore your food map, chat with the AI guide, and generate a tailored plan.",
    step1: "Choose Goal", step2: "Food Map", step3: "Ask AI", step4: "Diet Plan", step5: "Feedback",
    currentGoal: "Active goal", notSelected: "None selected", change: "Change goal",
    goalSelection: "Choose your health goal",
    loadingGoals: "Loading goals…", noGoals: "No health goals available yet.",
    noFoodRules: "No food rules found for this goal.",
    allowedTitle: "Eat & Enjoy", avoidTitle: "Avoid",
    guidanceChat: "Ask the AI Guide",
    chatHelp: "Ask about any food not listed in your food map.",
    chatEmpty: "Type a food name or a nutrition question below.",
    chatPlaceholder: "e.g. Can I eat brown rice?",
    send: "Send",
    dietPlanGenerator: "Generate Diet Plan",
    planHelp: "Plans are built from your allowed & moderate food rules.",
    generate: "Generate plan", generating: "Generating…",
    viewGeneratedPlan: "View plan",
    downloadPdf: "Save as PDF",
    generatedPlan: "Generated Plan",
    instructions: "Daily Guidelines",
    meal: "Meal", food: "Food", status: "Status", reason: "Reason",
    noMatchingRules: "No matching rules.",
    maxServings: "Max servings",
    feedbackTitle: "Share Feedback",
    feedbackHelp: "How useful was this guidance for your selected goal?",
    feedbackRating: "Rating",
    feedbackMessage: "Your thoughts",
    feedbackPlaceholder: "What worked well, or what could be improved?",
    submitFeedback: "Submit feedback",
    submittingFeedback: "Submitting…",
    feedbackLoginRequired: "Log in and select a health goal before submitting feedback.",
    feedbackSelectGoal: "Please select a health goal before submitting feedback.",
    feedbackSaved: "Thank you — your feedback was submitted.",
    closePlan: "Close",
  },
  ar: {
    languageLabel: "English",
    pageName: "دليل النظام الصحي",
    headline: "بوصلتك الغذائية الشخصية",
    intro: "اختر هدفاً صحياً، استعرض خريطة طعامك، تحدث مع المساعد، وأنشئ خطة مخصصة.",
    step1: "اختر الهدف", step2: "خريطة الطعام", step3: "اسأل الذكاء الاصطناعي", step4: "خطة الغذاء", step5: "تقييم",
    currentGoal: "الهدف الحالي", notSelected: "غير محدد", change: "تغيير الهدف",
    goalSelection: "اختر هدفك الصحي",
    loadingGoals: "جاري التحميل…", noGoals: "لا توجد أهداف صحية متاحة.",
    noFoodRules: "لا توجد قواعد أطعمة لهذا الهدف.",
    allowedTitle: "كُل واستمتع", avoidTitle: "يُفضَّل تجنُّبه",
    guidanceChat: "اسأل المساعد الذكي",
    chatHelp: "اسأل عن أي طعام غير موجود في الخريطة.",
    chatEmpty: "اكتب اسم طعام أو سؤالاً غذائياً.",
    chatPlaceholder: "مثال: هل يمكنني أكل الأرز البني؟",
    send: "إرسال",
    dietPlanGenerator: "إنشاء خطة غذائية",
    planHelp: "تُبنى الخطط من قواعد المسموح والمعتدل.",
    generate: "إنشاء الخطة", generating: "جاري الإنشاء…",
    viewGeneratedPlan: "عرض الخطة",
    downloadPdf: "حفظ PDF",
    generatedPlan: "الخطة المنشأة",
    instructions: "الإرشادات اليومية",
    meal: "الوجبة", food: "الطعام", status: "الحالة", reason: "السبب",
    noMatchingRules: "لا توجد قواعد.",
    maxServings: "الحد الأقصى للحصص",
    feedbackTitle: "شاركنا رأيك",
    feedbackHelp: "ما مدى فائدة هذا الدليل لهدفك الصحي؟",
    feedbackRating: "التقييم",
    feedbackMessage: "ملاحظاتك",
    feedbackPlaceholder: "ما الذي أفادك، وما الذي يمكن تحسينه؟",
    submitFeedback: "إرسال التقييم",
    submittingFeedback: "جاري الإرسال…",
    feedbackLoginRequired: "سجّل الدخول واختر هدفاً صحياً قبل إرسال التقييم.",
    feedbackSelectGoal: "يرجى اختيار هدف صحي قبل إرسال التقييم.",
    feedbackSaved: "شكراً — تم إرسال تقييمك بنجاح.",
    closePlan: "إغلاق",
  },
} as const;

type GuidanceText = (typeof uiText)[GuidanceLanguage];

const durationLabels: Record<GuidanceLanguage, Record<string, string>> = {
  en: { "1 week": "1 week", "1 month": "1 month", "3 months": "3 months" },
  ar: { "1 week": "أسبوع واحد", "1 month": "شهر واحد", "3 months": "3 أشهر" },
};
const mealLabels: Record<GuidanceLanguage, Record<string, string>> = {
  en: { Breakfast: "Breakfast", Lunch: "Lunch", Dinner: "Dinner", Snack: "Snack" },
  ar: { Breakfast: "الفطور", Lunch: "الغداء", Dinner: "العشاء", Snack: "وجبة خفيفة" },
};
const statusLabels: Record<GuidanceLanguage, Record<string, string>> = {
  en: { allowed: "Allowed", moderate: "Moderate", avoid: "Avoid" },
  ar: { allowed: "مسموح", moderate: "معتدل", avoid: "تجنب" },
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const getApiMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    if (!error.response) return "Cannot reach the server. Make sure it is running.";
    return error.response?.data?.message || error.response?.data?.error || fallback;
  }
  return fallback;
};
const getUserId = () => (typeof window !== "undefined" ? localStorage.getItem("userId") || "guest" : "guest");
const getDietPlanKey = (id: number) => `tayibat-diet-plan:${getUserId()}:${id}`;
const getChatHistoryKey = (id: number) => `tayibat-chat-history:${getUserId()}:${id}`;
const escapeHtml = (v: string | number | null | undefined) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const localizedConditionName = (c: Condition | null | undefined, lang: GuidanceLanguage) =>
  lang === "ar" ? c?.name_ar || c?.name : c?.name;
const localizedFoodName = (
  food: { name?: string | null; name_ar?: string | null } | null | undefined,
  lang: GuidanceLanguage
) => (lang === "ar" ? food?.name_ar || food?.name : food?.name) || "Unknown food";
const localizedRuleReason = (
  rule: { reason?: string | null; reason_ar?: string | null },
  lang: GuidanceLanguage
) => (lang === "ar" ? rule.reason_ar || rule.reason : rule.reason) || "—";
const translateDayLabel = (day: PlanDay, lang: GuidanceLanguage) =>
  lang === "ar" ? `اليوم ${day.day}` : day.label;
const translateMeal = (meal: string, lang: GuidanceLanguage) => mealLabels[lang][meal] || meal;
const translateStatus = (s: string, lang: GuidanceLanguage) => statusLabels[lang][s] || s;

/* ─── Tab config ─────────────────────────────────────────────────────────── */
const TABS: { id: ActiveTab; icon: React.ReactNode; enLabel: string; arLabel: string }[] = [
  { id: "goals",    icon: <Leaf className="h-4 w-4" />,          enLabel: "Goals",    arLabel: "الأهداف"  },
  { id: "foods",    icon: <Utensils className="h-4 w-4" />,      enLabel: "Foods",    arLabel: "الطعام"   },
  { id: "chat",     icon: <MessageCircle className="h-4 w-4" />, enLabel: "Ask AI",   arLabel: "اسأل"     },
  { id: "plan",     icon: <CalendarDays className="h-4 w-4" />,  enLabel: "Plan",     arLabel: "الخطة"    },
  { id: "feedback", icon: <Star className="h-4 w-4" />,          enLabel: "Rate",     arLabel: "تقييم"    },
];

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function GuidanceExperience() {
  const [conditions, setConditions]   = useState<Condition[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [foodRules, setFoodRules]     = useState<FoodRule[]>([]);
  const [planDuration, setPlanDuration] = useState(durations[0]);
  const [dietPlan, setDietPlan]       = useState<DietPlanResponse | null>(null);
  const [isPlanOpen, setIsPlanOpen]   = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab]     = useState<ActiveTab>("goals");
  const [language, setLanguage]       = useState<GuidanceLanguage>(() => {
    if (typeof window === "undefined") return "en";
    const s = localStorage.getItem("tayibat-guidance-language");
    return s === "ar" || s === "en" ? s : "en";
  });
  const [loading, setLoading] = useState({
    conditions: true, rules: false, plan: false, chat: false, feedback: false, billing: false,
  });
  const [notice, setNotice] = useState("");
  const [billingAccess, setBillingAccess] = useState<BillingAccess | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const loadedRulesKeyRef = useRef<string | null>(null);
  const loadedBillingKeyRef = useRef<string | null>(null);

  const t = uiText[language];
  const isArabic = language === "ar";
  const isPremium = Boolean(billingAccess?.premium);
  const selectedConditionId = selectedCondition?.id ?? null;
  const selectedConditionName = selectedCondition?.name ?? "";
  const premiumPrice = billingAccess?.prices?.premium ?? 15;
  const selectedPlanPrice = billingAccess?.prices?.diet_plans?.[planDuration] ?? (
    planDuration === "1 week" ? 9 : planDuration === "1 month" ? 15 : 30
  );

  const handleLanguageToggle = () => {
    const next = language === "en" ? "ar" : "en";
    setLanguage(next);
    localStorage.setItem("tayibat-guidance-language", next);
  };

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const loadBillingAccess = useCallback(async (force = false) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) { setBillingAccess(null); return; }

    const requestKey = String(selectedConditionId || "none");
    if (!force && loadedBillingKeyRef.current === requestKey) return;
    loadedBillingKeyRef.current = requestKey;

    try {
      const { data } = await api.get<BillingAccess>("/billing/access", {
        params: selectedConditionId ? { condition_id: selectedConditionId } : undefined,
      });
      setBillingAccess(data);
    } catch {
      setBillingAccess(null);
      loadedBillingKeyRef.current = null;
    }
  }, [selectedConditionId]);

  const startCheckout = async (type: "premium" | "diet_plan", duration?: string) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) { setNotice("Please log in before upgrading or buying a diet plan."); return; }

    setLoading((s) => ({ ...s, billing: true }));
    setNotice("");
    try {
      const { data } = await api.post<{
        message?: string;
        checkout_url?: string | null;
        whish_configured?: boolean;
      }>("/billing/checkout", {
        type,
        duration,
        condition_id: type === "diet_plan" ? selectedCondition?.id : undefined,
      });

      if (data.checkout_url) {
        window.location.assign(data.checkout_url);
        return;
      }

      setNotice(data.message || "Payment is not ready yet. Please check the payment settings.");
      await loadBillingAccess(true);
    } catch (e) {
      setNotice(getApiMessage(e, "Unable to start payment."));
    } finally {
      setLoading((s) => ({ ...s, billing: false }));
    }
  };

  /* Load conditions */
  useEffect(() => {
    conditionsRequest = conditionsRequest || api.get<Condition[]>("/conditions")
      .then(({ data }) => data)
      .catch((error) => {
        conditionsRequest = null;
        throw error;
      });

    conditionsRequest
      .then((data) => {
        setConditions(data);
        const stored = localStorage.getItem("selectedCondition");
        const authToken = localStorage.getItem("authToken");
        const match = data.find((c) => c.name === stored);
        if (match) setSelectedCondition((current) => current?.id === match.id ? current : match);
        if (!authToken) return;
        api.get<{ condition?: string | null }>("/user/condition")
          .then(({ data: ud }) => {
            const db = data.find((c) => c.name === ud.condition);
            if (db) {
              localStorage.setItem("selectedCondition", db.name);
              setSelectedCondition((current) => current?.id === db.id ? current : db);
            }
          })
          .catch(() => {
            if (match) setSelectedCondition((current) => current?.id === match.id ? current : match);
          });
      })
      .catch((e) => setNotice(getApiMessage(e, "Unable to load health goals.")))
      .finally(() => setLoading((s) => ({ ...s, conditions: false })));
  }, []);

  /* Load food rules */
  useEffect(() => {
    if (!selectedConditionId || !selectedConditionName) return;

    const requestKey = `${selectedConditionId}:${selectedConditionName}`;
    if (loadedRulesKeyRef.current === requestKey) {
      void loadBillingAccess();
      return;
    }

    loadedRulesKeyRef.current = requestKey;
    setLoading((s) => ({ ...s, rules: true }));
    setNotice("");

    api.get<FoodRule[]>(`/rules/${encodeURIComponent(selectedConditionName)}`)
      .then(({ data }) => setFoodRules(data))
      .catch((e) => {
        loadedRulesKeyRef.current = null;
        setFoodRules([]);
        setNotice(getApiMessage(e, "Unable to load food guidance."));
      })
      .finally(() => setLoading((s) => ({ ...s, rules: false })));

    void loadBillingAccess();
  }, [selectedConditionId, selectedConditionName, loadBillingAccess]);

  /* Restore diet plan */
  useEffect(() => {
    if (!selectedCondition) return;
    queueMicrotask(() => {
      const saved = localStorage.getItem(getDietPlanKey(selectedCondition.id));
      if (!saved) { setDietPlan(null); return; }
      try {
        const parsed = JSON.parse(saved) as StoredDietPlan;
        if (parsed.conditionId !== selectedCondition.id || !parsed.dietPlan) { setDietPlan(null); return; }
        setPlanDuration(parsed.duration || durations[0]);
        setDietPlan(parsed.dietPlan);
      } catch { localStorage.removeItem(getDietPlanKey(selectedCondition.id)); setDietPlan(null); }
    });
  }, [selectedCondition]);

  /* Restore chat */
  useEffect(() => {
    if (!selectedCondition) return;
    queueMicrotask(() => {
      const saved = localStorage.getItem(getChatHistoryKey(selectedCondition.id));
      if (!saved) { setChatHistory([]); return; }
      try {
        const parsed = JSON.parse(saved) as StoredChatHistory;
        if (parsed.conditionId !== selectedCondition.id || !Array.isArray(parsed.messages)) { setChatHistory([]); return; }
        setChatHistory(parsed.messages);
      } catch { localStorage.removeItem(getChatHistoryKey(selectedCondition.id)); setChatHistory([]); }
    });
  }, [selectedCondition]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const allowedRules = useMemo(() => foodRules.filter((r) => r.status !== "avoid"), [foodRules]);
  const avoidRules   = useMemo(() => foodRules.filter((r) => r.status === "avoid"), [foodRules]);
  const visibleAllowedRules = isPremium ? allowedRules : allowedRules.slice(0, 5);
  const visibleAvoidRules = isPremium ? avoidRules : avoidRules.slice(0, 5);

  const handleSelectCondition = async (condition: Condition) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setFeedbackNotice(null);
      setNotice("You must log in to select a goal.");
      return;
    }
    setSelectedCondition(condition); setDietPlan(null); setIsPlanOpen(false);
    localStorage.setItem("selectedCondition", condition.name);
    setActiveTab("foods");
    try { await api.post("/user/condition", { condition: condition.name }); }
    catch (e) { setNotice(getApiMessage(e, "Goal selected, but couldn't be saved to your profile.")); }
  };

  const handleClearCondition = () => {
    setSelectedCondition(null); setFoodRules([]); setDietPlan(null);
    setIsPlanOpen(false); setChatHistory([]); setFeedbackMessage("");
    setFeedbackRating("5"); setFeedbackNotice(null); setNotice("");
    loadedRulesKeyRef.current = null;
    loadedBillingKeyRef.current = null;
    localStorage.removeItem("selectedCondition");
    setActiveTab("goals");
  };

  const handleGeneratePlan = async () => {
    if (!selectedCondition) { setNotice("Select a health goal first."); return; }
    if (!billingAccess?.diet_plan_access?.[planDuration]) {
      setNotice(`Purchase the ${planDuration} diet plan package for ${goalName || "this goal"} for $${selectedPlanPrice} before generating this plan.`);
      return;
    }
    setLoading((s) => ({ ...s, plan: true })); setNotice(""); setDietPlan(null);
    try {
      const { data } = await api.post<DietPlanResponse>("/diet-plan", {
        condition: selectedCondition.id, duration: planDuration,
      });
      setDietPlan(data); setIsPlanOpen(true);
      await loadBillingAccess(true);
      localStorage.setItem(getDietPlanKey(selectedCondition.id), JSON.stringify({
        conditionId: selectedCondition.id, conditionName: selectedCondition.name,
        duration: planDuration, dietPlan: data,
      } satisfies StoredDietPlan));
    } catch (e) { setNotice(getApiMessage(e, "Diet plan generation is unavailable.")); }
    finally { setLoading((s) => ({ ...s, plan: false })); }
  };

  const handleDownloadPlanPdf = () => {
    if (!dietPlan) return;
    const pw = window.open("", "_blank", "width=1100,height=800");
    if (!pw) { setNotice("Allow pop-ups to download the PDF."); return; }
    const condName = localizedConditionName(selectedCondition, language) || dietPlan.condition || "Diet plan";
    const instructionsMarkup = getDietPlanInstructions(selectedCondition?.name || dietPlan.condition, language)
      .map((i) => `<li>${escapeHtml(i)}</li>`)
      .join("");
    const daysMarkup = dietPlan.plan.map((day) => `
      <section class="day">
        <h2>${escapeHtml(translateDayLabel(day, language))}</h2>
        <table><thead><tr><th>${escapeHtml(t.meal)}</th><th>${escapeHtml(t.food)}</th><th>${escapeHtml(t.status)}</th></tr></thead>
        <tbody>${day.meals.map((m) => `<tr>
          <td>${escapeHtml(translateMeal(m.meal, language))}</td>
          <td>${escapeHtml(language === "ar" ? m.food_ar || m.food : m.food)}</td>
          <td>${escapeHtml(translateStatus(m.status, language))}</td>
        </tr>`).join("")}</tbody></table>
      </section>`).join("");
    pw.document.write(`<!doctype html><html lang="${language}" dir="${isArabic ? "rtl" : "ltr"}">
      <head><title>${escapeHtml(condName)} — ${escapeHtml(t.generatedPlan)}</title>
      <style>body{font-family:Georgia,serif;color:#111;margin:36px}h1{font-size:26px;margin:0 0 6px}
      .day{break-inside:avoid;margin-bottom:20px}h2{font-size:17px;color:#166534;margin:0 0 8px}
      table{border-collapse:collapse;width:100%}th,td{border:1px solid #d1d5db;padding:9px;text-align:${isArabic?"right":"left"}}
      th{background:#f0fdf4;color:#166534}.instructions{border:1px solid #bbf7d0;background:#f0fdf4;padding:18px;margin-top:28px}
      .instructions h2{margin-bottom:10px}li{margin-bottom:6px;color:#374151}</style></head>
      <body><header style="border-bottom:2px solid #16a34a;margin-bottom:24px;padding-bottom:14px">
      <h1>${escapeHtml(condName)} — ${escapeHtml(t.generatedPlan)}</h1>
      <p style="color:#6b7280">${escapeHtml(durationLabels[language][dietPlan.duration || planDuration] || planDuration)}</p>
      </header>${daysMarkup}
      <section class="instructions"><h2>${escapeHtml(t.instructions)}</h2><ul>${instructionsMarkup}</ul></section>
      </body></html>`);
    pw.document.close(); pw.focus(); pw.print();
  };

  const handleChatSend = async () => {
    if (!selectedCondition) { setNotice("Select a health goal first."); return; }
    if (!chatMessage.trim()) return;
    if (!localStorage.getItem("authToken")) { setNotice("Please log in to use the AI guide."); return; }
    const outgoing = chatMessage.trim();
    const authToken = localStorage.getItem("authToken");
    const save = (msgs: ChatMessage[]) => {
      setChatHistory((curr) => {
        const next = [...curr, ...msgs];
        localStorage.setItem(getChatHistoryKey(selectedCondition.id), JSON.stringify({
          conditionId: selectedCondition.id, conditionName: selectedCondition.name, messages: next,
        } satisfies StoredChatHistory));
        return next;
      });
    };
    setChatMessage(""); setLoading((s) => ({ ...s, chat: true })); setNotice("");
    try {
      save([{ role: "user", text: outgoing }]);
      const { data } = await axios.post<{ reply: string }>("/api/guidance-agent", {
        condition: selectedCondition.id, conditionName: selectedCondition.name,
        language, message: outgoing, chatHistory,
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      await loadBillingAccess(true);
      save([{ role: "assistant", text: data.reply }]);
    } catch (e) {
      const message = getApiMessage(e, "Guidance chat unavailable.");
      setNotice(message);
      if (axios.isAxiosError(e) && e.response?.status === 402) {
        save([{ role: "assistant", text: `${message} Upgrade to Premium for $${premiumPrice}.` }]);
      } else {
        save([{ role: "assistant", text: message }]);
      }
      await loadBillingAccess(true);
    }
    finally { setLoading((s) => ({ ...s, chat: false })); }
  };

  const handleFeedbackSubmit = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) { setFeedbackNotice({ message: t.feedbackLoginRequired, type: "error" }); return; }
    if (!selectedCondition) { setFeedbackNotice({ message: t.feedbackSelectGoal, type: "error" }); return; }
    if (!feedbackMessage.trim()) return;
    setLoading((s) => ({ ...s, feedback: true })); setFeedbackNotice(null);
    try {
      const { data } = await api.post<{ message?: string }>("/guidance-feedback", {
        condition_id: selectedCondition.id, rating: Number(feedbackRating), message: feedbackMessage.trim(),
      });
      setFeedbackMessage(""); setFeedbackRating("5");
      setFeedbackNotice({ message: data.message || t.feedbackSaved, type: "success" });
    } catch (e) { setFeedbackNotice({ message: getApiMessage(e, "Unable to submit feedback."), type: "error" }); }
    finally { setLoading((s) => ({ ...s, feedback: false })); }
  };

  /* ── render helpers ────────────────────────────────────────────────────── */
  const goalName = localizedConditionName(selectedCondition, language);

  const renderGoalsPanel = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="font-display text-2xl font-bold text-stone-900">{t.goalSelection}</h2>
        <p className="mt-1 text-sm text-stone-500">{t.intro}</p>
      </div>
      {loading.conditions && (
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> {t.loadingGoals}
        </div>
      )}
      {!loading.conditions && conditions.length === 0 && (
        <p className="text-sm text-stone-500">{t.noGoals}</p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {conditions.map((condition) => {
          const active = selectedCondition?.id === condition.id;
          return (
            <button
              key={condition.id}
              onClick={() => handleSelectCondition(condition)}
              className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                ${active
                  ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100"
                  : "border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                }`}
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 transition-all ${active ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-transparent group-hover:bg-emerald-200"}`} />
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${active ? "text-emerald-800" : "text-stone-800"}`}>
                  {localizedConditionName(condition, language)}
                </span>
                {active && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </div>
              {active && <p className="mt-1 text-xs text-emerald-600">{t.currentGoal}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderFoodsPanel = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-stone-900">{t.step2}</h2>
          {goalName && <p className="mt-0.5 text-sm font-medium text-emerald-600">{goalName}</p>}
        </div>
        {loading.rules && <RefreshCw className="mt-1 h-4 w-4 animate-spin text-stone-400" />}
      </div>
      {selectedCondition && !loading.rules && foodRules.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t.noFoodRules}
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <FoodColumn title={t.allowedTitle} rules={visibleAllowedRules} language={language} variant="allowed" t={t} />
        <FoodColumn title={t.avoidTitle}   rules={visibleAvoidRules}   language={language} variant="avoid"   t={t} />
      </div>
      {!isPremium && (allowedRules.length >= 5 || avoidRules.length >= 5) && (
        <PaywallCard
          title="Unlock the full food tables"
          message={`Free users can see the first 5 rows from each table. Upgrade to Premium for all rows and unlimited AI questions.`}
          price={`$${premiumPrice}`}
          actionLabel={loading.billing ? "Starting payment..." : "Upgrade"}
          onAction={() => startCheckout("premium")}
          disabled={loading.billing}
        />
      )}
    </div>
  );

  const renderChatPanel = () => (
    <div className="flex h-full flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="font-display text-2xl font-bold text-stone-900">{t.guidanceChat}</h2>
        <p className="mt-1 text-sm text-stone-500">{t.chatHelp}</p>
        {!isPremium && (
          <p className="mt-2 text-xs font-semibold text-amber-700">
            Free AI questions: {billingAccess?.ai.remaining ?? 2} remaining. Premium gives unlimited AI guidance.
          </p>
        )}
      </div>
      {!isPremium && billingAccess?.ai.remaining === 0 && (
        <PaywallCard
          title="AI limit reached"
          message="Free users can ask 2 AI questions total. Upgrade to Premium for unlimited guidance."
          price={`$${premiumPrice}`}
          actionLabel={loading.billing ? "Starting payment..." : "Upgrade"}
          onAction={() => startCheckout("premium")}
          disabled={loading.billing}
        />
      )}
      {/* Chat window */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50/60 p-4 space-y-3 min-h-[280px] max-h-[420px] lg:max-h-none">
        {chatHistory.length === 0 && (
          <div className="flex h-full min-h-[120px] items-center justify-center">
            <p className="text-center text-sm text-stone-400">{t.chatEmpty}</p>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? (isArabic ? "justify-start" : "justify-end") : (isArabic ? "justify-end" : "justify-start")}`}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
              ${msg.role === "user"
                ? "rounded-br-sm bg-emerald-600 text-white"
                : "rounded-bl-sm bg-white text-stone-800 shadow-sm border border-stone-100"
              }`} dir="auto">
              {msg.text}
            </div>
          </div>
        ))}
        {loading.chat && (
          <div className={`flex ${isArabic ? "justify-end" : "justify-start"}`}>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm border border-stone-100">
              {[0,1,2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      {/* Input */}
      <div className="flex gap-2">
        <input
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleChatSend(); }}
          placeholder={t.chatPlaceholder}
          disabled={!isPremium && billingAccess?.ai.remaining === 0}
          className="min-h-11 flex-1 rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <button
          onClick={handleChatSend}
          disabled={loading.chat || !chatMessage.trim() || (!isPremium && billingAccess?.ai.remaining === 0)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderPlanPanel = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="font-display text-2xl font-bold text-stone-900">{t.dietPlanGenerator}</h2>
        <p className="mt-1 text-sm text-stone-500">{t.planHelp}</p>
      </div>
      {/* Duration selector */}
      <div className="flex flex-wrap gap-2">
        {durations.map((d) => (
          <button
            key={d}
            onClick={() => setPlanDuration(d)}
            className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition
              ${planDuration === d
                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                : "border-stone-200 bg-white text-stone-600 hover:border-emerald-200"
              }`}
          >
            {durationLabels[language][d]}
          </button>
        ))}
      </div>
      {!billingAccess?.diet_plan_access?.[planDuration] && (
        <PaywallCard
          title={`${durationLabels[language][planDuration]} plan package`}
          message={`Diet plans are purchased per health goal. Buy this duration for ${goalName || "the selected goal"} before generating it.`}
          price={`$${selectedPlanPrice}`}
          actionLabel={loading.billing ? "Starting payment..." : "Buy"}
          onAction={() => startCheckout("diet_plan", planDuration)}
          disabled={loading.billing}
        />
      )}
      <button
        onClick={handleGeneratePlan}
        disabled={loading.plan || !selectedCondition || !billingAccess?.diet_plan_access?.[planDuration]}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading.plan
          ? <><RefreshCw className="h-4 w-4 animate-spin" /> {t.generating}</>
          : <><CalendarDays className="h-4 w-4" /> {t.generate}</>
        }
      </button>
      {dietPlan && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          {dietPlan.message && <p className="mb-4 text-sm text-stone-700" dir="auto">{dietPlan.message}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setIsPlanOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              <CalendarDays className="h-4 w-4" /> {t.viewGeneratedPlan}
            </button>
            <button
              onClick={handleDownloadPlanPdf}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {dietPlan && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-stone-800">{t.instructions}</h3>
          <ul className={`space-y-2 text-sm leading-relaxed text-stone-600 ${isArabic ? "list-none pr-0" : "list-none pl-0"}`}>
            {getDietPlanInstructions(selectedCondition?.name, language).map((instr, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {instr}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderFeedbackPanel = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="font-display text-2xl font-bold text-stone-900">{t.feedbackTitle}</h2>
        <p className="mt-1 text-sm text-stone-500">{t.feedbackHelp}</p>
        {goalName && (
          <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{goalName}</span>
        )}
      </div>
      {/* Star rating */}
      <div>
        <p className="mb-2 text-sm font-medium text-stone-700">{t.feedbackRating}</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((star) => (
            <button
              key={star}
              onClick={() => setFeedbackRating(String(star))}
              disabled={!selectedCondition}
              className="transition hover:scale-110 disabled:cursor-not-allowed"
            >
              <Star className={`h-7 w-7 ${Number(feedbackRating) >= star ? "fill-amber-400 text-amber-400" : "text-stone-300"}`} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-stone-700">{t.feedbackMessage}</p>
        <textarea
          value={feedbackMessage}
          onChange={(e) => { setFeedbackMessage(e.target.value); setFeedbackNotice(null); }}
          disabled={!selectedCondition || loading.feedback}
          rows={4}
          placeholder={t.feedbackPlaceholder}
          className="w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-stone-50"
        />
      </div>
      <button
        onClick={handleFeedbackSubmit}
        disabled={!selectedCondition || !feedbackMessage.trim() || loading.feedback}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading.feedback ? <><RefreshCw className="h-4 w-4 animate-spin" /> {t.submittingFeedback}</> : t.submitFeedback}
      </button>
      {feedbackNotice && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium
          ${feedbackNotice.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {feedbackNotice.message}
        </div>
      )}
    </div>
  );

  const panelContent: Record<ActiveTab, React.ReactNode> = {
    goals:    renderGoalsPanel(),
    foods:    renderFoodsPanel(),
    chat:     renderChatPanel(),
    plan:     renderPlanPanel(),
    feedback: renderFeedbackPanel(),
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Lora', Georgia, serif; }
        body, * { font-family: 'DM Sans', system-ui, sans-serif; }
        .animate-in { animation: animIn 0.3s ease both; }
        .fade-in { --tw-enter-opacity: 0; }
        .slide-in-from-bottom-3 { --tw-enter-translate-y: 12px; }
        @keyframes animIn {
          from { opacity: var(--tw-enter-opacity, 1); transform: translateY(var(--tw-enter-translate-y, 0)); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="min-h-screen bg-[#fafaf8]"
        dir={isArabic ? "rtl" : "ltr"}
        lang={language}
      >
        {/* ── Page header ───────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#fafaf8]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 sm:px-6">
            {/* Left: page name + goal badge */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">{t.pageName}</p>
                {goalName
                  ? <p className="truncate text-sm font-semibold text-emerald-700">{goalName}</p>
                  : <p className="text-sm text-stone-400">{t.notSelected}</p>
                }
              </div>
            </div>
            {/* Right: change goal + language */}
            <div className="flex items-center gap-2 shrink-0">
              {selectedCondition && (
                <button
                  onClick={handleClearCondition}
                  className="hidden rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-red-300 hover:text-red-600 sm:block"
                >
                  {t.change}
                </button>
              )}
              <button
                onClick={handleLanguageToggle}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 transition hover:border-emerald-400"
              >
                {t.languageLabel}
              </button>
            </div>
          </div>
        </header>

        {/* ── Global notice ─────────────────────────────────────────────── */}
        {notice && (
          <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center px-4">
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border border-amber-200 bg-white px-5 py-4 text-center text-sm font-semibold text-stone-900 shadow-2xl shadow-stone-900/20"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                !
              </span>
              <span className="leading-6">{notice}</span>
            </div>
          </div>
        )}

        {/* ── DESKTOP LAYOUT (lg+): sidebar steps + content ──────────────
             Sidebar is a fixed left column showing step labels.
             Content area switches based on activeTab.
        ─────────────────────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
          <div className="mb-5">
            <MedicalDisclaimerBanner />
          </div>

          <div className="flex gap-6">

            {/* Desktop sidebar */}
            <aside className="hidden w-48 shrink-0 lg:block xl:w-56">
              <div className="sticky top-24 space-y-1">
                {TABS.map((tab, idx) => {
                  const active = activeTab === tab.id;
                  const done = TABS.findIndex((t) => t.id === activeTab) > idx;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all
                        ${active
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                          : done
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                        }`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs
                        ${active ? "bg-white/20" : done ? "bg-emerald-100" : "bg-stone-200 group-hover:bg-stone-300"}`}>
                        {tab.icon}
                      </span>
                      <span>{isArabic ? tab.arLabel : tab.enLabel}</span>
                      {active && <ChevronRight className={`ml-auto h-3.5 w-3.5 ${isArabic ? "rotate-180" : ""}`} />}
                    </button>
                  );
                })}

                {/* Goal card in sidebar */}
                {selectedCondition && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{t.currentGoal}</p>
                    <p className="mt-1 text-sm font-bold text-emerald-800">{goalName}</p>
                    <button
                      onClick={handleClearCondition}
                      className="mt-2 text-xs text-stone-400 hover:text-red-500 transition"
                    >
                      {t.change}
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* Main content */}
            <main className="min-w-0 flex-1">
              {/* ── MOBILE tab bar ──────────────────────────────────────── */}
              <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-1 shadow-sm lg:hidden">
                {TABS.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-1 shrink-0 flex-col items-center gap-1 rounded-xl py-2 px-1.5 text-[11px] font-semibold transition
                        ${active ? "bg-emerald-600 text-white shadow-sm" : "text-stone-500 hover:bg-stone-50"}`}
                    >
                      {tab.icon}
                      {isArabic ? tab.arLabel : tab.enLabel}
                    </button>
                  );
                })}
              </div>

              {/* Panel content */}
              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
                {panelContent[activeTab]}
              </div>
            </main>
          </div>
        </div>

        {/* ── Plan modal ────────────────────────────────────────────────── */}
        {dietPlan && isPlanOpen && (
          <PlanViewer
            plan={dietPlan}
            conditionName={
              localizedConditionName(selectedCondition, language) ||
              (isArabic ? dietPlan.condition_ar || dietPlan.condition : dietPlan.condition) || "Diet Plan"
            }
            conditionKey={selectedCondition?.name || dietPlan.condition || ""}
            language={language}
            onClose={() => setIsPlanOpen(false)}
            onDownload={handleDownloadPlanPdf}
            t={t}
          />
        )}
      </div>
    </>
  );
}

function PaywallCard({
  title, message, price, actionLabel, onAction, disabled,
}: {
  title: string;
  message: string;
  price: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-semibold text-stone-900">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-stone-600">{message}</p>
          </div>
        </div>
        <button
          onClick={onAction}
          disabled={disabled}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CreditCard className="h-4 w-4" />
          {actionLabel} <span className="text-emerald-300">{price}</span>
        </button>
      </div>
    </div>
  );
}

/* ─── FoodColumn ──────────────────────────────────────────────────────────── */
function FoodColumn({
  title, rules, language, variant, t,
}: {
  title: string;
  rules: FoodRule[];
  language: GuidanceLanguage;
  variant: "allowed" | "avoid";
  t: GuidanceText;
}) {
  const isAvoid = variant === "avoid";
  return (
    <div className={`overflow-hidden rounded-2xl border ${isAvoid ? "border-red-100" : "border-emerald-100"}`}>
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 ${isAvoid ? "bg-red-50" : "bg-emerald-50"}`}>
        <span className={`h-2 w-2 rounded-full ${isAvoid ? "bg-red-400" : "bg-emerald-500"}`} />
        <h3 className={`font-semibold ${isAvoid ? "text-red-800" : "text-emerald-800"}`}>{title}</h3>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold
          ${isAvoid ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
          {rules.length}
        </span>
      </div>

      {/* Mobile card list */}
      <div className="divide-y divide-stone-100 sm:hidden">
        {rules.length === 0 && <p className="px-4 py-4 text-sm text-stone-400">{t.noMatchingRules}</p>}
        {rules.map((rule) => (
          <div key={`${rule.id}-${rule.status}-m`} className="bg-white px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <span className="font-semibold text-stone-900 text-sm" dir="auto">
                {localizedFoodName(rule.food, language)}
              </span>
              <StatusPill status={rule.status} language={language} />
            </div>
            <p className="mt-1.5 text-xs leading-5 text-stone-500" dir="auto">
              {localizedRuleReason(rule, language)}
            </p>
            {rule.max_servings && (
              <p className="mt-1 text-xs font-medium text-stone-600">{t.maxServings}: {rule.max_servings}</p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className={`w-full table-fixed text-sm ${language === "ar" ? "text-right" : "text-left"}`}>
          <colgroup><col className="w-[28%]" /><col className="w-[18%]" /><col className="w-[54%]" /></colgroup>
          <thead>
            <tr className={isAvoid ? "bg-red-50/70 text-red-800" : "bg-emerald-50/70 text-emerald-800"}>
              {[t.food, t.status, t.reason].map((h) => (
                <th key={h} className={`border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ${isAvoid ? "border-red-100" : "border-emerald-100"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {rules.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-4 text-sm text-stone-400">{t.noMatchingRules}</td></tr>
            )}
            {rules.map((rule) => (
              <tr key={`${rule.id}-${rule.status}`} className="align-top hover:bg-stone-50 transition-colors">
                <td className="break-words px-4 py-3 font-medium text-stone-900" dir="auto">
                  {localizedFoodName(rule.food, language)}
                </td>
                <td className="px-4 py-3"><StatusPill status={rule.status} language={language} /></td>
                <td className="break-words px-4 py-3 leading-5 text-stone-500" dir="auto">
                  {localizedRuleReason(rule, language)}
                  {rule.max_servings && (
                    <span className="mt-1 block text-xs font-medium text-stone-600">{t.maxServings}: {rule.max_servings}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── StatusPill ──────────────────────────────────────────────────────────── */
function StatusPill({ status, language }: { status: string; language: GuidanceLanguage }) {
  const colors: Record<string, string> = {
    allowed:  "bg-emerald-100 text-emerald-700",
    moderate: "bg-amber-100 text-amber-700",
    avoid:    "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || "bg-stone-100 text-stone-600"}`}>
      {translateStatus(status, language)}
    </span>
  );
}

/* ─── PlanViewer modal ────────────────────────────────────────────────────── */
function PlanViewer({
  plan, conditionName, conditionKey, language, onClose, onDownload, t,
}: {
  plan: DietPlanResponse;
  conditionName: string;
  conditionKey: string;
  language: GuidanceLanguage;
  onClose: () => void;
  onDownload: () => void;
  t: GuidanceText;
}) {
  const isArabic = language === "ar";
  const instructions = getDietPlanInstructions(conditionKey || plan.condition, language);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-stone-900">{conditionName}</h2>
            <p className="text-sm text-stone-500">
              {durationLabels[language][plan.duration || ""] || plan.duration}
              {plan.days ? ` · ${plan.days} days` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" /> {t.downloadPdf}
            </button>
            <button
              onClick={onClose}
              aria-label={t.closePlan}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:bg-stone-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Modal body */}
        <div className="overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {plan.plan.map((day) => (
              <div key={day.day} className="rounded-xl border border-stone-200 bg-stone-50/60 overflow-hidden">
                <div className="border-b border-stone-200 bg-white px-4 py-2.5">
                  <h3 className="text-sm font-bold text-stone-800">{translateDayLabel(day, language)}</h3>
                </div>
                <div className="divide-y divide-stone-100">
                  {day.meals.map((meal) => (
                    <div key={`${day.day}-${meal.meal}`} className="flex items-start justify-between gap-3 bg-white px-4 py-2.5 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{translateMeal(meal.meal, language)}</p>
                        <p className="mt-0.5 font-medium text-stone-900" dir="auto">
                          {language === "ar" ? meal.food_ar || meal.food : meal.food}
                        </p>
                      </div>
                      <StatusPill status={meal.status} language={language} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Instructions */}
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="font-display font-bold text-emerald-900">{t.instructions}</h3>
            <ul className="mt-3 space-y-2">
              {instructions.map((instr, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {instr}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
