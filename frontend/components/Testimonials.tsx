"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Testimonial {
  id: number;
  name: string;
  quote: string;
  image?: string | null;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const { data } = await api.get<Testimonial[]>("/testimonials");
        setTestimonials(data);
      } catch {
        setError("Testimonials are unavailable right now.");
      } finally {
        setLoading(false);
      }
    }

    loadTestimonials();
  }, []);

  return (
    <section className="mt-12 w-full max-w-5xl px-0 sm:mt-20">
      <h2 className="mb-8 text-center text-2xl font-bold text-green-700 sm:mb-10 sm:text-3xl">
        What Our Community Says
      </h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading testimonials...</p>
      ) : error ? (
        <p className="text-center text-sm text-gray-500">{error}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 md:gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="rounded-lg bg-white p-5 shadow-lg transition hover:scale-[1.02] sm:p-6"
            >
              <p className="italic text-gray-600">&quot;{testimonial.quote}&quot;</p>
              <h4 className="mt-4 font-semibold text-green-700">- {testimonial.name}</h4>
              {testimonial.image && (
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={48}
                  height={48}
                  unoptimized
                  className="mt-4 h-12 w-12 rounded-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
