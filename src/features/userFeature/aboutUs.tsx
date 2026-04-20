"use client";

import { useState, useEffect, useRef } from "react";
import { Globe, FileText, User, BookOpen, Handshake } from "lucide-react";
import { getNewsroomTeam } from "@/services/newsroomTeam";
import { getPartnerLogos } from "@/services/partnerLogo";
import {
  getStatistics,
  type Statistics as StatisticsType,
} from "@/services/statistics";
import type { NewsroomTeam } from "@/types/newsroomTeam";
import type { PartnerLogoImage } from "@/types/partnerLogo";
import Image from "next/image";
import TKDNTeamImage from "@/assets/tkdnTeam/TKDNteams.jpg";
import TKDNLogo from "@/assets/TKDN_Logo/TKDN_Logo_NoneBack.png";
import TKDNLogobackground from "@/assets/TKDN_Logo/TKDN_Logo_Rectangle.jpg";
// Add animation styles
const animationStyles = `
  @keyframes drawCircle {
    from {
      stroke-dasharray: 0 352;
    }
    to {
      stroke-dasharray: var(--dash-array) 352;
    }
  }
  
  .animate-donut-female {
    animation: drawCircle 2s ease-out forwards;
  }
  
  .animate-donut-male {
    animation: drawCircle 2s ease-out forwards;
    animation-delay: 0.3s;
  }

  @keyframes expandBar {
    from {
      width: 0%;
    }
    to {
      width: var(--bar-width);
    }
  }

  .animate-bar-chart {
    animation: expandBar 1.5s ease-out forwards;
  }

  .animate-bar-articles {
    animation: expandBar 1.5s ease-out forwards;
  }

  .animate-bar-videos {
    animation: expandBar 1.5s ease-out forwards;
    animation-delay: 0.2s;
  }

  .animate-bar-demographic {
    animation: expandBar 1.5s ease-out forwards;
  }
`;

