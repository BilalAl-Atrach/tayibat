import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-red-50 px-4 py-12">
      <section className="w-full max-w-xl rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
          <XCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-bold text-gray-950">Payment cancelled</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Your payment was not completed, so no paid access was added. You can return to Guidance and try again whenever you are ready.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/guidance"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-gray-950 px-5 font-semibold text-white transition hover:bg-gray-800"
          >
            Back to Guidance
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-gray-300 px-5 font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Review Pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
