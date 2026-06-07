import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface Condition {
  id: number;
  name: string;
}

interface FoodRule {
  id: number;
  food?: {
    name: string;
    name_ar?: string | null;
  } | null;
  status: "allowed" | "avoid" | "moderate";
  reason?: string | null;
  reason_ar?: string | null;
  max_servings?: string | number | null;
}

interface FoodRuleLookup {
  exists: boolean;
  food?: {
    name: string;
    name_ar?: string | null;
  } | null;
  status?: "allowed" | "avoid" | "moderate";
  reason?: string | null;
  reason_ar?: string | null;
  max_servings?: string | number | null;
}

interface GuidanceAgentRequest {
  message?: string;
  condition?: number | string | null;
  conditionName?: string | null;
  chatHistory?: ChatMessage[];
  language?: "en" | "ar";
}

interface BillingAccess {
  premium?: boolean;
  ai?: {
    free_limit?: number;
    used?: number;
    remaining?: number | null;
    unlimited?: boolean;
  };
}

interface AssistantDashboard {
  profile?: {
    allergies?: string[] | null;
    disliked_foods?: string[] | null;
    preferred_foods?: string[] | null;
    meal_count_preference?: string | null;
    fasting_days_per_week?: number | null;
    budget_level?: string | null;
    language_preference?: string | null;
    notes?: string | null;
  } | null;
  recent_logs?: Array<{
    food_name?: string | null;
    meal_type?: string | null;
  }>;
  reminders?: Array<{
    title?: string | null;
    enabled?: boolean;
  }>;
}

const apiBaseUrl =
  process.env.LARAVEL_API_BASE_URL || "https://tayibat-production.up.railway.app/api";
const authCookieName = "tayibat_auth";

const fetchJson = async <T,>(path: string, authorization?: string | null): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Accept: "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const consumeAiQuestion = async (authorization: string | null) => {
  if (!authorization) {
    return {
      ok: false,
      status: 401,
      message: "Please log in to use the AI guide.",
    };
  }

  const response = await fetch(`${apiBaseUrl}/billing/ai-usage/consume`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: authorization,
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({} as { message?: string }));

  return {
    ok: response.ok,
    status: response.status,
    message: data.message || "AI usage limit reached. Upgrade to Premium for unlimited guidance.",
  };
};

const fetchBillingAccess = async (authorization: string | null) => {
  if (!authorization) return null;

  try {
    return await fetchJson<BillingAccess>("/billing/access", authorization);
  } catch {
    return null;
  }
};

const fetchAssistantDashboard = async (authorization: string | null) => {
  if (!authorization) return null;

  try {
    return await fetchJson<AssistantDashboard>("/assistant/dashboard", authorization);
  } catch {
    return null;
  }
};

const aiLimitResponse = (access: BillingAccess | null) => {
  if (access?.premium || access?.ai?.unlimited) return null;

  const remaining = access?.ai?.remaining;
  if (typeof remaining === "number" && remaining <= 0) {
    return NextResponse.json({
      reply: "Free users can ask 2 AI questions. Upgrade to Premium for unlimited AI guidance.",
    }, { status: 402 });
  }

  return null;
};

const resolveConditionName = async (
  conditionInput: GuidanceAgentRequest["condition"],
  conditionName?: string | null
) => {
  if (conditionName?.trim()) return conditionName.trim();
  if (!conditionInput) return null;

  const conditions = await fetchJson<Condition[]>("/conditions");
  const normalizedInput = String(conditionInput).trim().toLowerCase();
  const condition = conditions.find(
    (item) =>
      String(item.id) === normalizedInput ||
      item.name.trim().toLowerCase() === normalizedInput
  );

  return condition?.name || null;
};

const formatRulesForAgent = (rules: FoodRule[]) =>
  rules
    .map((rule) => {
      const parts = [
        `Food: ${rule.food?.name || "Unknown food"}`,
        rule.food?.name_ar ? `Arabic food: ${rule.food.name_ar}` : "",
        `Status: ${rule.status}`,
      ];

      if (rule.reason) parts.push(`Reason: ${rule.reason}`);
      if (rule.reason_ar) parts.push(`Arabic reason: ${rule.reason_ar}`);
      if (rule.max_servings) parts.push(`Max servings: ${rule.max_servings}`);

      return parts.filter(Boolean).join(" | ");
    })
    .join("\n");

