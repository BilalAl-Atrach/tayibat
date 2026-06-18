import Link from "next/link";
import type { Metadata } from "next";
import {
  Leaf,
  Heart,
  Shield,
  Users,
  Sparkles,
  Salad,
  Zap,
  Download,
  Check,
  MessageCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Tayibat's mission to provide structured, condition-based nutrition guidance and practical diet planning support.",
  alternates: {
    canonical: "/about",
  },
};

const values = [
  {
    title: "Evidence-Based",
    description:
      "Our nutrition guidance is based on structured food rules and practical health recommendations.",
    icon: Shield,
    color: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    title: "Personalized Care",
    description:
      "Every user has different goals, so Tayibat helps create guidance tailored to individual needs.",
    icon: Heart,
    color: "bg-pink-50 text-pink-700 border-pink-100",
  },
  {
    title: "Community Support",
    description:
      "We aim to create a healthier environment where users feel supported in their food journey.",
    icon: Users,
    color: "bg-orange-50 text-orange-700 border-orange-100",
  },
];

const steps = [
  "Choose a health goal from the available conditions.",
  "Explore foods that are allowed, moderate, or should be avoided.",
  "Ask about any food and receive instant guidance.",
  "Generate a personalized diet plan based on your selected goal.",
];

const premiumChecklist = [
  "Full access to every allowed, moderate, and avoid food table",
  "Unlimited AI guidance questions for a full month",
  "No daily limits while your Premium month is active",
];

const dietPlanChecklist = [
  "Your full 1-month meal plan, generated in about 10 seconds",
  "Built from the allowed and moderate foods for your selected goal",
  "Save it as a PDF and keep it on your phone, instructions included",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-green-100">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-green-100 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 shadow-sm">
              <Leaf className="h-8 w-8" />
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-green-700">
              About Tayibat
            </p>

            <h1 className="mt-4 max-w-4xl text-3xl font-extrabold leading-tight text-gray-950 sm:text-5xl">
              Smart nutrition guidance built for healthier everyday choices
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-700">
              Tayibat helps users understand food choices through personalized
              dietary guidance, food recommendations, and intelligent meal
              planning.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600">
              Tayibat is inspired by the teachings of Dr. Diyaa Al Awadi on
              practical, food-first approaches to wellness — translated here
              into structured, everyday guidance you can actually follow.
            </p>

            <div className="mt-10 grid w-full gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
              <Link
                href="/guidance"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-green-700"
              >
                Start Guidance
              </Link>

              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:border-green-300 hover:text-green-700"
              >
                Back Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
              <Sparkles className="h-4 w-4" />
              Our Mission
            </div>

            <h2 className="mt-5 text-3xl font-bold text-gray-950">
              Helping people build better eating habits with confidence
            </h2>


            <p className="mt-4 text-lg leading-8 text-gray-700">
              Whether you are trying to manage a condition, improve wellness, or
              simply understand your meals better, our platform provides a clear
              and supportive experience.
            </p>
          </div>

          <div className="rounded-lg border border-green-100 bg-gradient-to-br from-green-100 to-emerald-50 p-5 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-green-700 shadow-sm">
                <Salad className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Personalized Nutrition
                </h3>
                <p className="text-sm text-gray-600">
                  Guidance adapted to user goals
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {[
                "Food recommendations",
                "Health-condition guidance",
                "Interactive AI agent support",
                "Diet plan generation",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="font-medium text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value / Pricing Anchor Section */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
            <Zap className="h-4 w-4" />
            Why $15 Goes a Long Way
          </div>

          <h2 className="mt-5 text-3xl font-bold text-gray-950">
            Two different ways to get $15 of real value
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-700">
            Premium access and a diet plan package are two separate things,
            each priced at $15, each solving a different need.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Premium Access Card */}
          <div className="rounded-lg border border-green-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700 shadow-sm">
                <MessageCircle className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Premium Access
                </h3>
                <p className="text-sm text-gray-600">
                  $15 for a full month
                </p>
              </div>
            </div>

            <p className="mt-5 text-base leading-7 text-gray-700">
              Less than the cost of a single nutritionist visit, and
              available the moment you have a question, day or night.
            </p>

            <div className="mt-6 space-y-3">
              {premiumChecklist.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl bg-green-50/60 p-4"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span className="text-sm font-medium leading-6 text-gray-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Diet Plan Package Card */}
          <div className="rounded-lg border border-green-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700 shadow-sm">
                <Download className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  1-Month Diet Plan
                </h3>
                <p className="text-sm text-gray-600">
                  $15, generated in about 10 seconds
                </p>
              </div>
            </div>

            <p className="mt-5 text-base leading-7 text-gray-700">
              No subscription, no waiting. Pick your goal, pay once, and get
              a ready-to-follow plan in seconds.
            </p>

            <div className="mt-6 space-y-3">
              {dietPlanChecklist.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl bg-green-50/60 p-4"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span className="text-sm font-medium leading-6 text-gray-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/pricing"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-green-700"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Our Values
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-950">
              What drives our platform
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className={`rounded-lg border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6 ${value.color}`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  <value.icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  {value.title}
                </h3>

                <p className="mt-3 leading-7">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
            How It Works
          </p>

          <h2 className="mt-3 text-3xl font-bold text-gray-950">
            A simple nutrition guidance experience
          </h2>
        </div>

        <div className="mt-12 space-y-6">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:gap-5 sm:p-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-lg font-bold text-white">
                {index + 1}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Step {index + 1}
                </h3>

                <p className="mt-1 leading-7 text-gray-700">
                  {step}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-5xl rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center text-white shadow-lg sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Start improving your nutrition today
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-green-50">
            Explore food recommendations, generate meal plans, and receive
            personalized dietary guidance with Tayibat.
          </p>

          <Link
            href="/guidance"
            className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-green-700 transition hover:bg-green-50"
          >
            Explore Guidance
          </Link>
        </div>
      </section>
    </div>
  );
}