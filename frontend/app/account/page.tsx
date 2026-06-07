"use client";

import axios from "axios";
import Link from "next/link";
import { Bot, CalendarDays, CheckCircle2, CreditCard, Crown, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";

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

interface Condition {
  id: number;
  name: string;
  name_ar?: string | null;
}

interface Subscription {
  id: number;
  plan: string;
  status: string;
  price: number;
  started_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
}

interface DietPlanPurchase {
  id: number;
  condition_id?: number | null;
  condition?: Condition | null;
  duration: string;
  price: number;
  status: string;
  paid_at?: string | null;
  created_at?: string | null;
}

interface PaymentTransaction {
  id: number;
  type: string;
  diet_plan_duration?: string | null;
  condition_id?: number | null;
  condition?: Condition | null;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  provider_reference?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
}

interface BillingHistory {
  access: BillingAccess;
  subscriptions: Subscription[];
  diet_plan_purchases: DietPlanPurchase[];
  transactions: PaymentTransaction[];
}

const durations = ["1 week", "1 month", "3 months"];

const getApiMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    if (!error.response) return "Cannot reach the backend. Make sure Laravel is running.";
    return error.response.data?.message || error.response.data?.error || fallback;
  }

  return fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatMoney = (amount?: number | string | null, currency = "USD") => {
  const value = Number(amount ?? 0);

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).format(Number.isFinite(value) ? value : 0);
};

