import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, Check, Crown, Star } from "lucide-react";
import MedicalDisclaimerBanner from "@/components/MedicalDisclaimerBanner";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Affordable Tayibat Premium access and diet plan packages — less than the cost of a single nutritionist visit.",
  alternates: {
    canonical: "/pricing",
  },
};

const dietPlanPackages = [
  {
    title: "Starter Plan (1 Week)",
    price: "$9",
    detail: "Kickstart your health journey with a 7‑day structured plan. Less than the price of a single lunch out.",
    badge: "",
  },
  {
    title: "Balanced Plan (1 Month)",
    price: "$15",
    detail: "A full 30‑day rotation across meals and days. Available day or night, whenever you need guidance.",
    badge: "Recommended",
  },
  {
    title: "Transformation Plan (3 Months)",
    price: "$30",
    detail: "90‑day structure for lasting change and broader meal variety. Incredible value for long‑term results.",
    badge: "",
  },
];

const premiumBenefits = [
  "Unlimited AI guidance questions for 1 month",
  "Full access to all food guidance tables",
  "No limits interrupting your guidance flow",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="border-b border-emerald-100 bg-emerald-50/50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Tayibat Pricing
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
            Affordable health guidance for everyone
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-700">
            Less than the cost of a single nutritionist visit. Choose Premium access or a diet plan package designed to fit your goals and budget.
          </p>
        </div>
      </section>

      {/* Premium + Why Tayibat side by side */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 grid gap-6 lg:grid-cols-2 items-stretch">
        <div className="flex flex-col h-full">
          <MedicalDisclaimerBanner />

          <article className="mt-6 flex flex-col justify-between rounded-lg border-2 border-emerald-500 bg-white p-6 shadow-md hover:shadow-lg transition h-full">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                  <Crown className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-950">Premium Access</h2>
                  <p className="text-sm font-medium text-emerald-700">Unlimited AI + Food Tables</p>
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
            </div>

            <Link
              href="/guidance"
              className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-600 px-5 font-semibold text-white transition hover:bg-emerald-700"
            >
              Unlock Premium Now
            </Link>
          </article>
        </div>

        {/* Why Tayibat beside Premium, same height */}
       <div className="rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-8 h-full flex flex-col justify-center shadow-sm">
  <h2 className="text-3xl font-bold text-gray-950">
    Why Choose Tayibat?
  </h2>


  <div className="mt-8 grid gap-5">
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
        ✓
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">
          Less than one nutritionist visit
        </h3>
        <p className="text-sm text-gray-600">
          Premium access costs less than many single consultations while remaining available all month.
        </p>
      </div>
    </div>

<div className="flex gap-4">
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
    ✓
  </div>
  <div>
    <h3 className="font-semibold text-gray-900">
      Available day or night
    </h3>
    <p className="text-sm text-gray-600">
      Ask questions whenever they come up instead of waiting for your next appointment.
    </p>
  </div>
</div>

<div className="flex gap-4">
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
    ✓
  </div>
  <div>
    <h3 className="font-semibold text-gray-900">
      Goal-focused recommendations
    </h3>
    <p className="text-sm text-gray-600">
      Whether your goal is weight loss, blood sugar management, or healthier eating habits, Tayibat helps you stay on track.
    </p>
  </div>
</div>

<div className="flex gap-4">
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
    ✓
  </div>
  <div>
    <h3 className="font-semibold text-gray-900">
      Trusted food guidance
    </h3>
    <p className="text-sm text-gray-600">
      Built around Tayibat's food guidance system to help you make better daily choices with confidence.
    </p>
  </div>
</div>

  </div>
</div>

      </section>

      {/* Diet Plans Full Width */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm w-full">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-950 text-white">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-gray-950">Diet Plan Packages</h2>
              <p className="text-sm text-gray-600">Choose the health goal and duration that fits your lifestyle.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {dietPlanPackages.map((plan) => (
            <article
              key={plan.title}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm relative w-full"
            >
              {plan.badge && (
                <span className="absolute top-0 right-0 inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <Star className="mr-1 h-3 w-3" /> {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-bold text-gray-950">{plan.title}</h3>
              <p className="mt-3 text-3xl font-bold text-emerald-700">{plan.price}</p>
              <p className="mt-3 text-sm leading-6 text-gray-600">{plan.detail}</p>
            </article>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <Link
            href="/guidance"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-600 px-8 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </main>
  );
}
