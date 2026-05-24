import Link from "next/link";

const links = [
  { href: "/medical-disclaimer", label: "Medical Disclaimer" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/refund-policy", label: "Refund Policy" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-gray-600 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>
          Tayibat provides nutrition guidance and does not replace professional medical advice.
        </p>
        <nav className="flex flex-wrap gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="font-medium hover:text-green-700">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
