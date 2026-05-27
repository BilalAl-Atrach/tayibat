import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Disclaimer",
  description:
    "Read Tayibat's medical disclaimer. Tayibat provides food guidance only and does not replace professional medical care.",
  alternates: {
    canonical: "/medical-disclaimer",
  },
};

export default function MedicalDisclaimerPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6">
      <article className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Trust & Safety</p>
        <h1 className="mt-3 text-4xl font-bold text-gray-950">Medical Disclaimer</h1>
        <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
          <p>
            Tayibat provides general nutrition and food guidance based on the rules of the
            Tayibat system. It is not a medical device and does not provide diagnosis, treatment,
            cure, or emergency advice.
          </p>
          <p>
            Guidance for diabetes, cancer nutrition support, high cholesterol or digestive health is better to be reviewed with a qualified doctor, dietitian, or licensed
            health professional. 
          </p>
          <p>
            If you have severe symptoms, allergic reactions, sudden weight loss, uncontrolled blood
            sugar, chest pain, dehydration, or any urgent concern, seek medical care immediately.
          </p>
          <p>
            Diet plans and AI responses depend on the quality and completeness of tayibat food rules.
            Always use personal judgment and professional advice for medical decisions.
          </p>
        </div>
      </article>
    </main>
  );
}
