"use client";

import axios from "axios";
import { RefreshCw, Trash2, Utensils } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

type RuleStatus = "allowed" | "moderate" | "avoid";
type MealType = "" | "breakfast" | "lunch" | "dinner" | "snack" | "any";
type MealRole = "" | "main" | "side" | "drink" | "fat" | "fruit" | "snack" | "solo" | "any";

interface Food {
  id: number;
  name: string;
  name_ar?: string | null;
  meal_type?: MealType | null;
  meal_role?: MealRole | null;
}

interface Condition {
  id: number;
  name: string;
  name_ar?: string | null;
}

interface DietaryRule {
  id: number;
  food_id: number;
  condition_id: number;
  status: RuleStatus;
  reason?: string | null;
  reason_ar?: string | null;
  max_servings?: string | null;
  food?: Food | null;
  condition?: Condition | null;
}

interface GlobalRule {
  id: number;
  food_id: number;
  status: RuleStatus;
  reason?: string | null;
  reason_ar?: string | null;
  food?: Food | null;
}

const mealTypes: MealType[] = ["", "breakfast", "lunch", "dinner", "snack", "any"];
const mealRoles: MealRole[] = ["", "main", "side", "drink", "fat", "fruit", "snack", "solo", "any"];
const statuses: RuleStatus[] = ["allowed", "moderate", "avoid"];

const initialFoodForm = {
  name: "",
  name_ar: "",
  meal_type: "" as MealType,
  meal_role: "" as MealRole,
};
const initialConditionForm = { name: "", name_ar: "" };
const initialDietaryRuleForm = {
  condition_id: "",
  food_id: "",
  status: "allowed" as RuleStatus,
  reason: "",
  reason_ar: "",
  max_servings: "",
};
const initialGlobalRuleForm = {
  food_id: "",
  status: "allowed" as RuleStatus,
  reason: "",
  reason_ar: "",
};

const getApiMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    if (!error.response) {
      return "We cannot reach the backend right now. Check that Laravel is running and try again.";
    }

    return error.response?.data?.message || error.response?.data?.error || fallback;
  }

  return fallback;
};