// Inject styles into document
if (
  typeof document !== "undefined" &&
  !document.getElementById("donut-animation-styles")
) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "donut-animation-styles";
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}
export default function AboutUs() {
  const [teamMembers, setTeamMembers] = useState<NewsroomTeam[]>([]);
  const [partners, setPartners] = useState<PartnerLogoImage[]>([]);
  const [statistics, setStatistics] = useState<StatisticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [animateChart, setAnimateChart] = useState(false);
  // Refs for sections
  const overviewRef = useRef<HTMLDivElement>(null);
  const statisticsRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const partnersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Intersection Observer to update active section on scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-10% 0px -10% 0px",
      threshold: 0.3,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute("data-section");
          if (sectionId) {
            setActiveSection(sectionId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    const sections = [
      overviewRef.current,
      statisticsRef.current,
      teamRef.current,
      missionRef.current,
      partnersRef.current,
    ].filter((el): el is HTMLDivElement => el !== null);

    sections.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      sections.forEach((el) => {
        observer.unobserve(el);
      });
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamResponse, partnersResponse, statisticsResponse] =
        await Promise.all([
          getNewsroomTeam(),
          getPartnerLogos(),
          getStatistics(),
        ]);

      // Sort team members by creation date (oldest first = first created = first displayed)
      const sortedTeam = (teamResponse.data || []).sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB; // Sort ascending (oldest = first)
      });

      setTeamMembers(sortedTeam);
      setPartners(partnersResponse.data || []);
      setStatistics(statisticsResponse.data);
      // Trigger animation when stats are loaded
      setAnimateChart(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      overview: overviewRef,
      statistics: statisticsRef,
      team: teamRef,
      mission: missionRef,
      partners: partnersRef,
    };

    const ref = refs[sectionId];
    if (ref?.current) {
      const element = ref.current;
      const rect = element.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const elementTop = rect.top + scrollTop;
      const offset = 20; // Small offset from top

      window.scrollTo({
        top: elementTop - offset,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
  };

  // Calculate statistics from API data
  const monthlyVisitors = statistics?.website || 0;
  const totalPageViews = statistics?.website || 0;

  const totalPublished = statistics
    ? (statistics.articles_published || 0) + (statistics.videos_published || 0)
    : 0;

  const articlesPublished =
    totalPublished > 0 && statistics
      ? Math.round(
          ((statistics.articles_published || 0) / totalPublished) * 100,
        )
      : 0;

  const videosPublished =
    totalPublished > 0 && statistics
      ? Math.round(((statistics.videos_published || 0) / totalPublished) * 100)
      : 0;

  // Get user demographics from statistics
  const userDemographics = statistics?.user_demographic
    ? statistics.user_demographic
        .filter(
          (demo) =>
            demo &&
            (demo.top1 || demo.top2 || demo.top3 || demo.top4 || demo.top5),
        )
        .flatMap((demo, categoryIndex) => {
          const items: { country: string; count: number }[] = [];
          for (let i = 1; i <= 5; i++) {
            const topKey = `top${i}` as keyof typeof demo;
            const percentageKey = `top${i}_percentage` as keyof typeof demo;
            const country = demo[topKey] as string;
            const percentage = (demo[percentageKey] as number) || 0;
            if (country && percentage > 0) {
              items.push({ country, count: percentage });
            }
          }
          return items;
        })
        .slice(0, 5) // Limit to top 5
    : [];

  const maxDemographic =
    userDemographics.length > 0
      ? Math.max(...userDemographics.map((d) => d.count))
      : 100;

  // Get male/female percentages
  const websiteMale = statistics?.website_male || 0;
  const websiteFemale = statistics?.website_female || 0;
  const totalGender = websiteMale + websiteFemale;
  const malePercentage =
    totalGender > 0 ? Math.round((websiteMale / totalGender) * 100) : 0;
  const femalePercentage =
    totalGender > 0 ? Math.round((websiteFemale / totalGender) * 100) : 0;

  return (
    <div className="relative min-h-screen">
      {/* Left Side Navigation Icons */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
        <button
          onClick={() => scrollToSection("overview")}
          className={`w-12 h-12 rounded-full cursor-pointer shadow-lg flex items-center justify-center transition-all ${
            activeSection === "overview"
              ? "bg-[#273C8F] text-white"
              : "bg-white text-[#273C8F] hover:bg-gray-100"
          }`}
          aria-label="Overview"
        >
          <Globe
            className={`w-6 h-6 ${activeSection === "overview" ? "text-white" : "text-[#273C8F]"}`}
          />
        </button>
        <button
          onClick={() => scrollToSection("statistics")}
          className={`w-12 h-12 rounded-full cursor-pointer shadow-lg flex items-center justify-center transition-all ${
            activeSection === "statistics"
              ? "bg-[#273C8F] text-white"
              : "bg-white text-[#273C8F] hover:bg-gray-100"
          }`}
          aria-label="Statistics"
        >
          <FileText
            className={`w-6 h-6 ${activeSection === "statistics" ? "text-white" : "text-[#273C8F]"}`}
          />
        </button>
        <button
          onClick={() => scrollToSection("team")}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all ${
            activeSection === "team"
              ? "bg-[#273C8F] text-white"
              : "bg-white text-[#273C8F] hover:bg-gray-100"
          }`}
          aria-label="Team"
        >
          <User
            className={`w-6 h-6 ${activeSection === "team" ? "text-white" : "text-[#273C8F]"}`}
          />
        </button>
        <button
          onClick={() => scrollToSection("mission")}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all ${
            activeSection === "mission"
              ? "bg-[#273C8F] text-white"
              : "bg-white text-[#273C8F] hover:bg-gray-100"
          }`}
          aria-label="Mission"
        >
          <BookOpen
            className={`w-6 h-6 ${activeSection === "mission" ? "text-white" : "text-[#273C8F]"}`}
          />
        </button>
        <button
          onClick={() => scrollToSection("partners")}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all ${
            activeSection === "partners"
              ? "bg-[#273C8F] text-white"
              : "bg-white text-[#273C8F] hover:bg-gray-100"
          }`}
          aria-label="Partners"
        >
          <Handshake
            className={`w-6 h-6 ${activeSection === "partners" ? "text-white" : "text-[#273C8F]"}`}
          />
        </button>
      </div>

      {/* Hero Section */}
      <section
        ref={overviewRef}
        data-section="overview"
        className="relative w-full h-[800px] max-[1000px]:h-[500px] max-[721px]:h-[300px] max-[349px]:h-[800px] flex items-end justify-center overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            // src="/all_assets/TKDNteams.jpg"
            alt="The Khmer Daily Network Team"
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-[#273C8F]/30 bg-opacity-40"></div>
        </div>
      </section>

      {/* Statistics & Metrics Section */}
      <section
        ref={statisticsRef}
        data-section="statistics"
        className="py-16 px-4 bg-[gray-50]"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-[#273C8F] uppercase text-center mb-12">
            Statistics & Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Visitors Card */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-bold text-[#273C8F] uppercase mb-4">
                Monthly Visitors
              </h3>
              <p className="text-gray-700 dark:text-black mb-4">
                The Khmer Daily Network was established in December 2025 and is
                growing rapidly, reaching over{" "}
                <span className="font-bold text-[#273C8F]">
                  {monthlyVisitors.toLocaleString()} monthly visits
                </span>
                .
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Image
                  src={TKDNLogobackground}
                  alt="The Khmer Daily Network Logo"
                  className="object-contain"
                  width={250}
                  height={120}
                />
              </div>
            </div>

            {/* Total Page Views Card */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-bold text-[#273C8F] uppercase mb-4">
                Total Page Views
              </h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-black mb-4">
                Total Engagements {totalPageViews.toLocaleString()}
              </p>
              {/* Donut Chart */}
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="16"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#E34C33"
                    strokeWidth="16"
                    strokeDasharray={
                      animateChart ? `${femalePercentage * 3.516} 352` : "0 352"
                    }
                    strokeDashoffset="0"
                    className={animateChart ? "animate-donut-female" : ""}
                    style={
                      animateChart
                        ? ({
                            "--dash-array": `${femalePercentage * 3.516}`,
                          } as React.CSSProperties)
                        : {}
                    }
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#273C8F"
                    strokeWidth="16"
                    strokeDasharray={
                      animateChart ? `${malePercentage * 3.516} 352` : "0 352"
                    }
                    strokeDashoffset={
                      animateChart ? `-${femalePercentage * 3.516}` : "0"
                    }
                    className={animateChart ? "animate-donut-male" : ""}
                    style={
                      animateChart
                        ? ({
                            "--dash-array": `${malePercentage * 3.516}`,
                          } as React.CSSProperties)
                        : {}
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-black">
                      Female {femalePercentage}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-black">
                      Male {malePercentage}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Published Card */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-bold text-[#273C8F] uppercase mb-4">
                Published
              </h3>
              <p className="text-xl font-bold text-gray-800 dark:text-black mb-4">
                Total of Published {totalPublished.toLocaleString()}
              </p>
              {/* Bar Chart */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="dark:text-black">Articles Published</span>
                    <span className="dark:text-black">
                      {statistics?.articles_published || 0} Articles (
                      {articlesPublished}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-[#E34C33] h-4 rounded-full animate-bar-articles"
                      style={
                        {
                          width: animateChart ? `${articlesPublished}%` : "0%",
                          "--bar-width": `${articlesPublished}%`,
                        } as React.CSSProperties
                      }
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="dark:text-black">Videos Published</span>
                    <span className="dark:text-black">
                      {statistics?.videos_published || 0} Videos (
                      {videosPublished}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-[#273C8F] h-4 rounded-full animate-bar-videos"
                      style={
                        {
                          width: animateChart ? `${videosPublished}%` : "0%",
                          "--bar-width": `${videosPublished}%`,
                        } as React.CSSProperties
                      }
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Demographic Card */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-bold text-[#273C8F] uppercase mb-4">
                User Demographic
              </h3>
              {/* Bar Chart */}
              {userDemographics.length > 0 ? (
                <div className="space-y-2">
                  {userDemographics.map((demo, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="dark:text-black">{demo.country}</span>
                        <span className="dark:text-black">{demo.count}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-[#273C8F] h-3 rounded-full animate-bar-demographic"
                          style={
                            {
                              width: animateChart
                                ? `${(demo.count / maxDemographic) * 100}%`
                                : "0%",
                              "--bar-width": `${(demo.count / maxDemographic) * 100}%`,
                              animationDelay: `${0.3 + index * 0.1}s`,
                            } as React.CSSProperties
                          }
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-black text-center py-4">
                  No demographic data available
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Newsroom Team Section */}
      <section ref={teamRef} data-section="team" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-[#273C8F] uppercase text-center mb-12">
            Newsroom Team
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading team members...</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No team members available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-[10px] shadow-md overflow-hidden relative"
                  style={{ width: "250px", margin: "0 auto" }}
                >
                  {/* Image Section */}
                  <div
                    className="w-full bg-gray-200 overflow-hidden rounded-[10px] relative"
                    style={{ height: "300px" }}
                  >
                    {member.image_url ? (
                      <img
                        src={member.image_url}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-full h-full object-cover rounded-[10px]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center rounded-[10px]">
                        <User className="w-12 h-12 text-gray-500" />
                      </div>
                    )}
                    {/* Name/Title Background Section - Overlapping on image */}
                    <div
                      className="bg-white rounded-[10px] absolute bottom-[5px] left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center"
                      style={{
                        width: "240px",
                        height: "50px",
                        paddingTop: "0px",
                        paddingRight: "5px",
                        paddingBottom: "5px",
                        paddingLeft: "5px",
                      }}
                    >
                      <h3
                        className="text-base font-semibold text-gray-900 mb-0.5 leading-tight text-center"
                        style={{ fontFamily: "Hanuman" }}
                      >
                        {member.first_name} {member.last_name}
                      </h3>
                      <p
                        className="text-xs text-gray-600 leading-tight text-center"
                        style={{ fontFamily: "Hanuman" }}
                      >
                        {member.position}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Our Mission Section */}
      <section
        ref={missionRef}
        data-section="mission"
        className="py-16 px-4 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <Image
                src={TKDNLogo}
                alt="The Khmer Daily Network Logo"
                className="object-contain"
                width={300}
                height={120}
                priority
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#273C8F] uppercase mb-6">
                Our Mission
              </h2>
              <p className="text-gray-700 leading-relaxed text-xl">
                At The Khmer Daily Network, we provide trustworthy and
                insightful reporting that highlights Cambodia's evolving
                landscape and international trends. We strive to empower
                business leaders, innovators, and everyday readers with
                up-to-date information and expert perspectives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section ref={partnersRef} data-section="partners" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-[#273C8F] uppercase text-center mb-12">
            Our Partners
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading partners...</p>
            </div>
          ) : partners.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center"
                >
                  {/* <span className="text-gray-400 text-sm">Partner Logo</span> */}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-4"
                >
                  {partner.image_url ? (
                    <img
                      src={partner.image_url}
                      alt={partner.name || "Partner logo"}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const parent = (e.target as HTMLImageElement)
                          .parentElement;
                        if (parent) {
                          parent.innerHTML =
                            '<span class="text-gray-400 text-sm">Partner Logo</span>';
                        }
                      }}
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">Partner Logo</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
