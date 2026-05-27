import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description:
    "Manage Tayibat nutrition rules, users, feedback, subscriptions, payment transactions, and admin content.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
