import type { Metadata } from "next";
import GuidanceExperience from "@/components/GuidanceExperience";

export const metadata: Metadata = {
  title: "AI Nutrition Chat",
  description:
    "Ask Tayibat's AI nutrition guide about foods and receive structured answers connected to your selected health goal.",
  alternates: {
    canonical: "/guidance",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ChatPage() {
  return <GuidanceExperience />;
}
