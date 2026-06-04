"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CalendarDays,
  HeartPulse,
  Leaf,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

/* ─── Floating orb component ─── */
function Orb({
  size,
  color,
  style,
}: {
  size: number;
  color: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      className="pointer-events-none absolute rounded-full blur-3xl"
      style={{ width: size, height: size, background: color, ...style }}
    />
  );
}

/* ─── Reveal wrapper ─── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Marquee strip ─── */
const foods = [
  "🥑 Avocado",
  "🫐 Blueberries",
  "🥦 Broccoli",
  "🍋 Lemon",
  "🥗 Leafy Greens",
  "🫚 Olive Oil",
  "🐟 Salmon",
  "🥜 Almonds",
  "🍠 Sweet Potato",
  "🫑 Bell Pepper",
  "🥝 Kiwi",
  "🌿 Herbs",
];

function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-emerald-200/40 bg-emerald-950/5 py-3">
      <div className="marquee-track flex gap-10 whitespace-nowrap">
        {[...foods, ...foods, ...foods].map((f, i) => (
          <span
            key={i}
            className="font-semibold tracking-wide text-emerald-800/70 text-sm"
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Feature card ─── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  href,
  accent,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  href: string;
  accent: string;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={delay}>
      <Link
        href={href}
        aria-label={`Learn more about ${title}`}
        className="group relative block overflow-hidden rounded-2xl border border-white/60 bg-white p-7 shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-4"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* animated bg blob */}
        <div
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl transition-all duration-700"
          style={{
            background: accent,
            opacity: hovered ? 0.25 : 0.1,
            transform: hovered ? "scale(1.5)" : "scale(1)",
          }}
        />
        <div
          className="mb-5 inline-flex h-13 w-13 items-center justify-center rounded-xl p-3"
          style={{ background: accent + "22" }}
        >
          <Icon
            className="h-6 w-6"
            style={{ color: accent.replace("22", "") }}
          />
        </div>
        <h3 className="mb-3 text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-sm leading-7 text-gray-500">{desc}</p>
        <div
          className="mt-5 flex items-center gap-1 text-sm font-semibold transition-all duration-300"
          style={{ color: accent, opacity: hovered ? 1 : 0.5 }}
        >
          Learn more <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </Link>
    </Reveal>
  );
}

/* ─── Step row ─── */
function Step({
  n,
  text,
  delay,
}: {
  n: number;
  text: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="flex items-start gap-4 rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white shadow-md shadow-emerald-200">
          {n}
        </div>
        <p className="pt-1 text-sm leading-6 text-gray-700 font-medium">{text}</p>
      </div>
    </Reveal>
  );
}

const features = [
  {
    icon: ShieldCheck,
    title: "Tayibat Rule Guidance",
    desc: "Food answers are grounded in condition-specific allowed, moderate, and avoid rules — no generic advice.",
    href: "/guidance",
    accent: "#059669",
  },
  {
    icon: Bot,
    title: "AI Food Assistant",
    desc: "Ask about any food and receive structured, goal-aware guidance connected to your personal health objective.",
    href: "/chat",
    accent: "#0284c7",
  },
  {
    icon: CalendarDays,
    title: "Personalized Diet Plans",
    desc: "Generate full meal plans from your allowed and moderate foods once you unlock your preferred package.",
    href: "/pricing",
    accent: "#d97706",
  },
];