export default function AdminNutritionManager() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [dietaryRules, setDietaryRules] = useState<DietaryRule[]>([]);
  const [globalRules, setGlobalRules] = useState<GlobalRule[]>([]);
  const [foodForm, setFoodForm] = useState(initialFoodForm);
  const [conditionForm, setConditionForm] = useState(initialConditionForm);
  const [dietaryRuleForm, setDietaryRuleForm] = useState(initialDietaryRuleForm);
  const [globalRuleForm, setGlobalRuleForm] = useState(initialGlobalRuleForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadNutritionData = useCallback(async () => {
    setLoading(true);
    setNotice("");

    try {
      const [foodsResponse, conditionsResponse, dietaryRulesResponse, globalRulesResponse] =
        await Promise.all([
          api.get<Food[]>("/admin/foods"),
          api.get<Condition[]>("/admin/conditions"),
          api.get<DietaryRule[]>("/admin/dietary-rules"),
          api.get<GlobalRule[]>("/admin/global-rules"),
        ]);

      setFoods(foodsResponse.data);
      setConditions(conditionsResponse.data);
      setDietaryRules(dietaryRulesResponse.data);
      setGlobalRules(globalRulesResponse.data);
    } catch (error) {
      setNotice(getApiMessage(error, "Unable to load nutrition management data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(loadNutritionData);
  }, [loadNutritionData]);

  const sortedFoods = useMemo(
    () => [...foods].sort((a, b) => a.name.localeCompare(b.name)),
    [foods]
  );

  const sortedConditions = useMemo(
    () => [...conditions].sort((a, b) => a.name.localeCompare(b.name)),
    [conditions]
  );

  const handleFoodSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");

    try {
      const { data } = await api.post<Food>("/admin/foods", {
        name: foodForm.name.trim(),
        name_ar: foodForm.name_ar.trim() || null,
        meal_type: foodForm.meal_type || null,
        meal_role: foodForm.meal_role || null,
      });

      setFoods((current) => [...current, data]);
      setFoodForm(initialFoodForm);
      setNotice("Food added successfully.");
    } catch (error) {
      setNotice(getApiMessage(error, "Unable to add food."));
    } finally {
      setSaving(false);
    }
  };

  const handleFoodUpdate = async (food: Food, updates: Partial<Pick<Food, "meal_type" | "meal_role">>) => {
    setNotice("");

    try {
      const { data } = await api.put<Food>(`/admin/foods/${food.id}`, {
        name: food.name,
        name_ar: food.name_ar || null,
        meal_type: (updates.meal_type ?? food.meal_type) || null,
        meal_role: (updates.meal_role ?? food.meal_role) || null,
      });

      setFoods((current) => current.map((item) => (item.id === data.id ? data : item)));
    } catch (error) {
      setNotice(getApiMessage(error, "Unable to update food."));
    }
  };

  const handleConditionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");

    try {
      const { data } = await api.post<Condition>("/admin/conditions", {
        name: conditionForm.name.trim(),
        name_ar: conditionForm.name_ar.trim() || null,
      });

      setConditions((current) => [...current, data]);
      setConditionForm(initialConditionForm);
      setNotice("Health goal added successfully.");
    } catch (error) {
      setNotice(getApiMessage(error, "Unable to add health goal."));
    } finally {
      setSaving(false);
    }
  };

  const handleDietaryRuleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");

    try {
      const { data } = await api.post<DietaryRule>("/admin/dietary-rules", {
        condition_id: Number(dietaryRuleForm.condition_id),
        food_id: Number(dietaryRuleForm.food_id),
        status: dietaryRuleForm.status,
        reason: dietaryRuleForm.reason.trim() || null,
        reason_ar: dietaryRuleForm.reason_ar.trim() || null,
        max_servings: dietaryRuleForm.max_servings.trim() || null,
      });

      setDietaryRules((current) => [
        data,
        ...current.filter((rule) => rule.id !== data.id),
      ]);
      setDietaryRuleForm(initialDietaryRuleForm);
      setNotice("Condition rule saved successfully.");
    } catch (error) {
      setNotice(getApiMessage(error, "Unable to save condition rule."));
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalRuleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");

    try {
      const { data } = await api.post<GlobalRule>("/admin/global-rules", {
        food_id: Number(globalRuleForm.food_id),
        status: globalRuleForm.status,
        reason: globalRuleForm.reason.trim() || null,
        reason_ar: globalRuleForm.reason_ar.trim() || null,
      });

      setGlobalRules((current) => [
        data,
        ...current.filter((rule) => rule.id !== data.id),
      ]);
      setGlobalRuleForm(initialGlobalRuleForm);
      setNotice("Global rule saved successfully.");
    } catch (error) {
      setNotice(getApiMessage(error, "Unable to save global rule."));
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (url: string, successMessage: string) => {
    if (!confirm("Delete this item?")) return;

    setNotice("");

    try {
      await api.delete(url);
      await loadNutritionData();
      setNotice(successMessage);
    } catch (error) {
      setNotice(getApiMessage(error, "Unable to delete item."));
    }
  };

  return (
    <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-green-50 text-green-700">
            <Utensils className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-950">
              Nutrition Rules Management
            </h2>
            <p className="text-sm text-gray-600">
              Manage foods, meal types, goals, and allowed/moderate/avoid rules.
            </p>
          </div>
        </div>
        <button
          onClick={loadNutritionData}
          disabled={loading}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition hover:border-green-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh nutrition
        </button>
      </div>

      {notice && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {notice}
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <form onSubmit={handleFoodSubmit} className="rounded-lg border border-gray-200 p-4">
          <h3 className="font-bold text-gray-950">Add Food</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Food name"
              value={foodForm.name}
              onChange={(value) => setFoodForm((current) => ({ ...current, name: value }))}
              required
            />
            <TextInput
              label="Arabic food name"
              value={foodForm.name_ar}
              onChange={(value) => setFoodForm((current) => ({ ...current, name_ar: value }))}
              dir="rtl"
            />
            <SelectInput
              label="Meal type"
              value={foodForm.meal_type}
              onChange={(value) =>
                setFoodForm((current) => ({ ...current, meal_type: value as MealType }))
              }
              options={mealTypes.map((mealType) => ({
                value: mealType,
                label: mealType || "Not set",
              }))}
            />
            <SelectInput
              label="Meal role"
              value={foodForm.meal_role}
              onChange={(value) =>
                setFoodForm((current) => ({ ...current, meal_role: value as MealRole }))
              }
              options={mealRoles.map((mealRole) => ({
                value: mealRole,
                label: mealRole || "Not set",
              }))}
            />
          </div>
          <SubmitButton saving={saving} label="Add food" />
        </form>

        <form onSubmit={handleConditionSubmit} className="rounded-lg border border-gray-200 p-4">
          <h3 className="font-bold text-gray-950">Add Health Goal</h3>
          <div className="mt-3">
            <TextInput
              label="Goal name"
              value={conditionForm.name}
              onChange={(value) =>
                setConditionForm((current) => ({ ...current, name: value }))
              }
              required
            />
            <TextInput
              label="Arabic goal name"
              value={conditionForm.name_ar}
              onChange={(value) =>
                setConditionForm((current) => ({ ...current, name_ar: value }))
              }
              dir="rtl"
            />
          </div>
          <SubmitButton saving={saving} label="Add goal" />
        </form>

        <form
          onSubmit={handleDietaryRuleSubmit}
          className="rounded-lg border border-gray-200 p-4"
        >
          <h3 className="font-bold text-gray-950">Add or Update Condition Rule</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <SelectInput
              label="Health goal"
              value={dietaryRuleForm.condition_id}
              onChange={(value) =>
                setDietaryRuleForm((current) => ({ ...current, condition_id: value }))
              }
              options={[
                { value: "", label: "Choose goal" },
                ...sortedConditions.map((condition) => ({
                  value: String(condition.id),
                  label: condition.name_ar
                    ? `${condition.name} / ${condition.name_ar}`
                    : condition.name,
                })),
              ]}
              required
            />
            <SelectInput
              label="Food"
              value={dietaryRuleForm.food_id}
              onChange={(value) =>
                setDietaryRuleForm((current) => ({ ...current, food_id: value }))
              }
              options={[
                { value: "", label: "Choose food" },
                ...sortedFoods.map((food) => ({
                  value: String(food.id),
                  label: food.name_ar ? `${food.name} / ${food.name_ar}` : food.name,
                })),
              ]}
              required
            />
            <SelectInput
              label="Status"
              value={dietaryRuleForm.status}
              onChange={(value) =>
                setDietaryRuleForm((current) => ({
                  ...current,
                  status: value as RuleStatus,
                }))
              }
              options={statuses.map((status) => ({ value: status, label: status }))}
            />
            <TextInput
              label="Max servings"
              value={dietaryRuleForm.max_servings}
              onChange={(value) =>
                setDietaryRuleForm((current) => ({ ...current, max_servings: value }))
              }
            />
            <TextArea
              label="Reason"
              value={dietaryRuleForm.reason}
              onChange={(value) =>
                setDietaryRuleForm((current) => ({ ...current, reason: value }))
              }
            />
            <TextArea
              label="Arabic reason"
              value={dietaryRuleForm.reason_ar}
              onChange={(value) =>
                setDietaryRuleForm((current) => ({ ...current, reason_ar: value }))
              }
              dir="rtl"
            />
          </div>
          <SubmitButton saving={saving} label="Save condition rule" />
        </form>

        <form onSubmit={handleGlobalRuleSubmit} className="rounded-lg border border-gray-200 p-4">
          <h3 className="font-bold text-gray-950">Add or Update Global Rule</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <SelectInput
              label="Food"
              value={globalRuleForm.food_id}
              onChange={(value) =>
                setGlobalRuleForm((current) => ({ ...current, food_id: value }))
              }
              options={[
                { value: "", label: "Choose food" },
                ...sortedFoods.map((food) => ({
                  value: String(food.id),
                  label: food.name_ar ? `${food.name} / ${food.name_ar}` : food.name,
                })),
              ]}
              required
            />
            <SelectInput
              label="Status"
              value={globalRuleForm.status}
              onChange={(value) =>
                setGlobalRuleForm((current) => ({
                  ...current,
                  status: value as RuleStatus,
                }))
              }
              options={statuses.map((status) => ({ value: status, label: status }))}
            />
            <TextArea
              label="Reason"
              value={globalRuleForm.reason}
              onChange={(value) =>
                setGlobalRuleForm((current) => ({ ...current, reason: value }))
              }
            />
            <TextArea
              label="Arabic reason"
              value={globalRuleForm.reason_ar}
              onChange={(value) =>
                setGlobalRuleForm((current) => ({ ...current, reason_ar: value }))
              }
              dir="rtl"
            />
          </div>
          <SubmitButton saving={saving} label="Save global rule" />
        </form>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title={`Foods (${foods.length})`}>
          <div className="max-h-96 overflow-auto">
            <div className="divide-y divide-gray-100 sm:hidden">
              {sortedFoods.length === 0 && (
                <p className="px-4 py-4 text-sm text-gray-500">No foods yet.</p>
              )}
              {sortedFoods.map((food) => (
                <article key={`${food.id}-card`} className="space-y-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Food
                      </p>
                      <h4 className="mt-1 break-words font-semibold text-gray-950">
                        {food.name}
                      </h4>
                      <p className="mt-1 break-words text-sm text-gray-600" dir="rtl">
                        {food.name_ar || "No Arabic name"}
                      </p>
                    </div>
                    <IconButton
                      label="Delete food"
                      onClick={() =>
                        deleteItem(`/admin/foods/${food.id}`, "Food deleted successfully.")
                      }
                    />
                  </div>
                  <SelectInput
                    label="Meal type"
                    value={food.meal_type || ""}
                    onChange={(value) =>
                      handleFoodUpdate(food, { meal_type: value as MealType })
                    }
                    options={mealTypes.map((mealType) => ({
                      value: mealType,
                      label: mealType || "Not set",
                    }))}
                  />
                  <SelectInput
                    label="Meal role"
                    value={food.meal_role || ""}
                    onChange={(value) =>
                      handleFoodUpdate(food, { meal_role: value as MealRole })
                    }
                    options={mealRoles.map((mealRole) => ({
                      value: mealRole,
                      label: mealRole || "Not set",
                    }))}
                  />
                </article>
              ))}
            </div>

            <table className="hidden w-full text-left text-sm sm:table">
              <thead className="sticky top-0 bg-gray-50 text-gray-600">
                <tr>
                  <th className="border-b border-gray-200 px-4 py-3">Food</th>
                  <th className="border-b border-gray-200 px-4 py-3">Arabic name</th>
                  <th className="border-b border-gray-200 px-4 py-3">Meal type</th>
                  <th className="border-b border-gray-200 px-4 py-3">Meal role</th>
                  <th className="border-b border-gray-200 px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedFoods.map((food) => (
                  <tr key={food.id}>
                    <td className="border-b border-gray-100 px-4 py-3 font-medium text-gray-900">
                      {food.name}
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3 text-gray-700" dir="rtl">
                      {food.name_ar || "-"}
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3">
                      <select
                        value={food.meal_type || ""}
                        onChange={(event) =>
                          handleFoodUpdate(food, { meal_type: event.target.value as MealType })
                        }
                        className="min-h-10 rounded-md border border-gray-300 px-2 text-gray-900"
                      >
                        {mealTypes.map((mealType) => (
                          <option key={mealType || "none"} value={mealType}>
                            {mealType || "Not set"}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3">
                      <select
                        value={food.meal_role || ""}
                        onChange={(event) =>
                          handleFoodUpdate(food, { meal_role: event.target.value as MealRole })
                        }
                        className="min-h-10 rounded-md border border-gray-300 px-2 text-gray-900"
                      >
                        {mealRoles.map((mealRole) => (
                          <option key={mealRole || "none"} value={mealRole}>
                            {mealRole || "Not set"}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3">
                      <IconButton
                        label="Delete food"
                        onClick={() =>
                          deleteItem(`/admin/foods/${food.id}`, "Food deleted successfully.")
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={`Health Goals (${conditions.length})`}>
          <SimpleList
            rows={sortedConditions.map((condition) => ({
              id: condition.id,
              cells: [condition.name, condition.name_ar || "-"],
              onDelete: () =>
                deleteItem(
                  `/admin/conditions/${condition.id}`,
                  "Health goal deleted successfully."
                ),
            }))}
            headers={["Goal", "Arabic goal"]}
          />
        </Panel>

        <Panel title={`Condition Rules (${dietaryRules.length})`}>
          <SimpleList
            rows={dietaryRules.map((rule) => ({
              id: rule.id,
              cells: [
                rule.condition?.name || "Unknown goal",
                rule.food?.name || "Unknown food",
                rule.status,
                rule.reason || "-",
                rule.reason_ar || "-",
              ],
              onDelete: () =>
                deleteItem(
                  `/admin/dietary-rules/${rule.id}`,
                  "Condition rule deleted successfully."
                ),
            }))}
            headers={["Goal", "Food", "Status", "Reason", "Arabic reason"]}
          />
        </Panel>

        <Panel title={`Global Rules (${globalRules.length})`}>
          <SimpleList
            rows={globalRules.map((rule) => ({
              id: rule.id,
              cells: [
                rule.food?.name || "Unknown food",
                rule.status,
                rule.reason || "-",
                rule.reason_ar || "-",
              ],
              onDelete: () =>
                deleteItem(
                  `/admin/global-rules/${rule.id}`,
                  "Global rule deleted successfully."
                ),
            }))}
            headers={["Food", "Status", "Reason", "Arabic reason"]}
          />
        </Panel>
      </div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required = false,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  dir?: "ltr" | "rtl" | "auto";
}) {
  return (
    <label>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        dir={dir}
        className="mt-1 min-h-10 w-full rounded-md border border-gray-300 px-3 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: "ltr" | "rtl" | "auto";
}) {
  return (
    <label className="sm:col-span-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        dir={dir}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <label>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-1 min-h-10 w-full rounded-md border border-gray-300 px-3 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
      >
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button
      disabled={saving}
      className="mt-4 min-h-10 w-full rounded-md bg-green-600 px-4 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? "Saving..." : label}
    </button>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 className="font-bold text-gray-950">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function SimpleList({
  headers,
  rows,
}: {
  headers: string[];
  rows: { id: number; cells: string[]; onDelete: () => void }[];
}) {
  return (
    <div className="max-h-96 overflow-auto">
      <div className="divide-y divide-gray-100 sm:hidden">
        {rows.length === 0 && (
          <p className="px-4 py-4 text-sm text-gray-500">No records yet.</p>
        )}
        {rows.map((row) => (
          <article key={`${row.id}-card`} className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                {row.cells.map((cell, index) => (
                  <div key={`${row.id}-${index}-card`}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {headers[index]}
                    </p>
                    <p className="mt-1 break-words text-sm text-gray-800">{cell}</p>
                  </div>
                ))}
              </div>
              <IconButton label="Delete" onClick={row.onDelete} />
            </div>
          </article>
        ))}
      </div>

      <table className="hidden w-full text-left text-sm sm:table">
        <thead className="sticky top-0 bg-gray-50 text-gray-600">
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-gray-200 px-4 py-3">
                {header}
              </th>
            ))}
            <th className="border-b border-gray-200 px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-4 text-gray-500" colSpan={headers.length + 1}>
                No records yet.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              {row.cells.map((cell, index) => (
                <td
                  key={`${row.id}-${index}`}
                  className="max-w-xs break-words border-b border-gray-100 px-4 py-3 text-gray-700"
                >
                  {cell}
                </td>
              ))}
              <td className="border-b border-gray-100 px-4 py-3">
                <IconButton label="Delete" onClick={row.onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
