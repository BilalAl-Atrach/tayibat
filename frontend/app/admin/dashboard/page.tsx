"use client";

import axios from "axios";
import {
  BadgeDollarSign,
  CalendarDays,
  Crown,
  Mail,
  MessageSquarePlus,
  RefreshCw,
  ReceiptText,
  Star,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminNutritionManager from "@/components/AdminNutritionManager";
import api from "@/lib/api";

interface Testimonial {
  id: number;
  name: string;
  quote: string;
  image?: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  role?: string | null;
  condition?: string | null;
  created_at?: string | null;
}

interface Condition {
  id: number;
  name: string;
  name_ar?: string | null;
}

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at?: string | null;
}

interface GuidanceFeedback {
  id: number;
  condition_name: string;
  rating?: number | null;
  message: string;
  created_at?: string | null;
  user?: User | null;
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
  user?: Pick<User, "id" | "name" | "email"> | null;
}

interface Subscription {
  id: number;
  plan: string;
  status: string;
  price: number;
  started_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  user?: Pick<User, "id" | "name" | "email"> | null;
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
  user?: Pick<User, "id" | "name" | "email"> | null;
}

interface AdminSubscriptionsResponse {
  subscriptions: Subscription[];
  diet_plan_purchases: DietPlanPurchase[];
}

interface PaymentWebhookLog {
  id: number;
  provider: string;
  provider_reference?: string | null;
  event_status?: string | null;
  signature_valid?: boolean | null;
  message?: string | null;
  created_at?: string | null;
  transaction?: (PaymentTransaction & {
    user?: Pick<User, "id" | "name" | "email"> | null;
  }) | null;
}

