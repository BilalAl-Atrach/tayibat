import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account",
  description:
    "Manage your Tayibat subscription, diet plan purchases, AI guidance access, and account information.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
