"use client";

import { useEffect, useState } from "react";
import NewsDashboard from "@/features/userFeature/newsDashboard";
import NationalFeature from "@/features/userFeature/nationalFeature";
import InternationalFeature from "@/features/userFeature/internationalFeature";
import VideoFeature from "@/features/userFeature/videoFeature";
import HomeCategorySection from "@/features/userFeature/homeCategorySection";
import BannerSponsor from "@/features/sponsor/bannerSponsor";
import { useAdvertisement } from "@/contexts/AdvertisementContext";
import WelcomePopup from "@/components/WelcomePopup";
import { getHomeNews } from "@/services/news";
import type { HomeNewsSections } from "@/types/news";

const EMPTY_HOME_SECTIONS: HomeNewsSections = {
  latest: [],
  international: [],
  national: [],
  video: [],
  technology: [],
  bussiness: [],
  sports: [],
  lifestyle: [],
};

export default function HomePageContent() {
  const { images: adImages, loading: adLoading } = useAdvertisement();
  const [homeSections, setHomeSections] = useState<HomeNewsSections>(EMPTY_HOME_SECTIONS);
  const [homeLoading, setHomeLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeNews() {
      try {
        setHomeLoading(true);
        const response = await getHomeNews();
        if (cancelled) return;

        const data = response?.data;
        setHomeSections({
          latest: Array.isArray(data?.latest) ? data.latest : [],
          international: Array.isArray(data?.international) ? data.international : [],
          national: Array.isArray(data?.national) ? data.national : [],
          video: Array.isArray(data?.video) ? data.video : [],
          technology: Array.isArray(data?.technology) ? data.technology : [],
          bussiness: Array.isArray(data?.bussiness) ? data.bussiness : [],
          sports: Array.isArray(data?.sports) ? data.sports : [],
          lifestyle: Array.isArray(data?.lifestyle) ? data.lifestyle : [],
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load home news:", error);
          setHomeSections(EMPTY_HOME_SECTIONS);
        }
      } finally {
        if (!cancelled) setHomeLoading(false);
      }
    }

    loadHomeNews();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="space-y-12">
        <WelcomePopup />
        <NewsDashboard allNews={homeSections.latest} loading={homeLoading} disableFetch />
        <NationalFeature
          allNews={homeSections.national}
          loading={homeLoading}
          disableFetch
        />
        <BannerSponsor images={adImages} loading={adLoading} />

        <InternationalFeature
          allNews={homeSections.international}
          loading={homeLoading}
          disableFetch
        />
        <BannerSponsor images={adImages} loading={adLoading} />

        <VideoFeature allNews={homeSections.video} loading={homeLoading} disableFetch />
        <BannerSponsor images={adImages} loading={adLoading} />

        <HomeCategorySection
          title="Technology News"
          articles={homeSections.technology}
          loading={homeLoading}
        />

        <HomeCategorySection
          title="Business News"
          articles={homeSections.bussiness}
          loading={homeLoading}
        />

        <BannerSponsor images={adImages} loading={adLoading} />

        <HomeCategorySection title="Sports News" articles={homeSections.sports} loading={homeLoading} />

        <HomeCategorySection
          title="Lifestyle News"
          articles={homeSections.lifestyle}
          loading={homeLoading}
        />
      </div>
    </>
  );
}
