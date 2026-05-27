import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Successful",
  description:
    "Your Tayibat payment was successful. Return to your account or guidance page to use your purchased access.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
