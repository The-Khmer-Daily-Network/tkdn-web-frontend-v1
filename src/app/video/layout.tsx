"use client";
import HeaderSponsor from "@/features/sponsor/headerSponsor";
import HeaderSidebar from "@/features/userFeature/headerSidebar";
import RightsideSponsor from "@/features/sponsor/rightsideSponsor";
import FooterFeature from "@/features/userFeature/footerFeature";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <HeaderSidebar topOffset={0} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full">{children}</div>
        </div>
      </div>
      <FooterFeature />
    </div>
  );
}
