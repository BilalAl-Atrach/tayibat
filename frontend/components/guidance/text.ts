import type { GuidanceLanguage } from './types';

export const dietPlanInstructions = {
  en: [
    "Don't eat until you feel hungry.",
    "Don't drink until you feel thirsty.",
    "Train 5 days a week for 30–45 minutes.",
    "Avoid food marked as 'avoid' in your selected goal, even if it appears in other general diets.",
    "If a meal causes stomach discomfort, stop and consult a qualified health professional.",
  ],
  ar: [
    "لا تأكل حتى تشعر بالجوع.",
    "لا تشرب حتى تشعر بالعطش.",
    "تمرن 5 أيام في الأسبوع لمدة 30-45 دقيقة.",
    "تجنب الأطعمة المحددة كأطعمة يجب تجنبها في هدفك الصحي.",
    "إذا سبب لك أي طعام انزعاجاً في المعدة، توقف عنه واستشر مختصاً صحياً.",
    "تجنب الأدوية قدر الإمكان إلا عند الحاجة وتحت إشراف مختص.",
  ],
};

export const mealFlexibilityInstruction = {
  en: "It is not necessary to eat breakfast, lunch, and dinner every day. You may choose breakfast and lunch, breakfast and dinner, or all three meals depending on your appetite and hunger levels. If you prefer eating three meals a day, keep the portions moderate and balanced.",
  ar: "\u0644\u064a\u0633 \u0645\u0646 \u0627\u0644\u0636\u0631\u0648\u0631\u064a \u062a\u0646\u0627\u0648\u0644 \u0648\u062c\u0628\u0627\u062a \u0627\u0644\u0625\u0641\u0637\u0627\u0631 \u0648\u0627\u0644\u063a\u062f\u0627\u0621 \u0648\u0627\u0644\u0639\u0634\u0627\u0621 \u064a\u0648\u0645\u064a\u0627\u064b. \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0627\u0643\u062a\u0641\u0627\u0621 \u0628\u0648\u062c\u0628\u062a\u064a\u0646 \u0641\u0642\u0637\u060c \u0645\u062b\u0644 \u0627\u0644\u0625\u0641\u0637\u0627\u0631 \u0648\u0627\u0644\u063a\u062f\u0627\u0621 \u0623\u0648 \u0627\u0644\u0625\u0641\u0637\u0627\u0631 \u0648\u0627\u0644\u0639\u0634\u0627\u0621\u060c \u0648\u0630\u0644\u0643 \u062d\u0633\u0628 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062c\u0648\u0639 \u0648\u0627\u0644\u0634\u0647\u064a\u0629 \u0644\u062f\u064a\u0643. \u0648\u0625\u0630\u0627 \u0643\u0646\u062a \u062a\u0641\u0636\u0644 \u062a\u0646\u0627\u0648\u0644 \u062b\u0644\u0627\u062b \u0648\u062c\u0628\u0627\u062a \u064a\u0648\u0645\u064a\u0627\u064b\u060c \u0641\u0627\u062d\u0631\u0635 \u0639\u0644\u0649 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0627\u0644\u0643\u0645\u064a\u0627\u062a \u0645\u0639\u062a\u062f\u0644\u0629 \u0648\u0645\u062a\u0648\u0627\u0632\u0646\u0629.",
} as const;

export const fastingInstruction = {
  en: "You must try to fast 2 days a week.",
  ar: "\u064a\u062c\u0628 \u0623\u0646 \u062a\u062d\u0627\u0648\u0644 \u0627\u0644\u0635\u064a\u0627\u0645 \u064a\u0648\u0645\u064a\u0646 \u0641\u064a \u0627\u0644\u0623\u0633\u0628\u0648\u0639.",
} as const;

export const isMealFlexibilityInstruction = (instruction: string, language: GuidanceLanguage) =>
  instruction === mealFlexibilityInstruction[language];

export const importantInstructionLabel = (language: GuidanceLanguage) =>
  language === "ar" ? "\u0645\u0647\u0645" : "Important";