const initialTestimonial = {
  name: "",
  quote: "",
  image: "",
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [guidanceFeedbacks, setGuidanceFeedbacks] = useState<GuidanceFeedback[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [dietPlanPurchases, setDietPlanPurchases] = useState<DietPlanPurchase[]>([]);
  const [paymentWebhookLogs, setPaymentWebhookLogs] = useState<PaymentWebhookLog[]>([]);
  const [testimonialForm, setTestimonialForm] = useState(initialTestimonial);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedAccessConditionId, setSelectedAccessConditionId] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("1 week");
  const [selectedTransactionId, setSelectedTransactionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingTestimonial, setSavingTestimonial] = useState(false);
  const [savingAccessAction, setSavingAccessAction] = useState("");
  const [notice, setNotice] = useState("");
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setNotice("");

    try {
      const [
        testimonialsResponse,
        usersResponse,
        conditionsResponse,
        contactMessagesResponse,
        guidanceFeedbackResponse,
        paymentTransactionsResponse,
        subscriptionsResponse,
        webhookLogsResponse,
      ] =
        await Promise.all([
          api.get<Testimonial[]>("/testimonials"),
          api.get<User[]>("/users"),
          api.get<Condition[]>("/conditions"),
          api.get<ContactMessage[]>("/contact-messages"),
          api.get<GuidanceFeedback[]>("/guidance-feedback"),
          api.get<PaymentTransaction[]>("/admin/payment-transactions"),
          api.get<AdminSubscriptionsResponse>("/admin/subscriptions"),
          api.get<PaymentWebhookLog[]>("/admin/payment-webhook-logs"),
        ]);

      setTestimonials(testimonialsResponse.data);
      setUsers(usersResponse.data);
      setConditions(conditionsResponse.data);
      setSelectedAccessConditionId((current) => current || String(conditionsResponse.data[0]?.id || ""));
      setContactMessages(contactMessagesResponse.data);
      setGuidanceFeedbacks(guidanceFeedbackResponse.data);
      setPaymentTransactions(paymentTransactionsResponse.data);
      setSubscriptions(subscriptionsResponse.data.subscriptions || []);
      setDietPlanPurchases(subscriptionsResponse.data.diet_plan_purchases || []);
      setPaymentWebhookLogs(webhookLogsResponse.data);
    } catch (error) {
      setNotice(getApiMessage(error, "Unable to load the admin dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      api
        .get<User>("/me")
        .then(({ data }) => {
          if (data.role !== "admin") {
            setIsAuthorized(false);
            router.replace("/");
            return;
          }

          setIsAuthorized(true);
        })
        .catch(() => {
          setIsAuthorized(false);
          router.replace("/");
        })
        .finally(() => {
          setCheckingAccess(false);
        });
    });
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;

    queueMicrotask(loadDashboard);
  }, [isAuthorized, loadDashboard]);

  const handleTestimonialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingTestimonial(true);
    setNotice("");

    try {
      const payload = {
        ...testimonialForm,
        image: testimonialForm.image.trim() || null,
      };

      const { data } = await api.post<Testimonial>("/testimonials", payload);
      setTestimonials((current) => [data, ...current]);
      setTestimonialForm(initialTestimonial);
      setNotice("Testimonial added successfully.");
    } catch (error) {
      setNotice(getApiMessage(error, "Unable to add testimonial."));
    } finally {
      setSavingTestimonial(false);
    }
  };

  const runAdminAction = async (label: string, action: () => Promise<unknown>) => {
    setSavingAccessAction(label);
    setNotice("");

    try {
      await action();
      setNotice(`${label} completed successfully.`);
      await loadDashboard();
    } catch (error) {
      setNotice(getApiMessage(error, `${label} failed.`));
    } finally {
      setSavingAccessAction("");
    }
  };

  const requireSelectedUser = () => {
    if (!selectedUserId) {
      setNotice("Choose a user first.");
      return false;
    }

    return true;
  };

  const requireSelectedTransaction = () => {
    if (!selectedTransactionId) {
      setNotice("Choose a payment transaction first.");
      return false;
    }

    return true;
  };

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-sm">
          Checking admin access...
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-medium text-red-800">
          Admin access only. Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="border-b border-green-100 bg-white">
        <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Admin Dashboard
              </p>
              <h1 className="mt-1 text-3xl font-bold text-gray-950">
                Manage Tayibat content and activity
              </h1>
            </div>
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-gray-950 px-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6">
        {notice && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {notice}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Star} label="Testimonials" value={testimonials.length} />
          <StatCard icon={Users} label="Users" value={users.length} />
          <StatCard icon={Mail} label="Messages" value={contactMessages.length} />
          <StatCard icon={MessageSquarePlus} label="Feedback" value={guidanceFeedbacks.length} />
          <StatCard icon={ReceiptText} label="Payment Transactions" value={paymentTransactions.length} />
          <StatCard icon={Crown} label="Premium Subscriptions" value={subscriptions.length} />
          <StatCard icon={CalendarDays} label="Diet Plan Purchases" value={dietPlanPurchases.length} />
          <StatCard icon={RefreshCw} label="Callback Logs" value={paymentWebhookLogs.length} />
          <StatCard
            icon={BadgeDollarSign}
            label="Paid Revenue"
            value={formatMoney(
              paymentTransactions
                .filter((transaction) => transaction.status === "paid")
                .reduce((total, transaction) => total + Number(transaction.amount || 0), 0)
            )}
          />
        </section>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <SectionTitle icon={Crown} title="Manual Access Controls" />
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <label>
                <span className="text-sm font-semibold text-gray-700">User</span>
                <select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-md border border-gray-300 px-3 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="">Select user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <ActionButton
                  label="Grant Premium"
                  busy={savingAccessAction === "Grant Premium"}
                  onClick={() => {
                    if (!requireSelectedUser()) return;
                    void runAdminAction("Grant Premium", () =>
                      api.post(`/admin/users/${selectedUserId}/premium/grant`)
                    );
                  }}
                />
                <ActionButton
                  label="Revoke Premium"
                  variant="danger"
                  busy={savingAccessAction === "Revoke Premium"}
                  onClick={() => {
                    if (!requireSelectedUser()) return;
                    void runAdminAction("Revoke Premium", () =>
                      api.post(`/admin/users/${selectedUserId}/premium/revoke`)
                    );
                  }}
                />
                <ActionButton
                  label="Reset AI Usage"
                  variant="secondary"
                  busy={savingAccessAction === "Reset AI Usage"}
                  onClick={() => {
                    if (!requireSelectedUser()) return;
                    void runAdminAction("Reset AI Usage", () =>
                      api.post(`/admin/users/${selectedUserId}/ai-usage/reset`)
                    );
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <label>
                <span className="text-sm font-semibold text-gray-700">Health goal</span>
                <select
                  value={selectedAccessConditionId}
                  onChange={(event) => setSelectedAccessConditionId(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-md border border-gray-300 px-3 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  {conditions.map((condition) => (
                    <option key={condition.id} value={condition.id}>
                      {condition.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold text-gray-700">Diet plan duration</span>
                <select
                  value={selectedDuration}
                  onChange={(event) => setSelectedDuration(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-md border border-gray-300 px-3 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  {["1 week", "1 month", "3 months"].map((duration) => (
                    <option key={duration} value={duration}>
                      {duration}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <ActionButton
                  label="Grant Plan"
                  busy={savingAccessAction === "Grant Plan"}
                  onClick={() => {
                    if (!requireSelectedUser()) return;
                    if (!selectedAccessConditionId) { setNotice("Choose a health goal first."); return; }
                    void runAdminAction("Grant Plan", () =>
                      api.post(`/admin/users/${selectedUserId}/diet-plan-access/grant`, {
                        duration: selectedDuration,
                        condition_id: selectedAccessConditionId,
                      })
                    );
                  }}
                />
                <ActionButton
                  label="Revoke Plan"
                  variant="danger"
                  busy={savingAccessAction === "Revoke Plan"}
                  onClick={() => {
                    if (!requireSelectedUser()) return;
                    if (!selectedAccessConditionId) { setNotice("Choose a health goal first."); return; }
                    void runAdminAction("Revoke Plan", () =>
                      api.post(`/admin/users/${selectedUserId}/diet-plan-access/revoke`, {
                        duration: selectedDuration,
                        condition_id: selectedAccessConditionId,
                      })
                    );
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <label>
                <span className="text-sm font-semibold text-gray-700">Payment transaction</span>
                <select
                  value={selectedTransactionId}
                  onChange={(event) => setSelectedTransactionId(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-md border border-gray-300 px-3 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="">Select transaction</option>
                  {paymentTransactions.map((transaction) => (
                    <option key={transaction.id} value={transaction.id}>
                      #{transaction.id} - {transaction.type} - {formatMoney(transaction.amount, transaction.currency)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <ActionButton
                  label="Mark Paid"
                  busy={savingAccessAction === "Mark Paid"}
                  onClick={() => {
                    if (!requireSelectedTransaction()) return;
                    void runAdminAction("Mark Paid", () =>
                      api.post(`/admin/payment-transactions/${selectedTransactionId}/mark-paid`)
                    );
                  }}
                />
                <ActionButton
                  label="Mark Failed"
                  variant="danger"
                  busy={savingAccessAction === "Mark Failed"}
                  onClick={() => {
                    if (!requireSelectedTransaction()) return;
                    void runAdminAction("Mark Failed", () =>
                      api.post(`/admin/payment-transactions/${selectedTransactionId}/mark-failed`)
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <AdminNutritionManager />

        <section className="mt-6">
          <form
            onSubmit={handleTestimonialSubmit}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <SectionTitle icon={MessageSquarePlus} title="Add Testimonial" />
            <div className="mt-4 grid gap-3">
              <TextInput
                label="Customer name"
                value={testimonialForm.name}
                onChange={(value) =>
                  setTestimonialForm((current) => ({ ...current, name: value }))
                }
                required
              />
              <TextInput
                label="Image URL"
                value={testimonialForm.image}
                onChange={(value) =>
                  setTestimonialForm((current) => ({ ...current, image: value }))
                }
              />
              <label>
                <span className="text-sm font-semibold text-gray-700">Quote</span>
                <textarea
                  value={testimonialForm.quote}
                  onChange={(event) =>
                    setTestimonialForm((current) => ({
                      ...current,
                      quote: event.target.value,
                    }))
                  }
                  required
                  rows={5}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </label>
            </div>
            <button
              disabled={savingTestimonial}
              className="mt-4 min-h-11 w-full rounded-md bg-green-600 px-4 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingTestimonial ? "Adding..." : "Add testimonial"}
            </button>
          </form>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <DataPanel title="Payment Transactions">
            <Table
              headers={["User", "Type", "Amount", "Status", "Provider Ref", "Date"]}
              rows={paymentTransactions.map((transaction) => [
                transaction.user
                  ? `${transaction.user.name} (${transaction.user.email})`
                  : "Unknown user",
                transaction.type === "diet_plan"
                  ? `Diet plan - ${transaction.diet_plan_duration || "-"} - ${transaction.condition?.name || "Unknown goal"}`
                  : "Premium",
                formatMoney(transaction.amount, transaction.currency || "USD"),
                transaction.status,
                transaction.provider_reference || "-",
                formatDate(transaction.created_at),
              ])}
              emptyText="No payment transactions yet."
            />
          </DataPanel>

          <DataPanel title="Premium Subscriptions">
            <Table
              headers={["User", "Plan", "Price", "Status", "Started", "Expires"]}
              rows={subscriptions.map((subscription) => [
                subscription.user
                  ? `${subscription.user.name} (${subscription.user.email})`
                  : "Unknown user",
                subscription.plan,
                formatMoney(subscription.price),
                subscription.status,
                formatDate(subscription.started_at || subscription.created_at),
                subscription.expires_at ? formatDate(subscription.expires_at) : "No expiry set",
              ])}
              emptyText="No premium subscriptions yet."
            />
          </DataPanel>

          <DataPanel title="Diet Plan Purchases">
            <Table
              headers={["User", "Duration", "Goal", "Price", "Status", "Paid At"]}
              rows={dietPlanPurchases.map((purchase) => [
                purchase.user
                  ? `${purchase.user.name} (${purchase.user.email})`
                  : "Unknown user",
                purchase.duration,
                purchase.condition?.name || "Unknown goal",
                formatMoney(purchase.price),
                purchase.status,
                formatDate(purchase.paid_at || purchase.created_at),
              ])}
              emptyText="No diet plan purchases yet."
            />
          </DataPanel>

          <DataPanel title="Payment Callback Logs">
            <Table
              headers={["Provider Ref", "Status", "Signature", "Message", "Date"]}
              rows={paymentWebhookLogs.map((log) => [
                log.provider_reference || "-",
                log.event_status || "-",
                log.signature_valid === null || log.signature_valid === undefined
                  ? "Not provided"
                  : log.signature_valid
                    ? "Valid"
                    : "Invalid",
                log.message || "-",
                formatDate(log.created_at),
              ])}
              emptyText="No callback logs yet."
            />
          </DataPanel>

          <DataPanel title="Testimonials">
            <Table
              headers={["Name", "Quote"]}
              rows={testimonials.map((testimonial) => [
                testimonial.name,
                testimonial.quote,
              ])}
              emptyText="No testimonials yet."
            />
          </DataPanel>

          <DataPanel title="Users">
            <Table
              headers={["Name", "Email", "Role", "Condition"]}
              rows={users.map((user) => [
                user.name,
                user.email,
                user.role || "user",
                user.condition || "Not selected",
              ])}
              emptyText="No users yet."
            />
          </DataPanel>

          <DataPanel title="Contact Messages">
            <Table
              headers={["Name", "Email", "Message", "Date"]}
              rows={contactMessages.map((message) => [
                message.name,
                message.email,
                message.message,
                formatDate(message.created_at),
              ])}
              emptyText="No contact messages yet."
            />
          </DataPanel>

          <DataPanel title="Guidance Feedback">
            <Table
              headers={["User", "Goal", "Rating", "Feedback", "Date"]}
              rows={guidanceFeedbacks.map((feedback) => [
                feedback.user?.name || "Unknown user",
                feedback.condition_name || "Unknown goal",
                feedback.rating ? `${feedback.rating}/5` : "-",
                feedback.message,
                formatDate(feedback.created_at),
              ])}
              emptyText="No guidance feedback yet."
            />
          </DataPanel>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-green-50 text-green-700">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-2xl font-bold text-gray-950">{value}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-gray-600">{label}</p>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-green-50 text-green-700">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="text-xl font-bold text-gray-950">{title}</h2>
    </div>
  );
}

function TextInput({
  label,
  type = "text",
  value,
  onChange,
  required = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-1 min-h-11 w-full rounded-md border border-gray-300 px-3 text-gray-950 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
      />
    </label>
  );
}

function ActionButton({
  label,
  onClick,
  busy = false,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const classes = {
    primary: "bg-green-600 text-white hover:bg-green-700",
    secondary: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${classes[variant]}`}
    >
      {busy ? "Working..." : label}
    </button>
  );
}

function DataPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-gray-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Table({
  headers,
  rows,
  emptyText,
}: {
  headers: string[];
  rows: string[][];
  emptyText: string;
}) {
  return (
    <div className="max-h-96 overflow-auto">
      <div className="divide-y divide-gray-100 sm:hidden">
        {rows.length === 0 && (
          <p className="px-4 py-5 text-sm text-gray-500">{emptyText}</p>
        )}
        {rows.map((row, rowIndex) => (
          <article key={`${row.join("-")}-${rowIndex}-card`} className="space-y-3 px-4 py-4">
            {row.map((cell, cellIndex) => (
              <div key={`${cell}-${cellIndex}-card`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {headers[cellIndex]}
                </p>
                <p className="mt-1 break-words text-sm text-gray-800">{cell}</p>
              </div>
            ))}
          </article>
        ))}
      </div>

      <table className="hidden w-full text-left text-sm sm:table">
        <thead className="sticky top-0 bg-gray-50 text-gray-600">
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
                <td
                  key={`${cell}-${cellIndex}`}
                  className="max-w-sm break-words border-b border-gray-100 px-4 py-3 text-gray-700"
                >
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
