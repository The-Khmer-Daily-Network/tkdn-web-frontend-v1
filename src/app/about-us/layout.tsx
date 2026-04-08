"use client";
import HeaderSponsor from "@/features/sponsor/headerSponsor";
import HeaderSidebar from "@/features/userFeature/headerSidebar";
import FooterFeature from "@/features/userFeature/footerFeature";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <HeaderSidebar topOffset={0} />
      <div className="max-w-8xl mx-auto px-4 mt-[-100px]">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full">{children}</div>
        </div>
      </div>
      <FooterFeature />
    </div>
  );
}
