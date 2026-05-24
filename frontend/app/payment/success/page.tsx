import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-4 py-12">
      <section className="w-full max-w-xl rounded-lg border border-emerald-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-bold text-gray-950">Payment successful</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Your payment was completed. If Whish has confirmed the payment callback, your Tayibat access is now active.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/guidance"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-5 font-semibold text-white transition hover:bg-emerald-700"
          >
            Go to Guidance
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-600 px-5 font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            View Pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
