import Link from "next/link";
import type { ReactNode } from "react";

type LegalDocumentProps = {
  title: string;
  effectiveDate: string;
  children: ReactNode;
  otherLink: { href: string; label: string };
};

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-blue-900">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-gray-800">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export default function LegalDocument({
  title,
  effectiveDate,
  children,
  otherLink,
}: LegalDocumentProps) {
  return (
    <article className="mx-auto max-w-3xl py-4 sm:py-8">
      <header className="mb-8 space-y-3 border-b border-gray-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-900/70">
          The Khmer Daily Network
        </p>
        <h1 className="text-3xl font-bold text-blue-900 sm:text-4xl">
          {title}
        </h1>
        <p className="text-sm text-gray-600">
          Effective date: {effectiveDate}
        </p>
        <p className="text-sm text-gray-600">
          Support:{" "}
          <a
            href="mailto:support@thekhmerdailynetwork.com"
            className="font-medium text-blue-900 underline underline-offset-2 hover:text-blue-800"
          >
            support@thekhmerdailynetwork.com
          </a>
        </p>
      </header>

      <div className="space-y-8">{children}</div>

      <footer className="mt-10 border-t border-gray-200 pt-6 text-sm text-gray-600">
        <p>
          Also see our{" "}
          <Link
            href={otherLink.href}
            className="font-medium text-blue-900 underline underline-offset-2 hover:text-blue-800"
          >
            {otherLink.label}
          </Link>
          .
        </p>
      </footer>
    </article>
  );
}
