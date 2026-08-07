"use client";

import HeaderSidebar from "@/features/userFeature/headerSidebar";
import FooterFeature from "@/features/userFeature/footerFeature";

export default function TermsOfUseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <HeaderSidebar topOffset={0} />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full">{children}</div>
        </div>
      </div>
      <FooterFeature />
    </div>
  );
}
