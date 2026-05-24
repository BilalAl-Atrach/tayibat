import Link from "next/link";
import { Bot, CalendarDays, Check, Crown, ShieldCheck } from "lucide-react";
import MedicalDisclaimerBanner from "@/components/MedicalDisclaimerBanner";

const dietPlanPackages = [
  {
    title: "1 Week Diet Plan",
    price: "$9",
    detail: "A 7-day meal plan generated from the allowed and moderate foods for the selected goal.",
  },
  {
    title: "1 Month Diet Plan",
    price: "$15",
    detail: "A 30-day plan with more rotation across meals and days.",
  },
  {
    title: "3 Months Diet Plan",
    price: "$30",
    detail: "A 90-day plan for longer structure and broader meal variety.",
  },
];

const premiumBenefits = [
  "View all rows in both food guidance tables for 1 month",
  "Ask unlimited AI guidance questions for 1 month",
  "Keep free access limits away from the guidance flow during the active month",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-emerald-100 bg-emerald-50/50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Tayibat Pricing
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
            Choose full guidance access or a paid diet plan package
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-700">
            Premium unlocks the food tables and AI guide for 1 month. Diet plan generation is sold separately by health goal and duration.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_1.35fr]">
        <div className="lg:col-span-2">
          <MedicalDisclaimerBanner />
        </div>

        <article className="rounded-lg border-2 border-emerald-500 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-gray-950">Premium Access</h2>
              <p className="text-sm font-medium text-emerald-700">Food tables + AI guide for 1 month</p>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-2">
            <span className="text-5xl font-bold text-gray-950">$15</span>
            <span className="pb-2 text-sm font-semibold text-gray-500">per month</span>
          </div>

          <ul className="mt-6 space-y-3">
            {premiumBenefits.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-sm leading-6 text-gray-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {benefit}
              </li>
            ))}
          </ul>

          <Link
            href="/guidance"
            className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-600 px-5 font-semibold text-white transition hover:bg-emerald-700"
          >
            Upgrade from Guidance
          </Link>
        </article>

        <section className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-950 text-white">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-gray-950">Diet Plan Packages</h2>
                <p className="text-sm text-gray-600">Buy the health goal and duration you want to generate.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {dietPlanPackages.map((plan) => (
              <article
                key={plan.title}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-bold text-gray-950">{plan.title}</h3>
                <p className="mt-3 text-3xl font-bold text-emerald-700">{plan.price}</p>
                <p className="mt-3 text-sm leading-6 text-gray-600">{plan.detail}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 font-semibold text-emerald-800">
                <Bot className="h-4 w-4" />
                AI guidance
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Free users get 2 AI questions. Premium users can ask unlimited questions during the active month.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 font-semibold text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                Rule-based plans
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Plans use Tayibat backend rules and only unlock the selected health goal and duration.
              </p>
            </div>
          </div>

          <Link
            href="/guidance"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-emerald-600 px-5 font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
          >
            Choose a Goal
          </Link>
        </section>
      </section>
    </main>
  );
}
