"use client";

import { Download, X } from "lucide-react";

import type { DietPlanResponse, GuidanceLanguage } from "./types";
import type { GuidanceText } from "./text";
import { durationLabels, statusLabels } from "./text";
import { translateDayLabel, translateMeal } from "./helpers";

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

export default function GuidancePlanViewer({
  plan,
  conditionName,
  language,
  onClose,
  onDownload,
  t,
  instructions,
  isImportantInstruction,
  importantLabel,
}: {
  plan: DietPlanResponse;
  conditionName: string;
  language: GuidanceLanguage;
  onClose: () => void;
  onDownload: () => void;
  t: GuidanceText;
  instructions: string[];
  isImportantInstruction: (instruction: string) => boolean;
  importantLabel: string;
}) {
  const isArabic = language === "ar";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-stone-900">{conditionName}</h2>
            <p className="text-sm text-stone-500">
              {durationLabels[language][plan.duration || ""] || plan.duration}
              {plan.days ? ` · ${plan.days} days` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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

        <div className="overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {plan.plan.map((day) => (
              <div key={day.day} className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50/60">
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

          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="font-display font-bold text-emerald-900">{t.instructions}</h3>
            <ul className="mt-3 space-y-2">
              {instructions.map((instruction, index) => {
                const important = isImportantInstruction(instruction);

                return (
                  <li
                    key={`${instruction}-${index}`}
                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm ${
                      important
                        ? "border border-amber-200 bg-amber-50 text-amber-950 shadow-sm"
                        : "text-stone-700"
                    }`}
                  >
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${important ? "bg-amber-500" : "bg-emerald-400"}`} />
                    <span>
                      {important && (
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-amber-700">
                          {importantLabel}
                        </span>
                      )}
                      {instruction}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
