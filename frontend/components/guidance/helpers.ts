import type { Condition, GuidanceLanguage, PlanDay } from "./types";
import { mealLabels, statusLabels } from "./text";

export const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const localizedConditionName = (
  condition: Condition | null | undefined,
  language: GuidanceLanguage
) => language === "ar" ? condition?.name_ar || condition?.name : condition?.name;

export const translateDayLabel = (day: PlanDay, language: GuidanceLanguage) =>
  language === "ar" ? `اليوم ${day.day}` : day.label;

export const translateMeal = (meal: string, language: GuidanceLanguage) =>
  mealLabels[language][meal] || meal;

export const translateStatus = (status: string, language: GuidanceLanguage) =>
  statusLabels[language][status] || status;