const formatHistory = (chatHistory: ChatMessage[] = []) =>
  chatHistory
    .slice(-8)
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.text}`)
    .join("\n");

const normalizeFoodText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const levenshteinDistance = (a: string, b: string) => {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
};

const maxFuzzyDistance = (value: string) => {
  if (value.length <= 3) return 0;
  if (value.length <= 5) return 1;
  if (value.length <= 9) return 2;
  return 3;
};

const fuzzyTokenMatch = (typed: string, expected: string) => {
  if (!typed || !expected) return false;
  if (typed === expected) return true;

  return levenshteinDistance(typed, expected) <= maxFuzzyDistance(expected);
};

const fuzzyPhraseMatch = (message: string, phrase: string) => {
  const normalizedMessage = normalizeFoodText(message);
  const normalizedPhrase = normalizeFoodText(phrase);

  if (!normalizedMessage || !normalizedPhrase) return false;
  if (` ${normalizedMessage} `.includes(` ${normalizedPhrase} `)) return true;

  const messageTokens = normalizedMessage.split(" ");
  const phraseTokens = normalizedPhrase.split(" ");

  if (phraseTokens.length === 1) {
    return messageTokens.some((token) => fuzzyTokenMatch(token, normalizedPhrase));
  }

  if (messageTokens.length < phraseTokens.length) return false;

  for (let index = 0; index <= messageTokens.length - phraseTokens.length; index++) {
    const window = messageTokens.slice(index, index + phraseTokens.length);
    const matches = phraseTokens.every((token, tokenIndex) =>
      fuzzyTokenMatch(window[tokenIndex], token)
    );

    if (matches) return true;
  }

  return false;
};

const fuzzyMatchAny = (message: string, phrases: string[]) =>
  phrases.some((phrase) => fuzzyPhraseMatch(message, phrase));

const hasArabicText = (value: string) => /[\u0600-\u06FF]/.test(value);

const resolveReplyLanguage = (
  message: string,
  responseLanguage: "English" | "Arabic"
) => (hasArabicText(message) ? "Arabic" : responseLanguage);

const hasDiabetesGoal = (conditionName: string) => {
  const normalizedCondition = normalizeFoodText(conditionName);

  return normalizedCondition.includes("diabetes") ||
    normalizedCondition.includes("diabetic") ||
    normalizedCondition.includes("\u0627\u0644\u0633\u0643\u0631\u064a") ||
    normalizedCondition.includes("\u0633\u0643\u0631\u064a");
};

const greetingMessages = new Set([
  "hi",
  "hello",
  "hey",
  "good morning",
  "good afternoon",
  "good evening",
  "how are you",
  "salam",
  "salaam",
  "\u0645\u0631\u062d\u0628\u0627",
  "\u0623\u0647\u0644\u0627",
  "\u0627\u0647\u0644\u0627",
  "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064a\u0643\u0645",
]);

const greetingTokens = new Set([
  "hi",
  "hello",
  "hey",
  "salam",
  "salaam",
  "\u0645\u0631\u062d\u0628\u0627",
  "\u0623\u0647\u0644\u0627",
  "\u0627\u0647\u0644\u0627",
]);

const isGreetingMessage = (message: string) => {
  const normalized = normalizeFoodText(message);
  if (!normalized) return false;
  if (greetingMessages.has(normalized)) return true;

  const tokens = normalized.split(" ");
  return tokens.length <= 3 && tokens.every((token) => greetingTokens.has(token));
};

const greetingReply = (responseLanguage: "English" | "Arabic") =>
  responseLanguage === "Arabic"
    ? "\u0645\u0631\u062d\u0628\u0627\u060c \u064a\u0633\u0639\u062f\u0646\u064a \u0645\u0633\u0627\u0639\u062f\u062a\u0643. \u0627\u0633\u0623\u0644\u0646\u064a \u0639\u0646 \u0623\u064a \u0646\u0648\u0639 \u0645\u0646 \u0627\u0644\u0637\u0639\u0627\u0645\u060c \u0648\u0633\u0623\u0631\u0634\u062f\u0643 \u0628\u0646\u0627\u0621\u064b \u0639\u0644\u0649 \u0647\u062f\u0641\u0643 \u0627\u0644\u0635\u062d\u064a."
    : "Hi, I am happy to assist you. Ask me about any kind of food, and I will guide you based on your selected health goal.";

const arabicNameAliases: Record<string, string> = {
  avocado: "\u0623\u0641\u0648\u0643\u0627\u062f\u0648",
  banana: "\u0645\u0648\u0632",
  beef: "\u0644\u062d\u0645 \u0628\u0642\u0631\u064a",
  "beef shawarma": "\u0634\u0627\u0648\u0631\u0645\u0627 \u0644\u062d\u0645 \u0628\u0642\u0631\u064a",
  honey: "\u0639\u0633\u0644",
  kabab: "\u0643\u0628\u0627\u0628",
  kebab: "\u0643\u0628\u0627\u0628",
  olives: "\u0632\u064a\u062a\u0648\u0646",
  "olive oil": "\u0632\u064a\u062a \u0632\u064a\u062a\u0648\u0646",
  "pigeon meat": "\u0644\u062d\u0645 \u062d\u0645\u0627\u0645",
  rice: "\u0623\u0631\u0632",
  "rice soup": "\u0634\u0648\u0631\u0628\u0629 \u0623\u0631\u0632",
  shawarma: "\u0634\u0627\u0648\u0631\u0645\u0627",
  toast: "\u062a\u0648\u0633\u062a",
  "whole grain toast": "\u062a\u0648\u0633\u062a \u062d\u0628\u0629 \u0643\u0627\u0645\u0644\u0629",
  zaatar: "\u0632\u0639\u062a\u0631",
  zucchini: "\u0643\u0648\u0633\u0627",
};

const arabicTranslationWords = [
  "arabic",
  "arabbic",
  "ararbbic",
  "arab",
  "\u0639\u0631\u0628\u064a",
  "\u0628\u0627\u0644\u0639\u0631\u0628\u064a",
  "\u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
];

const resolveArabicNameAnswer = (message: string, responseLanguage: "English" | "Arabic") => {
  const normalizedMessage = ` ${normalizeFoodText(message)} `;
  const asksForArabic = arabicTranslationWords.some((word) =>
    normalizedMessage.includes(` ${normalizeFoodText(word)} `)
  );

  if (!asksForArabic) return null;

  const matchedName = Object.keys(arabicNameAliases)
    .sort((a, b) => b.length - a.length)
    .find((name) => normalizedMessage.includes(` ${normalizeFoodText(name)} `));

  if (!matchedName) return null;

  const arabicName = arabicNameAliases[matchedName];

  if (responseLanguage === "Arabic") {
    return `${matchedName} \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629: ${arabicName}`;
  }

  return `${matchedName} in Arabic is: ${arabicName}`;
};

const resolveRiceGuidanceAnswer = (
  message: string,
  conditionName: string,
  responseLanguage: "English" | "Arabic"
) => {
  const isRiceQuestion = fuzzyMatchAny(message, [
    "rice",
    "\u0623\u0631\u0632",
    "\u0627\u0631\u0632",
    "\u0631\u0632",
  ]);

  if (!isRiceQuestion) return null;

  const normalizedCondition = normalizeFoodText(conditionName);
  const hasDiabetes =
    normalizedCondition.includes("diabetes") ||
    normalizedCondition.includes("diabetic") ||
    normalizedCondition.includes("\u0627\u0644\u0633\u0643\u0631\u064a") ||
    normalizedCondition.includes("\u0633\u0643\u0631\u064a");

  if (responseLanguage === "Arabic") {
    return hasDiabetes
      ? "\u0628\u0627\u0644\u0646\u0633\u0628\u0629 \u0644\u0644\u0623\u0631\u0632\u060c \u064a\u0645\u0643\u0646\u0643 \u062a\u0646\u0627\u0648\u0644 \u0627\u0644\u0623\u0631\u0632 \u0627\u0644\u0628\u0646\u064a \u0641\u0642\u0637."
      : "\u062c\u0645\u064a\u0639 \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0623\u0631\u0632 \u0645\u0633\u0645\u0648\u062d\u0629.";
  }

  return hasDiabetes
    ? "For rice, you can eat only brown rice."
    : "All rice types are allowed.";
};

const resolveFishGuidanceAnswer = (message: string, responseLanguage: "English" | "Arabic") => {
  const isFishQuestion = fuzzyMatchAny(message, [
    "fish",
    "fishes",
    "seafood",
    "\u0633\u0645\u0643",
    "\u0627\u0633\u0645\u0627\u0643",
    "\u0623\u0633\u0645\u0627\u0643",
  ]);

  if (!isFishQuestion) return null;

  return responseLanguage === "Arabic"
    ? "\u062c\u0645\u064a\u0639 \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0633\u0645\u0643 \u0645\u0633\u0645\u0648\u062d\u0629."
    : "All kinds of fish are allowed.";
};

const resolveVinegarGuidanceAnswer = (message: string, responseLanguage: "English" | "Arabic") => {
  const isVinegarQuestion = fuzzyMatchAny(message, [
    "vinegar",
    "vinegars",
    "apple cider vinegar",
    "\u062e\u0644",
    "\u0627\u0644\u062e\u0644",
    "\u062e\u0644 \u0627\u0644\u062a\u0641\u0627\u062d",
  ]);

  if (!isVinegarQuestion) return null;

  return responseLanguage === "Arabic"
    ? "\u062c\u0645\u064a\u0639 \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u062e\u0644 \u063a\u064a\u0631 \u0645\u0633\u0645\u0648\u062d\u0629."
    : "All kinds of vinegar are not allowed.";
};

const resolveCoffeeGuidanceAnswer = (message: string, responseLanguage: "English" | "Arabic") => {
  const isCoffeeQuestion = fuzzyMatchAny(message, [
    "coffee",
    "cofee",
    "caffeine",
    "\u0642\u0647\u0648\u0629",
    "\u0627\u0644\u0642\u0647\u0648\u0629",
    "\u0643\u0627\u0641\u064a\u064a\u0646",
  ]);

  if (!isCoffeeQuestion) return null;

  return responseLanguage === "Arabic"
    ? "\u0627\u0644\u0642\u0647\u0648\u0629 \u0645\u0633\u0645\u0648\u062d\u0629 \u0628\u0627\u0639\u062a\u062f\u0627\u0644\u060c 3-5 \u0645\u0631\u0627\u062a \u0641\u064a \u0627\u0644\u0623\u0633\u0628\u0648\u0639."
    : "Coffee is allowed in moderation, 3-5 times per week.";
};

const resolvePomegranateMolassesGuidanceAnswer = (
  message: string,
  conditionName: string,
  responseLanguage: "English" | "Arabic"
) => {
  const isPomegranateMolassesQuestion = fuzzyMatchAny(message, [
    "pomegranate molasses",
    "pomegranate syrup",
    "دبس الرمان",
    "دبس رمان",
  ]);

  if (!isPomegranateMolassesQuestion) return null;

  const normalizedCondition = normalizeFoodText(conditionName);
  const hasDiabetes =
    normalizedCondition.includes("diabetes") ||
    normalizedCondition.includes("diabetic") ||
    normalizedCondition.includes("\u0627\u0644\u0633\u0643\u0631\u064a") ||
    normalizedCondition.includes("\u0633\u0643\u0631\u064a");

  if (responseLanguage === "Arabic") {
    return hasDiabetes
      ? "\u062f\u0628\u0633 \u0627\u0644\u0631\u0645\u0627\u0646 \u063a\u064a\u0631 \u0645\u0633\u0645\u0648\u062d \u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0633\u0643\u0631\u064a \u0644\u0623\u0646\u0647 \u064a\u062d\u062a\u0648\u064a \u0639\u0644\u0649 \u0643\u0645\u064a\u0629 \u0639\u0627\u0644\u064a\u0629 \u0645\u0646 \u0627\u0644\u0633\u0643\u0631."
      : "\u062f\u0628\u0633 \u0627\u0644\u0631\u0645\u0627\u0646 \u0645\u0633\u0645\u0648\u062d \u0628\u0627\u0639\u062a\u062f\u0627\u0644.";
  }

  return hasDiabetes
    ? "Pomegranate molasses is not allowed for diabetes because it contains a high amount of sugar."
    : "Pomegranate molasses is allowed in moderation.";
};

const resolveDiabetesJamsGuidanceAnswer = (
  message: string,
  conditionName: string,
  responseLanguage: "English" | "Arabic"
) => {
  if (!hasDiabetesGoal(conditionName)) return null;

  const isJamQuestion = fuzzyMatchAny(message, [
    "jam",
    "jams",
    "marmalade",
    "\u0645\u0631\u0628\u0649",
    "\u0627\u0644\u0645\u0631\u0628\u0649",
  ]);

  if (!isJamQuestion) return null;

  return responseLanguage === "Arabic"
    ? "\u062c\u0645\u064a\u0639 \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0645\u0631\u0628\u0649 \u063a\u064a\u0631 \u0645\u0633\u0645\u0648\u062d\u0629 \u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0633\u0643\u0631\u064a \u0644\u0623\u0646\u0647\u0627 \u062a\u062d\u062a\u0648\u064a \u0639\u0644\u0649 \u0643\u0645\u064a\u0629 \u0639\u0627\u0644\u064a\u0629 \u0645\u0646 \u0627\u0644\u0633\u0643\u0631."
    : "All kinds of jams are not allowed for diabetes because they contain a high amount of sugar.";
};

const cheeseAllowedItems = {
  English: [
    "cheddar cheese",
    "ghazal cheese",
    "kashkaval cheese",
    "la vache qui rit",
    "mozzarella",
    "smeds cheese",
  ],
  Arabic: [
    "جبنة شيدر",
    "جبنة قشقوان",
    "موزاريلا",
    "جبنة مطبوخة",
  ],
};

const cheeseNotAllowedItems = {
  English: [
    "cream",
    "greek yogurt",
    "halloum cheese",
    "uncooked cheese",
    "labne",
    "milk",
    "milk cans",
    "yogurt",
  ],
  Arabic: [
    "قشطة",
    "زبادي يوناني",
    "جبنة حلوم",
    "جبنة غير مطبوخة",
    "لبنة",
    "حليب",
    "علب حليب",
    "زبادي",
  ],
};

const resolveCheeseGuidanceAnswer = (message: string, responseLanguage: "English" | "Arabic") => {
  const normalizedMessage = ` ${normalizeFoodText(message)} `;
  const isCheeseQuestion =
    normalizedMessage.includes(" cheese ") ||
    normalizedMessage.includes(" cheeses ") ||
    normalizedMessage.includes(" جبنة ") ||
    normalizedMessage.includes(" الجبنة ") ||
    normalizedMessage.includes(" جبن ") ||
    normalizedMessage.includes(" الجبن ") ||
    normalizedMessage.includes(" أجبان ") ||
    normalizedMessage.includes(" الأجبان ") ||
    normalizedMessage.includes(" اجبان ") ||
    normalizedMessage.includes(" الاجبان ");

  if (!isCheeseQuestion && !fuzzyMatchAny(message, ["cheese", "cheeses"])) return null;

  const isBroadCheeseQuestion =
    normalizedMessage.includes(" can i eat cheese ") ||
    normalizedMessage.includes(" is cheese allowed ") ||
    normalizedMessage.includes(" cheese allowed ");

  const asksForNotAllowed =
    normalizedMessage.includes(" not allowed ") ||
    normalizedMessage.includes(" unallowed ") ||
    normalizedMessage.includes(" forbidden ") ||
    normalizedMessage.includes(" avoid ") ||
    normalizedMessage.includes(" uncooked ") ||
    normalizedMessage.includes(" raw cheese ") ||
    normalizedMessage.includes(" cannot eat ") ||
    normalizedMessage.includes(" can't eat ") ||
    normalizedMessage.includes(" غير مسموح ") ||
    normalizedMessage.includes(" غير المسموح ") ||
    normalizedMessage.includes(" غير مطبوخة ") ||
    normalizedMessage.includes(" غير المطبوخة ") ||
    normalizedMessage.includes(" الغير مطبوخة ") ||
    normalizedMessage.includes(" غير مطبوخ ") ||
    normalizedMessage.includes(" غير المطبوخ ") ||
    normalizedMessage.includes(" الغير مطبوخ ") ||
    normalizedMessage.includes(" ممنوع ") ||
    normalizedMessage.includes(" الممنوع ") ||
    normalizedMessage.includes(" تجنب ") ||
    normalizedMessage.includes(" لا يمكنني ") ||
    normalizedMessage.includes(" لا يجب ") ||
    normalizedMessage.includes(" لا يمكن ");

  const asksForAllowed =
    normalizedMessage.includes(" allowed ") ||
    normalizedMessage.includes(" can eat ") ||
    normalizedMessage.includes(" can i eat ");

  if (isBroadCheeseQuestion && !asksForAllowed && !asksForNotAllowed) {
    return responseLanguage === "Arabic"
      ? "هل تقصد الجبنة المطبوخة أم الجبنة غير المطبوخة؟"
      : "Do you mean cooked cheese or uncooked cheese?";
  }

  const items = asksForNotAllowed
    ? cheeseNotAllowedItems[responseLanguage]
    : cheeseAllowedItems[responseLanguage];
  const list = items.join(responseLanguage === "Arabic" ? "، " : ", ");

  if (responseLanguage === "Arabic") {
    return asksForNotAllowed
      ? `منتجات الألبان ما عدا الجبنة المطبوخة هي: ${list}.`
      : `الأجبان المسموحة هي الأجبان المطبوخة: ${list}.`;
  }

  return asksForNotAllowed
    ? `Dairy products except cooked cheese are: ${list}.`
    : `The allowed cheeses are cooked cheeses: ${list}.`;
};

const cleanGuidanceReply = (reply: string) =>
  reply
    .replace(/\s*Recommendation:\s*Ask the Tayibat team\/admin to add this food\.?/gi, "")
    .replace(/\s*Recommendation:\s*Ask the Tayibat team to add this food\.?/gi, "")
    .replace(/\s*Recommendation:\s*Ask the admin to add this food\.?/gi, "")
    .replace(/\s*Safety note:\s*[^\n]*(?:\n|$)/gi, "\n")
    .replace(/\s+(Reason:)/gi, ", $1")
    .replace(/\s+(Recommendation:)/gi, ", $1")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();

const treatmentQuestionWords = [
  "cure",
  "treat",
  "treatment",
  "heal",
  "medicine",
  "medication",
  "stop medicine",
  "replace doctor",
  "diagnose",
  "جرعة",
  "دواء",
  "علاج",
  "يشفي",
  "تشخيص",
];

const resolveSafetyContext = (
  message: string,
  conditionName: string
) => {
  const normalizedMessage = ` ${normalizeFoodText(message)} `;
  const asksForTreatment = treatmentQuestionWords.some((word) =>
    normalizedMessage.includes(` ${normalizeFoodText(word)} `)
  );

  return [
    `Selected health goal for safety context: ${conditionName}.`,
    asksForTreatment
      ? "The user may be asking for diagnosis, treatment, cure, medicine, or replacing medical care. Refuse that part and say Tayibat provides food guidance only, not diagnosis or treatment."
      : "No treatment/medicine request detected.",
  ].join(" ");
};

const formatAssistantDashboardForAgent = (dashboard: AssistantDashboard | null) => {
  if (!dashboard) {
    return "No saved nutrition profile, recent food logs, or reminders were available.";
  }

  const profile = dashboard.profile;
  const recentLogs = (dashboard.recent_logs || [])
    .slice(0, 6)
    .map((log) => `${log.food_name || "unknown food"}${log.meal_type ? ` (${log.meal_type})` : ""}`)
    .join(", ");
  const reminders = (dashboard.reminders || [])
    .filter((reminder) => reminder.enabled)
    .map((reminder) => reminder.title)
    .filter(Boolean)
    .join(" | ");

  return [
    "User nutrition profile:",
    profile?.allergies?.length ? `Allergies: ${profile.allergies.join(", ")}` : "Allergies: none saved",
    profile?.disliked_foods?.length ? `Disliked foods: ${profile.disliked_foods.join(", ")}` : "Disliked foods: none saved",
    profile?.preferred_foods?.length ? `Preferred foods: ${profile.preferred_foods.join(", ")}` : "Preferred foods: none saved",
    profile?.meal_count_preference ? `Meal preference: ${profile.meal_count_preference}` : "",
    typeof profile?.fasting_days_per_week === "number" ? `Fasting days per week: ${profile.fasting_days_per_week}` : "",
    profile?.budget_level ? `Budget level: ${profile.budget_level}` : "",
    profile?.notes ? `Profile notes: ${profile.notes}` : "",
    recentLogs ? `Recent food logs: ${recentLogs}` : "Recent food logs: none",
    reminders ? `Active reminders: ${reminders}` : "Active reminders: none",
  ]
    .filter(Boolean)
    .join("\n");
};

const foodCategoryMap: Record<string, string[]> = {
  vegetables: [
    "artichoke",
    "أرضي شوكي",
    "asparagus",
    "هليون",
    "broccoli",
    "بروكلي",
    "cabbage",
    "ملفوف",
    "carrot",
    "جزر",
    "cauliflower",
    "قرنبيط",
    "celery",
    "كرفس",
    "cucumber",
    "خيار",
    "eggplant",
    "باذنجان",
    "garlic",
    "ثوم",
    "kale",
    "lettuce",
    "خس",
    "mushroom",
    "mushrooms",
    "فطر",
    "okra",
    "بامية",
    "onion",
    "onions",
    "بصل",
    "pepper",
    "فلفل",
    "spinach",
    "سبانخ",
    "tomato",
    "طماطم",
    "vegetable",
    "خضار",
    "خضروات",
  ],
  "Allowed fruits": [
    "apple",
    "تفاح",
    "banana",
    "موز",
    "berry",
    "blueberry",
    "توت",
    "cherry",
    "كرز",
    "date",
    "تمر",
    "fig",
    "تين",
    "grape",
    "عنب",
  ],
  "Unallowed fruits": [
    "apricot",
    "مشمش",
    "kiwi",
    "كيوي",
    "lemon",
    "ليمون",
    "mango",
    "مانجو",
    "melon",
    "شمام",
    "orange",
    "برتقال",
    "peach",
    "دراق",
    "خوخ",
    "pear",
    "إجاص",
    "كمثرى",
    "pineapple",
    "أناناس",
    "plum",
    "برقوق",
    "watermelon",
    "بطيخ",
    "guafa",
    "guava",
    "جوافة"
  ],
  "Dairy products except cooked cheese": [
    "cream",
    "قشطة",
    "greek yogurt",
    "زبادي يوناني",
    "halloum cheese",
    "جبنة حلوم",
    "Uncooked cheese",
    "جبنة غير مطبوخة",
    "labne",
    "labneh",
    "لبنة",
    "milk",
    "حليب",
    "milk cans",
    "yogurt",
    "زبادي",
  ],
  "Cooked Cheese": [
    "cheddar",
    "cheddar cheese",
    "جبنة شيدر",
    "ghazal cheese",
    "kashkaval cheese",
    "جبنة قشقوان",
    "la vache qui rit",
    "mozarella",
    "mozzarella",
    "موزاريلا",
    "smeds cheese",
    "جبنة مطبوخة",
  ],
  legumes: ["bean", "beans","peanut butter", "chickpea", "lentil", "pea", "peas","lentils","زبدة الفول السوداني", "بقوليات", "فاصوليا", "حمص", "عدس", "بازلاء"],
  nuts: ["almond","almonds", "cashew", "cashews", "peanut", "peanuts", "pistachio", "walnut","walnuts", "مكسرات", "لوز", "كاجو", "فول سوداني", "فستق", "جوز"],
};

const findRuleForCategory = (rules: FoodRule[], category: string) => {
  const normalizedCategory = normalizeFoodText(category);
  const categoryVariants = new Set([
    normalizedCategory,
    normalizedCategory.endsWith("s")
      ? normalizedCategory.slice(0, -1)
      : `${normalizedCategory}s`,
  ]);

  return rules.find((rule) => {
    const foodName = normalizeFoodText(rule.food?.name || "");
    const arabicFoodName = normalizeFoodText(rule.food?.name_ar || "");

    return categoryVariants.has(foodName) || categoryVariants.has(arabicFoodName);
  });
};

const categoryListAliases: Record<string, string[]> = {
  vegetables: [
    "vegetables",
    "vegetable",
    "veggies",
    "خضار",
    "خضروات",
  ],
  "Allowed fruits": [
    "allowed fruits",
    "allowed fruit",
    "fruits allowed",
    "fruit allowed",
    "healthy fruits",
    "healthy fruit",
    "الفواكه المسموحة",
    "فواكه مسموحة",
    "الفاكهة المسموحة",
  ],
  "Unallowed fruits": [
    "unallowed fruits",
    "unallowed fruit",
    "avoid fruits",
    "avoid fruit",
    "fruits to avoid",
    "fruit to avoid",
    "forbidden fruits",
    "forbidden fruit",
    "الفواكه الممنوعة",
    "فواكه ممنوعة",
    "الفواكه التي يجب تجنبها",
  ],
  "Dairy products except cooked cheese": [
    "dairy products",
    "dairy",
    "milk products",
    "uncooked cheese",
    "منتجات الألبان",
    "الألبان",
  ],
  "Cooked Cheese": [
    "cooked cheese",
    "cooked cheeses",
    "جبنة مطبوخة",
    "الأجبان المطبوخة",
  ],
  legumes: [
    "legumes",
    "beans",
    "lentils",
    "بقوليات",
  ],
  nuts: [
    "nuts",
    "nut",
    "مكسرات",
  ],
};

const categoryListRequestWords = [
  "give",
  "list",
  "show",
  "tell",
  "what",
  "which",
  "array",
  "items",
  "foods",
  "food",
  "اعطني",
  "أعطني",
  "اعطيني",
  "أعطيني",
  "اذكر",
  "ما",
  "شو",
  "لائحة",
  "قائمة",
];

const uniqueItems = (items: string[]) =>
  Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const formatCategoryArrayItems = (items: string[], responseLanguage: "English" | "Arabic") => {
  const normalizedItems = uniqueItems(items);
  const languageItems =
    responseLanguage === "English"
      ? normalizedItems.filter((item) => /^[\x00-\x7F]+$/.test(item))
      : normalizedItems.filter((item) => !/^[\x00-\x7F]+$/.test(item));
  const displayItems = languageItems.length > 0 ? languageItems : normalizedItems;

  if (responseLanguage === "Arabic") {
    return displayItems.join("، ");
  }

  return displayItems.join(", ");
};

const resolveDirectRuleContext = (message: string, rules: FoodRule[]) => {
  const sortedRules = [...rules].sort(
    (a, b) => (b.food?.name || "").length - (a.food?.name || "").length
  );

  const matchedRule = sortedRules.find((rule) => {
    const foodName = normalizeFoodText(rule.food?.name || "");
    const arabicFoodName = normalizeFoodText(rule.food?.name_ar || "");

    return (
      (foodName && fuzzyPhraseMatch(message, foodName)) ||
      (arabicFoodName && fuzzyPhraseMatch(message, arabicFoodName))
    );
  });

  if (!matchedRule) {
    return "No direct backend food-rule match was found for the user's message.";
  }

  return [
    `The user's message directly matches backend food "${matchedRule.food?.name}".`,
    matchedRule.food?.name_ar ? `Arabic food name: ${matchedRule.food.name_ar}.` : "",
    `Direct food status: ${matchedRule.status}.`,
    matchedRule.reason ? `Direct food reason: ${matchedRule.reason}.` : "",
    matchedRule.reason_ar ? `Direct food Arabic reason: ${matchedRule.reason_ar}.` : "",
    matchedRule.max_servings ? `Direct food max servings: ${matchedRule.max_servings}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const resolveDiabetesFreshJuicesGuidanceAnswer = (
  message: string,
  conditionName: string,
  rules: FoodRule[],
  responseLanguage: "English" | "Arabic"
) => {
  if (!hasDiabetesGoal(conditionName)) return null;

  const isJuiceQuestion = fuzzyMatchAny(message, [
    "juice",
    "juices",
    "fresh juice",
    "fresh juices",
    "\u0639\u0635\u064a\u0631",
    "\u0639\u0635\u0627\u0626\u0631",
    "\u0639\u0635\u064a\u0631 \u0637\u0627\u0632\u062c",
    "\u0639\u0635\u0627\u0626\u0631 \u0637\u0627\u0632\u062c\u0629",
  ]);

  if (!isJuiceQuestion) return null;

  const freshJuicesRule = rules.find((rule) => {
    const foodName = normalizeFoodText(rule.food?.name || "");
    const arabicFoodName = normalizeFoodText(rule.food?.name_ar || "");

    return foodName === "fresh juices" || arabicFoodName === normalizeFoodText("\u0639\u0635\u0627\u0626\u0631 \u0637\u0627\u0632\u062c\u0629");
  });

  if (!freshJuicesRule) return null;

  if (responseLanguage === "Arabic") {
    const status = freshJuicesRule.status === "allowed"
      ? "\u0645\u0633\u0645\u0648\u062d"
      : freshJuicesRule.status === "moderate"
        ? "\u0645\u0639\u062a\u062f\u0644"
        : "\u063a\u064a\u0631 \u0645\u0633\u0645\u0648\u062d";
    const reason = freshJuicesRule.reason_ar || freshJuicesRule.reason || "\u062d\u0633\u0628 \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0639\u0635\u0627\u0626\u0631 \u0627\u0644\u0637\u0627\u0632\u062c\u0629.";

    return `\u0627\u0644\u062d\u0627\u0644\u0629: ${status}\u060c \u0627\u0644\u0633\u0628\u0628: ${reason}`;
  }

  const status = freshJuicesRule.status.charAt(0).toUpperCase() + freshJuicesRule.status.slice(1);
  const reason = freshJuicesRule.reason || "Based on the Fresh Juices backend rule.";

  return `Status: ${status}, Reason: ${reason}`;
};

const lookupFullFoodRuleContext = async (
  message: string,
  conditionName: string,
  authorization: string | null
) => {
  if (!authorization) {
    return "No full backend food-rule lookup was performed because the user is not authenticated.";
  }

  try {
    const lookup = await fetchJson<FoodRuleLookup>(
      `/rules/${encodeURIComponent(conditionName)}/lookup-food?food=${encodeURIComponent(message)}`,
      authorization
    );

    if (!lookup.exists || !lookup.food) {
      return "No full backend food-rule lookup match was found for the user's message.";
    }

    return [
      `Full backend lookup directly matches food "${lookup.food.name}".`,
      lookup.food.name_ar ? `Arabic food name: ${lookup.food.name_ar}.` : "",
      `Full lookup food status: ${lookup.status}.`,
      lookup.reason ? `Full lookup food reason: ${lookup.reason}.` : "",
      lookup.reason_ar ? `Full lookup Arabic reason: ${lookup.reason_ar}.` : "",
      lookup.max_servings ? `Full lookup max servings: ${lookup.max_servings}.` : "",
      "Use this full backend lookup when the visible first rows do not include the food.",
    ]
      .filter(Boolean)
      .join(" ");
  } catch {
    return "No full backend food-rule lookup was available.";
  }
};

const resolveCategoryListContext = (
  message: string,
  rules: FoodRule[],
  responseLanguage: "English" | "Arabic",
  hasPremiumAccess: boolean
) => {
  const normalizedMessage = ` ${normalizeFoodText(message)} `;
  const hasListIntent = categoryListRequestWords.some((word) =>
    normalizedMessage.includes(` ${normalizeFoodText(word)} `)
  );

  for (const [category, aliases] of Object.entries(categoryListAliases)) {
    const categoryAliases = [category, ...(aliases || [])];
    const matchedAlias = categoryAliases.find((alias) => fuzzyPhraseMatch(message, alias));

    if (!matchedAlias || (!hasListIntent && normalizeFoodText(matchedAlias) !== normalizeFoodText(category))) continue;

    const items = foodCategoryMap[category] || [];
    const categoryRule = findRuleForCategory(rules, category);

    if (!categoryRule) {
      return [
        `The user is asking for the "${category}" category array.`,
        `Matched phrase: "${matchedAlias}".`,
        `Array items: ${formatCategoryArrayItems(items, responseLanguage)}.`,
        hasPremiumAccess
          ? `No backend rule for "${category}" was found, so explain that the array exists but status/reason is unavailable from Tayibat rules.`
          : `The user is not Premium. Use this exact premium note: However, since you are not having the premium, you cannot access the status and reason for this category.`,
      ].join(" ");
    }

    return [
      `The user is asking for the "${category}" category array.`,
      `Matched phrase: "${matchedAlias}".`,
      `Array items: ${formatCategoryArrayItems(items, responseLanguage)}.`,
      `Use this exact array/list in the answer.`,
      `Category status: ${categoryRule.status}.`,
      categoryRule.reason ? `Category reason: ${categoryRule.reason}.` : "",
      categoryRule.reason_ar ? `Category Arabic reason: ${categoryRule.reason_ar}.` : "",
      categoryRule.max_servings ? `Category max servings: ${categoryRule.max_servings}.` : "",
      `After listing the array, also provide the category status and reason.`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return "No category-array list request was found for the user's message.";
};

const resolveCategoryContext = (message: string, rules: FoodRule[]) => {
  for (const [category, items] of Object.entries(foodCategoryMap)) {
    const matches = [...items, category].sort((a, b) => b.length - a.length);
    const matchedFood = matches.find((item) => fuzzyPhraseMatch(message, item));

    if (!matchedFood) continue;

    const categoryRule = findRuleForCategory(rules, category);

    if (!categoryRule) {
      return `The user mentioned "${matchedFood}", which belongs to the "${category}" category, but no backend rule for "${category}" was found.`;
    }

    return [
      `The user mentioned "${matchedFood}".`,
      `"${matchedFood}" belongs to the "${category}" category.`,
      `Use the backend rule for "${category}" when answering about "${matchedFood}".`,
      `Category status: ${categoryRule.status}.`,
      categoryRule.reason ? `Category reason: ${categoryRule.reason}.` : "",
      categoryRule.max_servings ? `Category max servings: ${categoryRule.max_servings}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return "No category-array match was found for the user's message.";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GuidanceAgentRequest;
    const message = body.message?.trim();
    const responseLanguage = body.language === "ar" ? "Arabic" : "English";

    if (!message) {
      return NextResponse.json({ reply: "Please ask a food guidance question." });
    }

    if (isGreetingMessage(message)) {
      return NextResponse.json({ reply: greetingReply(responseLanguage) });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply:
          "The AI guidance agent is not configured yet. Add OPENAI_API_KEY to the frontend environment and restart Next.js.",
      });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(authCookieName)?.value;
    const authorization = token ? `Bearer ${token}` : null;
    const conditionName = await resolveConditionName(body.condition, body.conditionName);

    if (!conditionName) {
      return NextResponse.json({
        reply: "Please select a health goal before using the guidance agent.",
      });
    }

    if (!authorization) {
      return NextResponse.json({ reply: "Please log in to use the AI guide." }, { status: 401 });
    }

    const billingAccess = await fetchBillingAccess(authorization);
    const limitResponse = aiLimitResponse(billingAccess);

    if (limitResponse) {
      return limitResponse;
    }

    const countedShortcutResponse = async (reply: string) => {
      const usage = await consumeAiQuestion(authorization);

      if (!usage.ok) {
        return NextResponse.json({ reply: usage.message }, { status: usage.status });
      }

      return NextResponse.json({ reply });
    };

    const arabicNameAnswer = resolveArabicNameAnswer(message, responseLanguage);

    if (arabicNameAnswer) {
      return countedShortcutResponse(arabicNameAnswer);
    }

    const directReplyLanguage = resolveReplyLanguage(message, responseLanguage);
    const riceGuidanceAnswer = resolveRiceGuidanceAnswer(message, conditionName, directReplyLanguage);

    if (riceGuidanceAnswer) {
      return countedShortcutResponse(riceGuidanceAnswer);
    }

    const fishGuidanceAnswer = resolveFishGuidanceAnswer(message, directReplyLanguage);

    if (fishGuidanceAnswer) {
      return countedShortcutResponse(fishGuidanceAnswer);
    }

    const vinegarGuidanceAnswer = resolveVinegarGuidanceAnswer(message, directReplyLanguage);

    if (vinegarGuidanceAnswer) {
      return countedShortcutResponse(vinegarGuidanceAnswer);
    }

    const coffeeGuidanceAnswer = resolveCoffeeGuidanceAnswer(message, directReplyLanguage);

    if (coffeeGuidanceAnswer) {
      return countedShortcutResponse(coffeeGuidanceAnswer);
    }

    const pomegranateMolassesGuidanceAnswer = resolvePomegranateMolassesGuidanceAnswer(
      message,
      conditionName,
      directReplyLanguage
    );

    if (pomegranateMolassesGuidanceAnswer) {
      return countedShortcutResponse(pomegranateMolassesGuidanceAnswer);
    }

    const diabetesJamsGuidanceAnswer = resolveDiabetesJamsGuidanceAnswer(
      message,
      conditionName,
      directReplyLanguage
    );

    if (diabetesJamsGuidanceAnswer) {
      return countedShortcutResponse(diabetesJamsGuidanceAnswer);
    }

    const cheeseGuidanceAnswer = resolveCheeseGuidanceAnswer(message, directReplyLanguage);

    if (cheeseGuidanceAnswer) {
      return countedShortcutResponse(cheeseGuidanceAnswer);
    }

    const hasPremiumAccess = Boolean(billingAccess?.premium || billingAccess?.ai?.unlimited);
    const assistantDashboard = await fetchAssistantDashboard(authorization);
    const rules = await fetchJson<FoodRule[]>(`/rules/${encodeURIComponent(conditionName)}`, authorization);

    const diabetesFreshJuicesGuidanceAnswer = resolveDiabetesFreshJuicesGuidanceAnswer(
      message,
      conditionName,
      rules,
      directReplyLanguage
    );

    if (diabetesFreshJuicesGuidanceAnswer) {
      return countedShortcutResponse(diabetesFreshJuicesGuidanceAnswer);
    }

    const rulesContext = formatRulesForAgent(rules);
    const directRuleContext = resolveDirectRuleContext(message, rules);
    const fullFoodRuleContext = await lookupFullFoodRuleContext(message, conditionName, authorization);
    const categoryListContext = resolveCategoryListContext(message, rules, responseLanguage, hasPremiumAccess);
    const categoryContext = resolveCategoryContext(message, rules);
    const safetyContext = resolveSafetyContext(message, conditionName);
    const assistantContext = formatAssistantDashboardForAgent(assistantDashboard);

    if (!rulesContext) {
      return NextResponse.json({
        reply:
          "No food rules were found for this health goal. Add rules from the admin dashboard first.",
      });
    }

    const model = new ChatOpenAI({
      apiKey,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.1,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        [
          "You are the Tayibat guidance agent.",
          "Answer using only the provided backend food rules for the selected health goal.",
          "Match food names case-insensitively. For example, Apricot, APRICOT, and apricot are the same food.",
          "Use the direct backend food-rule match first when it is present.",
          "If the full backend food-rule lookup has a match, use it even when the visible table rows do not include that food.",
          "If a category-array list request is present, list the array items first, then provide the category status and reason from the backend rule.",
          "If a category-array list request has no status/reason because the user is not Premium, say: However, since you are not having the premium, you cannot access the status and reason for this category.",
          "When using that Premium note, do not add Status, Reason, or Recommendation lines.",
          "Use the category-array match when it is present. For example, if broccoli belongs to vegetables and vegetables is avoid, broccoli is also avoid.",
          "Answer in the requested response language.",
          "Use the assistant context to personalize practical recommendations, but never override backend food-rule status with profile preferences.",
          "If recent food logs are relevant, use them for next-meal guidance.",
          "If the user asks to modify a saved plan, explain the change briefly and suggest using the plan tools when an exact saved-plan edit is needed.",
          "Always use a structured answer, not a paragraph, unless you are only asking the user to select a goal.",
          "For a specific food question in English, use exactly this comma-separated format: Status: Allowed/Moderate/Avoid/Not available, Reason: backend reason or missing-rule reason, Recommendation: one short practical sentence.",
          "For a specific food question in Arabic, use Arabic labels equivalent to: Status, Reason, Recommendation. Keep the same three-line structure.",
          "For category-list requests, list the foods first, then use Status, Reason, and Recommendation lines when those details are available.",
          "If no direct food rule or category rule exists, answer only with: Status: Not available. Reason: This food is not available in Tayibat rules yet.",
          "For not-available foods, do not include any Recommendation line and never tell the user to ask Tayibat/admin/team to add the food.",
          "If max servings are missing, do not invent servings. If needed, say no serving amount is set in Tayibat rules.",
          "Do not invent foods, statuses, servings, reasons, medical claims, or diet rules.",
          "If the user's food or question cannot be answered from the rules, use the Not available template.",
          "Keep answers short, practical, and safe.",
          "If a food is avoid, clearly warn the user.",
          "If a food is moderate, mention moderation and max servings when present.",
          "If a question asks for diagnosis, treatment, cure, medicine changes, or replacing medical care, refuse that part and say Tayibat provides food guidance only, not diagnosis or treatment. Then suggest consulting a qualified health professional.",
        ].join("\n"),
      ],
      [
        "human",
        [
          "Selected health goal: {conditionName}",
          "Response language: {responseLanguage}",
          "",
          "Backend rules:",
          "{rulesContext}",
          "",
        "Recent chat history:",
        "{chatHistory}",
        "",
        "Direct backend food-rule match:",
        "{directRuleContext}",
        "",
        "Full backend food-rule lookup:",
        "{fullFoodRuleContext}",
        "",
        "Category-array list request:",
        "{categoryListContext}",
        "",
        "Category-array match:",
        "{categoryContext}",
        "",
        "Safety context:",
        "{safetyContext}",
        "",
        "Assistant context:",
        "{assistantContext}",
        "",
        "User question:",
        "{message}",
        ].join("\n"),
      ],
    ]);

    const chain = prompt.pipe(model);
    const response = await chain.invoke({
      conditionName,
      responseLanguage,
      rulesContext,
      chatHistory: formatHistory(body.chatHistory),
      directRuleContext,
      fullFoodRuleContext,
      categoryListContext,
      categoryContext,
      safetyContext,
      assistantContext,
      message,
    });

    const usage = await consumeAiQuestion(authorization);

    if (!usage.ok) {
      return NextResponse.json({ reply: usage.message }, { status: usage.status });
    }

    return NextResponse.json({
      reply: cleanGuidanceReply(String(response.content || "I could not generate a guidance answer right now.")),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const reply = message.includes("Backend request failed")
      ? "The AI guidance agent cannot reach the food rules backend right now. Make sure Laravel is running."
      : "The AI guidance agent is unavailable right now. Check the OpenAI API key and try again.";

    return NextResponse.json({ reply });
  }
}
