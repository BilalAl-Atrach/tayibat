export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6">
      <article className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Trust & Safety</p>
        <h1 className="mt-3 text-4xl font-bold text-gray-950">Privacy Policy</h1>
        <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
          <p>
            Tayibat collects account information, selected health goals, guidance feedback, payment
            transaction records, and usage information needed to provide the service.
          </p>
          <p>
            Payment details are handled through the payment provider. Tayibat stores transaction
            status, references, package type, and access records, but do not store card or wallet
            credentials.
          </p>
          <p>
            AI questions may be processed to generate guidance based on Tayibat rules. Do not
            submit sensitive medical documents or private information that is not needed for food
            guidance.
          </p>
          <p>
            Admins may review user accounts, feedback, access status, and payment records to operate
            support, billing, and safety functions.
          </p>
        </div>
      </article>
    </main>
  );
}