export default function Home() {
  /* parallax hero bg */
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const { innerWidth: w, innerHeight: h } = window;
      const dx = (e.clientX / w - 0.5) * 20;
      const dy = (e.clientY / h - 0.5) * 20;
      heroRef.current.style.transform = `translate(${dx}px,${dy}px)`;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');

        * { font-family: 'DM Sans', sans-serif; }
        h1, h2 { font-family: 'Playfair Display', serif; }

        @keyframes float {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-18px) rotate(3deg); }
          66% { transform: translateY(-9px) rotate(-2deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(-24px) rotate(-4deg) scale(1.05); }
        }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scalePop {
          0% { transform: scale(0.7); opacity: 0; }
          80% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes waveX {
          0%,100% { clip-path: ellipse(55% 45% at 50% 50%); }
          50% { clip-path: ellipse(45% 55% at 50% 50%); }
        }

        .float-a { animation: float 7s ease-in-out infinite; }
        .float-b { animation: floatB 9s ease-in-out infinite; }
        .float-c { animation: float 11s ease-in-out infinite 1.5s; }
        .spin-slow { animation: spin-slow 30s linear infinite; }
        .marquee-track { animation: marquee 30s linear infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #065f46, #34d399, #059669, #065f46);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .pulse-ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 2px solid rgba(5,150,105,0.4);
          animation: pulse-ring 2.5s ease-out infinite;
        }
        .hero-appear { animation: fadeSlideIn 0.9s ease both; }
        .hero-appear-2 { animation: fadeSlideIn 0.9s ease 0.18s both; }
        .hero-appear-3 { animation: fadeSlideIn 0.9s ease 0.36s both; }
        .hero-appear-4 { animation: fadeSlideIn 0.9s ease 0.54s both; }
        .card-appear { animation: scalePop 0.6s ease both; }
        .blob { animation: waveX 8s ease-in-out infinite; }

        .grain::before {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0;
        }
      `}</style>

      <div className="min-h-screen overflow-hidden bg-[#f9fdf9]">

        {/* ── HERO ── */}
        <section className="grain relative min-h-screen overflow-hidden bg-gradient-to-br from-[#ecfdf5] via-[#f0fdf4] to-[#fefce8]">

          {/* ambient orbs */}
          <div ref={heroRef} className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform">
            <Orb size={560} color="rgba(52,211,153,0.18)" style={{ top: "-100px", left: "-150px" }} />
            <Orb size={400} color="rgba(251,191,36,0.14)" style={{ bottom: "50px", right: "-80px" }} />
            <Orb size={300} color="rgba(16,185,129,0.1)" style={{ top: "40%", left: "45%" }} />
          </div>

          {/* decorative spinning ring */}
          <div className="pointer-events-none absolute right-[8%] top-[12%] h-72 w-72 opacity-20 spin-slow">
            <svg viewBox="0 0 288 288" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="144" cy="144" r="140" stroke="#059669" strokeWidth="1.5" strokeDasharray="6 10" />
              <circle cx="144" cy="144" r="110" stroke="#34d399" strokeWidth="1" strokeDasharray="4 14" />
            </svg>
          </div>

          {/* floating leaf shapes */}
          <div className="pointer-events-none absolute left-[12%] top-[18%] float-a text-6xl opacity-30">🌿</div>
          <div className="pointer-events-none absolute right-[18%] top-[25%] float-b text-5xl opacity-25">🥑</div>
          <div className="pointer-events-none absolute left-[5%] bottom-[22%] float-c text-5xl opacity-20">🫐</div>
          <div className="pointer-events-none absolute right-[8%] bottom-[30%] float-a text-4xl opacity-20" style={{ animationDelay: "3s" }}>🍋</div>
          <div className="pointer-events-none absolute left-[38%] bottom-[15%] float-b text-4xl opacity-15" style={{ animationDelay: "5s" }}>🌱</div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-16 lg:pt-32">
            <div className="grid gap-14 lg:grid-cols-2 lg:items-center">

              {/* LEFT */}
              <div>
                <div className="hero-appear inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/70 px-5 py-2 text-sm font-semibold text-emerald-700 shadow-sm backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  AI Nutrition &amp; Healthy Living Platform
                </div>

                <h1 className="hero-appear-2 mt-7 text-5xl font-black leading-[1.1] tracking-tight text-gray-950 lg:text-6xl xl:text-7xl">
                  Eat with{" "}
                  <span className="shimmer-text">Wisdom,</span>
                  <br /> Live with{" "}
                  <span className="italic">Purpose.</span>
                </h1>

                <p className="hero-appear-3 mt-6 max-w-lg text-lg leading-8 text-gray-600">
                  Tayibat maps your health goals to real food rules, answers your nutrition questions with AI, and builds personalized diet plans tailored to you.
                </p>

                <div className="hero-appear-4 mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/guidance"
                    className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-emerald-600 px-8 py-4 font-bold text-white shadow-lg shadow-emerald-200 transition-all duration-300 hover:bg-emerald-700 hover:shadow-emerald-300 hover:scale-105"
                  >
                    <span>Open Guidance</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    <div className="absolute inset-0 -translate-x-full skew-x-12 bg-white/10 transition-transform duration-500 group-hover:translate-x-full" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2.5 rounded-full border-2 border-emerald-600 px-8 py-4 font-bold text-emerald-700 transition-all duration-300 hover:bg-emerald-50 hover:scale-105"
                  >
                    View Pricing
                  </Link>
                </div>

                {/* trust pills */}
                <div className="hero-appear-4 mt-8 flex flex-wrap gap-3">
                  {["Guidance for healthy food", "Tayibat-based rules", "AI-powered"].map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-sm backdrop-blur-sm border border-gray-100">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* RIGHT – How it works card */}
              <div className="card-appear" style={{ animationDelay: "0.4s" }}>
                <div className="relative rounded-3xl border border-white/80 bg-white/70 p-7 shadow-2xl shadow-emerald-100 backdrop-blur-xl">
                  {/* top accent bar */}
                  <div className="absolute left-0 right-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400" />

                  <div className="flex items-center gap-3 pb-5">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200">
                      <HeartPulse className="h-6 w-6 text-white" />
                      <div className="pulse-ring" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-950">How Tayibat Works</h2>
                      <p className="text-xs text-gray-500">Four steps to better eating</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      "Choose your health goal.",
                      "Review allowed, moderate, and avoid foods.",
                      "Ask the AI assistant about specific foods.",
                      "Buy and generate the diet plan package you need.",
                    ].map((step, i) => (
                      <Step key={step} n={i + 1} text={step} delay={600 + i * 120} />
                    ))}
                  </div>

                  {/* decorative dots */}
                  <div className="absolute -right-3 -bottom-3 grid grid-cols-4 gap-1.5 opacity-30">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* wave bottom */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none">
              <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="#f9fdf9" />
            </svg>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <Marquee />

        {/* ── FEATURES ── */}
        <section className="relative mx-auto max-w-7xl px-6 py-24">
          <Reveal>
            <div className="mb-14 text-center">
              <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700">
                Platform Features
              </span>
              <h2 className="mt-4 text-4xl font-black text-gray-950 lg:text-5xl">
                Everything you need to eat well
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
                Three powerful pillars, working together to guide your nutrition journey.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 120} />
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="relative mx-6 mb-20 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-8 py-16 text-center shadow-2xl shadow-emerald-200 lg:mx-auto lg:max-w-5xl">
          <Orb size={350} color="rgba(255,255,255,0.1)" style={{ top: "-80px", left: "-60px" }} />
          <Orb size={250} color="rgba(251,191,36,0.15)" style={{ bottom: "-60px", right: "-40px" }} />

          {/* grid texture overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          <Reveal>
            <div className="relative z-10">
              <Leaf className="mx-auto mb-4 h-10 w-10 text-emerald-200 float-b" />
              <h2 className="text-3xl font-black text-white lg:text-5xl">
                Start your food journey today
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base text-emerald-100">
                Join thousands who use Tayibat to make smarter, healthier food decisions every day.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/guidance"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-emerald-700 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

              </div>
            </div>
          </Reveal>
        </section>

        {/* ── DISCLAIMER ── */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <Reveal>
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p>
                <strong>Disclaimer:</strong> Tayibat provides nutrition guidance only. It does not diagnose, treat, cure, or replace professional medical care.
              </p>
            </div>
          </Reveal>
        </section>

      </div>
    </>
  );
}
