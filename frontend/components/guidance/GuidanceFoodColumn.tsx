"use client";

type GuidanceLanguage = "en" | "ar";

interface FoodRule {
  id: number;
  food?: { name: string; name_ar?: string | null };
  status: "allowed" | "avoid" | "moderate";
  reason?: string | null;
  reason_ar?: string | null;
  max_servings?: string | number | null;
}

interface GuidanceText {
  food: string;
  status: string;
  reason: string;
  noMatchingRules: string;
  maxServings: string;
}

const statusLabels: Record<GuidanceLanguage, Record<string, string>> = {
  en: { allowed: "Allowed", moderate: "Moderate", avoid: "Avoid" },
  ar: { allowed: "مسموح", moderate: "معتدل", avoid: "تجنب" },
};

const localizedFoodName = (
  food: { name?: string | null; name_ar?: string | null } | null | undefined,
  language: GuidanceLanguage
) => (language === "ar" ? food?.name_ar || food?.name : food?.name) || "Unknown food";

const localizedRuleReason = (
  rule: { reason?: string | null; reason_ar?: string | null },
  language: GuidanceLanguage
) => (language === "ar" ? rule.reason_ar || rule.reason : rule.reason) || "-";

function StatusPill({ status, language }: { status: string; language: GuidanceLanguage }) {
  const colors: Record<string, string> = {
    allowed: "bg-emerald-100 text-emerald-700",
    moderate: "bg-amber-100 text-amber-700",
    avoid: "bg-red-100 text-red-700",
  };

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || "bg-stone-100 text-stone-600"}`}>
      {statusLabels[language][status] || status}
    </span>
  );
}

export default function GuidanceFoodColumn({
  title,
  rules,
  language,
  variant,
  t,
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
      <div className={`flex items-center gap-2 px-4 py-3 ${isAvoid ? "bg-red-50" : "bg-emerald-50"}`}>
        <span className={`h-2 w-2 rounded-full ${isAvoid ? "bg-red-400" : "bg-emerald-500"}`} />
        <h3 className={`font-semibold ${isAvoid ? "text-red-800" : "text-emerald-800"}`}>{title}</h3>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${isAvoid ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
          {rules.length}
        </span>
      </div>

      <div className="divide-y divide-stone-100 sm:hidden">
        {rules.length === 0 && <p className="px-4 py-4 text-sm text-stone-400">{t.noMatchingRules}</p>}
        {rules.map((rule) => (
          <div key={`${rule.id}-${rule.status}-m`} className="bg-white px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-semibold text-stone-900" dir="auto">
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

      <div className="hidden overflow-x-auto sm:block">
        <table className={`w-full table-fixed text-sm ${language === "ar" ? "text-right" : "text-left"}`}>
          <colgroup><col className="w-[28%]" /><col className="w-[18%]" /><col className="w-[54%]" /></colgroup>
          <thead>
            <tr className={isAvoid ? "bg-red-50/70 text-red-800" : "bg-emerald-50/70 text-emerald-800"}>
              {[t.food, t.status, t.reason].map((header) => (
                <th key={header} className={`border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ${isAvoid ? "border-red-100" : "border-emerald-100"}`}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {rules.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-4 text-sm text-stone-400">{t.noMatchingRules}</td></tr>
            )}
            {rules.map((rule) => (
              <tr key={`${rule.id}-${rule.status}`} className="align-top transition-colors hover:bg-stone-50">
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
