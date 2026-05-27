import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Cancelled",
  description:
    "Your Tayibat payment was cancelled. You can return to pricing or your account to try again.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentCancelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