export const conditionDietPlanInstructions = {
  healthy: {
    en: [
      "Read food labels before buying packaged foods.",
      "Prepare healthy meals at home more often.",
      "Focus on the drinks in your diet plan.",
      mealFlexibilityInstruction.en,
      fastingInstruction.en,
    ],
    ar: [
      "\u0627\u0642\u0631\u0623 \u0645\u0644\u0635\u0642\u0627\u062a \u0627\u0644\u0637\u0639\u0627\u0645 \u0642\u0628\u0644 \u0634\u0631\u0627\u0621 \u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u0645\u0639\u0644\u0628\u0629.",
      "\u062d\u0636\u0631 \u0648\u062c\u0628\u0627\u062a \u0635\u062d\u064a\u0629 \u0641\u064a \u0627\u0644\u0645\u0646\u0632\u0644 \u0628\u0634\u0643\u0644 \u0623\u0643\u062b\u0631.",
      "\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u0631\u0648\u0628\u0627\u062a \u0627\u0644\u0645\u0648\u062c\u0648\u062f\u0629 \u0641\u064a \u062e\u0637\u0629 \u0646\u0638\u0627\u0645\u0643 \u0627\u0644\u063a\u0630\u0627\u0626\u064a.",
      mealFlexibilityInstruction.ar,
      fastingInstruction.ar,
    ],
  },
  diabetes: {
    en: [
      "Never eat carbs alone — always pair with protein or healthy fat to slow glucose absorption",
      "We supported your diet plan with limit healthy sugar to stay energized.",
      "Choose whole grain bread and brown rice.",
      "Drink green tea daily — it helps with insulin sensitivity.",
      "Use olive oil as your only cooking fat.",
      mealFlexibilityInstruction.en,
      fastingInstruction.en,
    ],
    ar: [
      "\u0644\u0627 \u062a\u0623\u0643\u0644 \u0627\u0644\u0643\u0631\u0628\u0648\u0647\u064a\u062f\u0631\u0627\u062a \u0648\u062d\u062f\u0647\u0627\u061b \u0627\u062c\u0645\u0639\u0647\u0627 \u062f\u0627\u0626\u0645\u0627\u064b \u0645\u0639 \u0628\u0631\u0648\u062a\u064a\u0646 \u0623\u0648 \u062f\u0647\u0648\u0646 \u0635\u062d\u064a\u0629 \u0644\u0625\u0628\u0637\u0627\u0621 \u0627\u0645\u062a\u0635\u0627\u0635 \u0627\u0644\u063a\u0644\u0648\u0643\u0648\u0632.",
      "\u062f\u0639\u0645\u0646\u0627 \u062e\u0637\u062a\u0643 \u0627\u0644\u063a\u0630\u0627\u0626\u064a\u0629 \u0628\u0643\u0645\u064a\u0629 \u0645\u062d\u062f\u0648\u062f\u0629 \u0645\u0646 \u0627\u0644\u0633\u0643\u0631 \u0627\u0644\u0635\u062d\u064a \u0644\u062a\u0628\u0642\u0649 \u0646\u0634\u064a\u0637\u0627\u064b.",
      "\u0627\u062e\u062a\u0631 \u062e\u0628\u0632 \u0627\u0644\u062d\u0628\u0648\u0628 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u0648\u0627\u0644\u0623\u0631\u0632 \u0627\u0644\u0628\u0646\u064a.",
      "\u0627\u0634\u0631\u0628 \u0627\u0644\u0634\u0627\u064a \u0627\u0644\u0623\u062e\u0636\u0631 \u064a\u0648\u0645\u064a\u0627\u064b\u061b \u0641\u0647\u0648 \u064a\u0633\u0627\u0639\u062f \u0639\u0644\u0649 \u062d\u0633\u0627\u0633\u064a\u0629 \u0627\u0644\u0623\u0646\u0633\u0648\u0644\u064a\u0646.",
      "\u0627\u0633\u062a\u062e\u062f\u0645 \u0632\u064a\u062a \u0627\u0644\u0632\u064a\u062a\u0648\u0646 \u0643\u062f\u0647\u0646 \u0627\u0644\u0637\u0647\u064a \u0627\u0644\u0648\u062d\u064a\u062f.",
      mealFlexibilityInstruction.ar,
      fastingInstruction.ar,
    ],
  },
  weight: {
    en: [
      "Count portions not just food types — a healthy food in large amounts still causes weight gain.",
      "Prioritize protein and fiber-rich foods to support fullness.",
      "Eat slowly.",
      "Make dinner your lightest meal of the day.",
      mealFlexibilityInstruction.en,
      fastingInstruction.en,
    ],
    ar: [
      "\u0627\u062d\u0633\u0628 \u0627\u0644\u062d\u0635\u0635 \u0648\u0644\u064a\u0633 \u0646\u0648\u0639 \u0627\u0644\u0637\u0639\u0627\u0645 \u0641\u0642\u0637\u061b \u0641\u0627\u0644\u0637\u0639\u0627\u0645 \u0627\u0644\u0635\u062d\u064a \u0628\u0643\u0645\u064a\u0627\u062a \u0643\u0628\u064a\u0631\u0629 \u0642\u062f \u064a\u0633\u0628\u0628 \u0632\u064a\u0627\u062f\u0629 \u0627\u0644\u0648\u0632\u0646.",
      "\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0628\u0631\u0648\u062a\u064a\u0646 \u0648\u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u063a\u0646\u064a\u0629 \u0628\u0627\u0644\u0623\u0644\u064a\u0627\u0641 \u0644\u062f\u0639\u0645 \u0627\u0644\u0634\u0628\u0639.",
      "\u062a\u0646\u0627\u0648\u0644 \u0627\u0644\u0637\u0639\u0627\u0645 \u0628\u0628\u0637\u0621.",
      "\u0627\u062c\u0639\u0644 \u0627\u0644\u0639\u0634\u0627\u0621 \u0623\u062e\u0641 \u0648\u062c\u0628\u0629 \u0641\u064a \u0627\u0644\u064a\u0648\u0645.",
      mealFlexibilityInstruction.ar,
      fastingInstruction.ar,
    ],
  },
  digestive: {
    en: [
      "Eat slowly and stop any meal that causes stomach discomfort.",
      "Avoid spicy or irritating foods, especially if symptoms are active.",
      mealFlexibilityInstruction.en,
      fastingInstruction.en,
      "Chew your food thoroughly — digestion begins in the mouth.",
    ],
    ar: [
      "\u062a\u0646\u0627\u0648\u0644 \u0627\u0644\u0637\u0639\u0627\u0645 \u0628\u0628\u0637\u0621 \u0648\u062a\u0648\u0642\u0641 \u0639\u0646 \u0623\u064a \u0648\u062c\u0628\u0629 \u062a\u0633\u0628\u0628 \u0627\u0646\u0632\u0639\u0627\u062c\u0627\u064b \u0641\u064a \u0627\u0644\u0645\u0639\u062f\u0629.",
      "\u062a\u062c\u0646\u0628 \u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u062d\u0627\u0631\u0629 \u0623\u0648 \u0627\u0644\u0645\u0647\u064a\u062c\u0629\u060c \u062e\u0627\u0635\u0629 \u0639\u0646\u062f \u0648\u062c\u0648\u062f \u0623\u0639\u0631\u0627\u0636.",
      mealFlexibilityInstruction.ar,
      fastingInstruction.ar,
      "\u0627\u0645\u0636\u063a \u0637\u0639\u0627\u0645\u0643 \u062c\u064a\u062f\u0627\u064b\u061b \u0641\u0627\u0644\u0647\u0636\u0645 \u064a\u0628\u062f\u0623 \u0641\u064a \u0627\u0644\u0641\u0645.",
    ],
  },
  cholesterol: {
    en: [
      "Prefer foods with healthy fats.",
      "Limit saturated fats, fried foods, and heavy cheese-based meals.",
      "Use olive oil as your only fat.",
      "Avoid butter.",
      mealFlexibilityInstruction.en,
      fastingInstruction.en,
    ],
    ar: [
      "\u0641\u0636\u0644 \u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u062a\u064a \u062a\u062d\u062a\u0648\u064a \u0639\u0644\u0649 \u062f\u0647\u0648\u0646 \u0635\u062d\u064a\u0629.",
      "\u0642\u0644\u0644 \u0627\u0644\u062f\u0647\u0648\u0646 \u0627\u0644\u0645\u0634\u0628\u0639\u0629 \u0648\u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u0645\u0642\u0644\u064a\u0629 \u0648\u0627\u0644\u0648\u062c\u0628\u0627\u062a \u0627\u0644\u062b\u0642\u064a\u0644\u0629 \u0627\u0644\u0645\u0639\u062a\u0645\u062f\u0629 \u0639\u0644\u0649 \u0627\u0644\u062c\u0628\u0646.",
      "\u0627\u0633\u062a\u062e\u062f\u0645 \u0632\u064a\u062a \u0627\u0644\u0632\u064a\u062a\u0648\u0646 \u0643\u062f\u0647\u0646\u0643 \u0627\u0644\u0648\u062d\u064a\u062f.",
      "\u062a\u062c\u0646\u0628 \u0627\u0644\u0632\u0628\u062f\u0629.",
      mealFlexibilityInstruction.ar,
      fastingInstruction.ar,
    ],
  },
  cancer: {
    en: [
      "Avoid raw or undercooked foods.",
      "Stop any food that causes discomfort to your stomach.",
      "Focus on the nature drinks on you diet plan.",
      mealFlexibilityInstruction.en,
      fastingInstruction.en,
    ],
    ar: [
      "\u062a\u062c\u0646\u0628 \u0627\u0644\u0623\u0637\u0639\u0645\u0629 \u0627\u0644\u0646\u064a\u0626\u0629 \u0623\u0648 \u063a\u064a\u0631 \u0627\u0644\u0645\u0637\u0647\u0648\u0629 \u062c\u064a\u062f\u0627\u064b.",
      "\u062a\u0648\u0642\u0641 \u0639\u0646 \u0623\u064a \u0637\u0639\u0627\u0645 \u064a\u0633\u0628\u0628 \u0627\u0646\u0632\u0639\u0627\u062c\u0627\u064b \u0644\u0645\u0639\u062f\u062a\u0643.",
      "\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u0631\u0648\u0628\u0627\u062a \u0627\u0644\u0637\u0628\u064a\u0639\u064a\u0629 \u0641\u064a \u062e\u0637\u0629 \u0646\u0638\u0627\u0645\u0643 \u0627\u0644\u063a\u0630\u0627\u0626\u064a.",
      mealFlexibilityInstruction.ar,
      fastingInstruction.ar,
    ],
  },
} as const;

