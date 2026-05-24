"use client";

import axios from "axios";
import { CheckCircle2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";

const getApiMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
    if (!error.response) {
      return "We cannot reach the backend right now. Check that Laravel is running and try again.";
    }

    const validationMessage = error.response.data?.errors
      ? Object.values(error.response.data.errors).flat()[0]
      : "";

    return validationMessage || error.response.data?.message || fallback;
  }

  return fallback;
};

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error">("success");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!notice || noticeType !== "success") return;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [notice, noticeType]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");

    try {
      const { data } = await api.post<{ message?: string }>("/contact-messages", formData);

      setNoticeType("success");
      setNotice(data.message || "Your message was sent successfully.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      setNoticeType("error");
      setNotice(getApiMessage(error, "Unable to send your message right now."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
            Contact Us
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-gray-950 sm:text-4xl">
            Ask for support with your diet guidance
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-700">
            Send a question to the Tayibat team about food rules, products, or
            your generated diet plan.
          </p>
          <div className="mt-8 rounded-lg border border-green-100 bg-green-50 p-5 text-sm text-gray-700">
            <p className="font-semibold text-green-800">Email</p>
            <p className="mt-1">support@tayibat.local</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-green-100 bg-white p-4 shadow-sm sm:p-6"
        >
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-gray-700">
              Name
              <input
                required
                name="name"
                value={formData.name}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, name: event.target.value }))
                }
                className="min-h-11 rounded-md border border-gray-300 px-3 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-gray-700">
              Email
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, email: event.target.value }))
                }
                className="min-h-11 rounded-md border border-gray-300 px-3 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-gray-700">
              Message
              <textarea
                required
                name="message"
                rows={6}
                value={formData.message}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, message: event.target.value }))
                }
                className="rounded-md border border-gray-300 px-3 py-3 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-11 rounded-md bg-green-600 px-5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
            {notice && noticeType === "error" && (
              <p
                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {notice}
              </p>
            )}
          </div>
        </form>
      </div>

      {notice && noticeType === "success" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-lg border border-green-200 bg-white p-5 text-center shadow-xl">
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Close confirmation"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-950">Message sent</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{notice}</p>
          </div>
        </div>
      )}
    </div>
  );
}
