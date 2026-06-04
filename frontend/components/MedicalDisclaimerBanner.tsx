import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function MedicalDisclaimerBanner() {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
      <div className="flex gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <p>
          Tayibat provides food guidance only.{" "}
          <Link href="/medical-disclaimer" className="font-semibold underline">
            Read the medical disclaimer
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