export default function AccountPage() {
  const [history, setHistory] = useState<BillingHistory | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [selectedConditionId, setSelectedConditionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [startingCheckout, setStartingCheckout] = useState("");
  const [notice, setNotice] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    setNotice("");

    try {
      const { data } = await api.get<BillingHistory>("/billing/history");
      setHistory(data);
    } catch (error) {
      setNotice(getApiMessage(error, "Unable to load your account."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void Promise.all([
        loadHistory(),
        api.get<Condition[]>("/conditions").then(({ data }) => {
          setConditions(data);
          setSelectedConditionId((current) => current || String(data[0]?.id || ""));
        }),
      ]);
    });
  }, []);

  const startCheckout = async (type: "premium" | "diet_plan", duration?: string) => {
    setStartingCheckout(duration || type);
    setNotice("");

    try {
      const { data } = await api.post<{ message?: string; checkout_url?: string | null }>("/billing/checkout", {
        type,
        duration,
        condition_id: type === "diet_plan" ? selectedConditionId : undefined,
      });

      if (data.checkout_url) {
        window.location.assign(data.checkout_url);
        return;
      }

      setNotice(data.message || "Payment checkout is not configured yet.");
      await loadHistory();
    } catch (error) {
      setNotice(getApiMessage(error, "Unable to start payment."));
    } finally {
      setStartingCheckout("");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-sm">
          Loading your account...
        </div>
      </main>
    );
  }

  if (!history) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <section className="w-full max-w-md rounded-lg border border-amber-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-950">Account unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">{notice}</p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-green-600 px-5 font-semibold text-white transition hover:bg-green-700"
          >
            Go Home
          </Link>
        </section>
      </main>
    );
  }

  const { access } = history;
  const selectedCondition = conditions.find((condition) => String(condition.id) === selectedConditionId);

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b border-green-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">My Account</p>
              <h1 className="mt-1 text-3xl font-bold text-gray-950">Your Tayibat access</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Review your Premium status, AI usage, diet plan purchases, and payment history.
              </p>
            </div>
            <button
              onClick={loadHistory}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {notice && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {notice}
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-3">
          <StatusCard
            icon={Crown}
            title="Premium"
            value={access.premium ? "Active" : "Free"}
            detail={access.premium ? "Full tables and unlimited AI are unlocked for your active month." : "Upgrade to unlock all rows and unlimited AI for 1 month."}
            tone={access.premium ? "success" : "neutral"}
          />
          <StatusCard
            icon={Bot}
            title="AI Questions"
            value={access.ai.unlimited ? "Unlimited" : `${access.ai.remaining ?? 0} remaining`}
            detail={access.ai.unlimited ? "Premium AI access is active." : `${access.ai.used}/${access.ai.free_limit} free questions used.`}
            tone={access.ai.unlimited ? "success" : "neutral"}
          />
          <StatusCard
            icon={CalendarDays}
            title="Diet Plans"
            value={`${history.diet_plan_purchases.filter((purchase) => purchase.status === "active").length}`}
            detail="Purchased goal-specific plans are shown below."
            tone="neutral"
          />
        </section>

        {!access.premium && (
          <section className="mt-6 rounded-lg border-2 border-green-500 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-green-50 text-green-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-gray-950">Upgrade to Premium</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Unlock all food table rows and unlimited AI guidance for 1 month for {formatMoney(access.prices.premium)}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => startCheckout("premium")}
                disabled={Boolean(startingCheckout)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-green-600 px-5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                <CreditCard className="h-4 w-4" />
                {startingCheckout === "premium" ? "Starting..." : "Upgrade"}
              </button>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-950">Buy a Goal-Specific Diet Plan</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Choose the health goal first. A purchased plan unlocks only that goal and duration.
              </p>
            </div>
            <select
              value={selectedConditionId}
              onChange={(event) => setSelectedConditionId(event.target.value)}
              className="min-h-11 rounded-md border border-gray-300 px-3 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              {conditions.map((condition) => (
                <option key={condition.id} value={condition.id}>
                  {condition.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          {durations.map((duration) => {
            const active = history.diet_plan_purchases.some(
              (purchase) =>
                purchase.status === "active" &&
                purchase.duration === duration &&
                String(purchase.condition_id || purchase.condition?.id || "") === selectedConditionId
            );
            return (
              <article key={duration} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-gray-950">{duration}</h3>
                  {active && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                </div>
                <p className="mt-2 text-2xl font-bold text-green-700">
                  {formatMoney(access.prices.diet_plans[duration])}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {active
                    ? `Purchased for ${selectedCondition?.name || "this goal"} and ready to generate.`
                    : `Buy this duration for ${selectedCondition?.name || "the selected goal"} before generating the plan.`}
                </p>
                {!active && (
                  <button
                    onClick={() => startCheckout("diet_plan", duration)}
                    disabled={Boolean(startingCheckout) || !selectedConditionId}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-green-600 px-4 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-60"
                  >
                    {startingCheckout === duration ? "Starting..." : "Buy plan"}
                  </button>
                )}
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <DataPanel title="Premium Subscriptions">
            <AccountTable
              headers={["Plan", "Price", "Status", "Started", "Expires"]}
              rows={history.subscriptions.map((subscription) => [
                subscription.plan,
                formatMoney(subscription.price),
                subscription.status,
                formatDate(subscription.started_at || subscription.created_at),
                subscription.expires_at ? formatDate(subscription.expires_at) : "No expiry set",
              ])}
              emptyText="No premium subscription records yet."
            />
          </DataPanel>

          <DataPanel title="Diet Plan Purchases">
            <AccountTable
              headers={["Duration", "Goal", "Price", "Status", "Paid At"]}
              rows={history.diet_plan_purchases.map((purchase) => [
                purchase.duration,
                purchase.condition?.name || "Unknown goal",
                formatMoney(purchase.price),
                purchase.status,
                formatDate(purchase.paid_at || purchase.created_at),
              ])}
              emptyText="No diet plan purchases yet."
            />
          </DataPanel>

          <DataPanel title="Payment History">
            <AccountTable
              headers={["Type", "Amount", "Status", "Reference", "Date"]}
              rows={history.transactions.map((transaction) => [
                transaction.type === "diet_plan"
                  ? `Diet plan - ${transaction.diet_plan_duration || "-"} - ${transaction.condition?.name || "Unknown goal"}`
                  : "Premium",
                formatMoney(transaction.amount, transaction.currency || "USD"),
                transaction.status,
                transaction.provider_reference || "-",
                formatDate(transaction.created_at),
              ])}
              emptyText="No payment history yet."
            />
          </DataPanel>
        </section>
      </div>
    </main>
  );
}

function StatusCard({
  icon: Icon,
  title,
  value,
  detail,
  tone,
}: {
  icon: typeof Crown;
  title: string;
  value: string;
  detail: string;
  tone: "success" | "neutral";
}) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-md ${tone === "success" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-xl font-bold text-gray-950">{value}</span>
      </div>
      <h2 className="mt-4 font-semibold text-gray-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-gray-600">{detail}</p>
    </article>
  );
}

function DataPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-gray-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function AccountTable({
  headers,
  rows,
  emptyText,
}: {
  headers: string[];
  rows: string[][];
  emptyText: string;
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-gray-200 px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-5 text-gray-500" colSpan={headers.length}>
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((row, rowIndex) => (
            <tr key={`${row.join("-")}-${rowIndex}`} className="align-top">
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="border-b border-gray-100 px-4 py-3 text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
