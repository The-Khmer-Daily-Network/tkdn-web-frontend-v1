"use client";

import NewsDashboard from "@/features/userFeature/newsDashboard";
import NationalFeature from "@/features/userFeature/nationalFeature";
import InternationalFeature from "@/features/userFeature/internationalFeature";
import VideoFeature from "@/features/userFeature/videoFeature";
import BannerSponsor from "@/features/sponsor/bannerSponsor";
import { useAdvertisement } from "@/contexts/AdvertisementContext";
import WelcomePopup from "@/components/WelcomePopup";

export default function HomePageContent() {
  const { images: adImages, loading: adLoading } = useAdvertisement();

  return (
    <>
      <div className="space-y-12">
        <WelcomePopup />
        <NewsDashboard />
        <NationalFeature />
        <BannerSponsor images={adImages} loading={adLoading} />

        <InternationalFeature />
        <BannerSponsor images={adImages} loading={adLoading} />

        <VideoFeature />
        <BannerSponsor images={adImages} loading={adLoading} />
      </div>
    </>
  );
}
