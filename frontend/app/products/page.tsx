import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Tayibat products are coming soon. Check back for nutrition-focused products and healthy living resources.",
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-green-100 bg-green-50">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-md bg-white text-green-700 shadow-sm">
            <ShoppingBag className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-green-700">
            Tayibat Market
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950 sm:text-5xl">
            Coming soon...
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-600">
            Products and ordering are currently being prepared.
          </p>
        </div>
      </section>
    </main>
  );
}
