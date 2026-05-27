import type { Metadata } from "next";
import GuidanceExperience from "@/components/GuidanceExperience";

export const metadata: Metadata = {
  title: "Guidance",
  description:
    "Choose your health goal, review allowed and avoid foods, ask the Tayibat AI guide, and generate diet plans based on your selected condition.",
  alternates: {
    canonical: "/guidance",
  },
};

export default function GuidancePage() {
  return <GuidanceExperience />;
}