export const getConditionInstructionKey = (conditionName?: string | null) => {
  const normalized = (conditionName || "").toLowerCase();

  if (normalized.includes("diabetes")) return "diabetes";
  if (normalized.includes("weight")) return "weight";
  if (normalized.includes("digestive")) return "digestive";
  if (normalized.includes("cholesterol")) return "cholesterol";
  if (normalized.includes("cancer")) return "cancer";
  if (normalized.includes("healthy")) return "healthy";

  return null;
};

export const getDietPlanInstructions = (
  conditionName: string | null | undefined,
  language: GuidanceLanguage,
  includePremiumGuidelines = true
) => {
  const conditionKey = getConditionInstructionKey(conditionName);
  const conditionInstructions = includePremiumGuidelines && conditionKey ? conditionDietPlanInstructions[conditionKey][language] : [];
  const instructions = [...dietPlanInstructions[language], ...conditionInstructions];
  const mealInstruction = mealFlexibilityInstruction[language];
  const hasMealInstruction = instructions.includes(mealInstruction);

  return hasMealInstruction
    ? [mealInstruction, ...instructions.filter((instruction) => instruction !== mealInstruction)]
    : instructions;
};

export const uiText = {
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

export type GuidanceText = (typeof uiText)[GuidanceLanguage];

export const durationLabels: Record<GuidanceLanguage, Record<string, string>> = {
  en: { "1 week": "1 week", "1 month": "1 month", "3 months": "3 months" },
  ar: { "1 week": "أسبوع واحد", "1 month": "شهر واحد", "3 months": "3 أشهر" },
};
export const mealLabels: Record<GuidanceLanguage, Record<string, string>> = {
  en: { Breakfast: "Breakfast", Lunch: "Lunch", Dinner: "Dinner", Snack: "Snack" },
  ar: { Breakfast: "الفطور", Lunch: "الغداء", Dinner: "العشاء", Snack: "وجبة خفيفة" },
};
export const statusLabels: Record<GuidanceLanguage, Record<string, string>> = {
  en: { allowed: "Allowed", moderate: "Moderate", avoid: "Avoid" },
  ar: { allowed: "مسموح", moderate: "معتدل", avoid: "تجنب" },
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
