import Link from "next/link";
import type { Metadata } from "next";
import { Bot, CalendarDays, HeartPulse, Leaf, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Nutrition Guidance and Diet Plans",
  description:
    "Use Tayibat to choose a health goal, view allowed and avoid foods, ask AI nutrition questions, and generate personalized diet plans.",
  alternates: {
    canonical: "/",
  },
};

const features = [
  {
    title: "Tayibat Rule Guidance",
    desc: "Food answers are based on Tayibat's condition-specific allowed, moderate, and avoid rules.",
    icon: ShieldCheck,
  },
  {
    title: "AI Food Assistant",
    desc: "Ask about foods and receive structured guidance connected to your selected health goal.",
    icon: Bot,
  },
  {
    title: "Paid Diet Plans",
    desc: "Generate meal plans from your allowed and moderate foods after buying the selected package.",
    icon: CalendarDays,
  },
];

const guidanceSteps = [
  "Choose your health goal.",
  "Review allowed, moderate, and avoid foods.",
  "Ask the AI assistant about specific foods.",
  "Buy and generate the diet plan package you need.",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-emerald-100 bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              AI Nutrition and Healthy Living Platform
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-6xl">
              Make Food Choices With More Confidence
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-700">
              Tayibat helps users explore food rules, ask AI-supported nutrition questions, and generate diet plans based on selected health goals.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/guidance"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-emerald-600 px-6 font-semibold text-white transition hover:bg-emerald-700"
              >
                Open Guidance
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-emerald-600 px-6 font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                View Pricing
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-emerald-100 pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <HeartPulse className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-950">How Tayibat Works</h2>
                <p className="text-sm text-gray-600">A focused flow for food guidance and plans.</p>
              </div>
            </div>

            <ol className="mt-5 space-y-3">
              {guidanceSteps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map(({ title, desc, icon: Icon }) => (
            <article key={title} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-xl font-bold text-gray-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          <div className="flex gap-3">
            <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <p>
              Tayibat provides nutrition guidance only. It does not diagnose, treat, cure, or replace professional medical care.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
