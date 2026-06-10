"use client";

import axios from "axios";
import dynamic from "next/dynamic";
import { Download, Send, Leaf, ChevronRight, Star, MessageCircle, CalendarDays, Utensils, RefreshCw, Lock, CreditCard } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import MedicalDisclaimerBanner from "@/components/MedicalDisclaimerBanner";
import type {
  ActiveTab,
  BillingAccess,
  ChatMessage,
  Condition,
  DietPlanResponse,
  FoodRule,
  GuidanceChatResponse,
  GuidanceLanguage,
  SavedDietPlanResponse,
} from "@/components/guidance/types";
import {
  durationLabels,
  getDietPlanInstructions,
  importantInstructionLabel,
  isMealFlexibilityInstruction,
  uiText,
} from "@/components/guidance/text";
import {
  escapeHtml,
  localizedConditionName,
  translateDayLabel,
  translateMeal,
  translateStatus,
} from "@/components/guidance/helpers";

const FoodColumn = dynamic(() => import("@/components/guidance/GuidanceFoodColumn"), {
  loading: () => <div className="min-h-40 rounded-2xl border border-stone-200 bg-stone-50" />,
});

const PlanViewer = dynamic(() => import("@/components/guidance/GuidancePlanViewer"), {
  ssr: false,
});

const durations = ["1 week", "1 month", "3 months"];
let conditionsRequest: Promise<Condition[]> | null = null;

const getApiMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    if (!error.response) return "Cannot reach the server. Make sure it is running.";
    return error.response?.data?.message || error.response?.data?.error || fallback;
  }
  return fallback;
};
type CurrentUser = {
  id?: number | string;
  email?: string | null;
};
const getUserStorageKey = (user: CurrentUser) => {
  if (user.id !== undefined && user.id !== null) return `user-${user.id}`;
  if (user.email) return `email-${user.email.toLowerCase()}`;
  return null;
};
const getSelectedConditionKey = (userKey: string) => `tayibat-selected-condition:${userKey}`;
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
  const [userStorageKey, setUserStorageKey] = useState<string | null>(null);
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
    let cancelled = false;

    api.get<CurrentUser>("/me")
      .then(({ data }) => {
        if (cancelled) return;
        setUserStorageKey(getUserStorageKey(data));
      })
      .catch(() => {
        if (cancelled) return;
        setUserStorageKey(null);
        setChatHistory([]);
        setDietPlan(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const loadBillingAccess = useCallback(async (force = false) => {
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
        const stored = userStorageKey ? localStorage.getItem(getSelectedConditionKey(userStorageKey)) : null;
        const match = data.find((c) => c.name === stored);
        if (match) setSelectedCondition((current) => current?.id === match.id ? current : match);
        api.get<{ condition?: string | null }>("/user/condition")
          .then(({ data: ud }) => {
            const db = data.find((c) => c.name === ud.condition);
            if (db) {
              if (userStorageKey) localStorage.setItem(getSelectedConditionKey(userStorageKey), db.name);
              setSelectedCondition((current) => current?.id === db.id ? current : db);
            }
          })
          .catch(() => {
            if (match) setSelectedCondition((current) => current?.id === match.id ? current : match);
          });
      })
      .catch((e) => setNotice(getApiMessage(e, "Unable to load health goals.")))
      .finally(() => setLoading((s) => ({ ...s, conditions: false })));
  }, [userStorageKey]);

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
    if (!selectedCondition) {
      queueMicrotask(() => setDietPlan(null));
      return;
    }

    let cancelled = false;

    api.get<SavedDietPlanResponse>("/diet-plan/saved", {
      params: { condition_id: selectedCondition.id },
    })
      .then(({ data }) => {
        if (cancelled) return;
        if (!data.diet_plan) {
          setDietPlan(null);
          return;
        }
        setDietPlan(data.diet_plan);
        if (data.diet_plan.duration) setPlanDuration(data.diet_plan.duration);
      })
      .catch(() => {
        if (!cancelled) setDietPlan(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCondition]);

  /* Restore chat */
  useEffect(() => {
    if (!selectedCondition) {
      queueMicrotask(() => setChatHistory([]));
      return;
    }

    let cancelled = false;

    api.get<GuidanceChatResponse>("/guidance-chat", {
      params: { condition_id: selectedCondition.id },
    })
      .then(({ data }) => {
        if (!cancelled) setChatHistory(Array.isArray(data.messages) ? data.messages : []);
      })
      .catch(() => {
        if (!cancelled) setChatHistory([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCondition]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const allowedRules = useMemo(() => foodRules.filter((r) => r.status !== "avoid"), [foodRules]);
  const avoidRules   = useMemo(() => foodRules.filter((r) => r.status === "avoid"), [foodRules]);
  const visibleAllowedRules = isPremium ? allowedRules : allowedRules.slice(0, 5);
  const visibleAvoidRules = isPremium ? avoidRules : avoidRules.slice(0, 5);

  const handleSelectCondition = async (condition: Condition) => {
    setSelectedCondition(condition); setDietPlan(null); setIsPlanOpen(false);
    if (userStorageKey) localStorage.setItem(getSelectedConditionKey(userStorageKey), condition.name);
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
    if (userStorageKey) localStorage.removeItem(getSelectedConditionKey(userStorageKey));
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
    } catch (e) { setNotice(getApiMessage(e, "Diet plan generation is unavailable.")); }
    finally { setLoading((s) => ({ ...s, plan: false })); }
  };

  const handleDownloadPlanPdf = () => {
    if (!dietPlan) return;
    const pw = window.open("", "_blank", "width=1100,height=800");
    if (!pw) { setNotice("Allow pop-ups to download the PDF."); return; }
    const condName = localizedConditionName(selectedCondition, language) || dietPlan.condition || "Diet plan";
    const instructionsMarkup = getDietPlanInstructions(selectedCondition?.name || dietPlan.condition, language, isPremium)
      .map((i) => {
        const important = isMealFlexibilityInstruction(i, language);

        return important
          ? `<li class="important-instruction"><strong>${escapeHtml(importantInstructionLabel(language))}</strong><span>${escapeHtml(i)}</span></li>`
          : `<li>${escapeHtml(i)}</li>`;
      })
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
      .instructions h2{margin-bottom:10px}li{margin-bottom:6px;color:#374151}
      .important-instruction{list-style:none;border:1px solid #f59e0b;background:#fffbeb;padding:10px 12px;margin:8px 0;color:#78350f}
      .important-instruction strong{display:inline-block;margin-inline-end:8px;color:#92400e}</style></head>
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
    const outgoing = chatMessage.trim();
    const save = (msgs: ChatMessage[]) => {
      setChatHistory((curr) => {
        const next = [...curr, ...msgs];
        api.put("/guidance-chat", {
          condition_id: selectedCondition.id,
          messages: next,
        }).catch(() => {
          setNotice("Your answer was shown, but the chat history could not be saved.");
        });
        return next;
      });
    };
    setChatMessage(""); setLoading((s) => ({ ...s, chat: true })); setNotice("");
    try {
      save([{ role: "user", text: outgoing }]);
      const { data } = await axios.post<{ reply: string }>("/api/guidance-agent", {
        condition: selectedCondition.id, conditionName: selectedCondition.name,
        language, message: outgoing, chatHistory,
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
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="mb-3 font-semibold text-stone-800">{t.instructions}</h3>
        <ul className={`space-y-2 text-sm leading-relaxed text-stone-600 ${isArabic ? "list-none pr-0" : "list-none pl-0"}`}>
          {getDietPlanInstructions(selectedCondition?.name, language, isPremium).map((instr, i) => {
            const important = isMealFlexibilityInstruction(instr, language);

            return (
            <li
              key={i}
              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${
                important
                  ? "border border-amber-200 bg-amber-50 text-amber-950 shadow-sm"
                  : "text-stone-600"
              }`}
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${important ? "bg-amber-500" : "bg-emerald-400"}`} />
              <span>
                {important && (
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-amber-700">
                    {importantInstructionLabel(language)}
                  </span>
                )}
                {instr}
              </span>
            </li>
          );
          })}
        </ul>
      </div>
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
            language={language}
            onClose={() => setIsPlanOpen(false)}
            onDownload={handleDownloadPlanPdf}
            t={t}
            instructions={getDietPlanInstructions(selectedCondition?.name || dietPlan.condition, language, isPremium)}
            isImportantInstruction={(instruction) => isMealFlexibilityInstruction(instruction, language)}
            importantLabel={importantInstructionLabel(language)}
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
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-amber-950">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-amber-900">{message}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CreditCard className="h-4 w-4" />
          <span>{price} &middot; {actionLabel}</span>
        </button>
      </div>
    </div>
  );
}
