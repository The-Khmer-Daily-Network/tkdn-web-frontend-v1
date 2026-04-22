"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import {
  getStatistics,
  updateStatistics,
  type Statistics as StatisticsType,
  type UserDemographicItem,
} from "@/services/statistics";

export default function Statistics() {
  const [statistics, setStatistics] = useState<StatisticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    facebook: 0,
    youtube: 0,
    tiktok: 0,
    linkedin: 0,
    website: 0,
    instagram: 0,
    website_male: 0,
    website_female: 0,
    user_demographic: [
      {
        top1: "",
        top1_percentage: 0,
        top2: "",
        top2_percentage: 0,
        top3: "",
        top3_percentage: 0,
        top4: "",
        top4_percentage: 0,
        top5: "",
        top5_percentage: 0,
      },
      {
        top1: "",
        top1_percentage: 0,
        top2: "",
        top2_percentage: 0,
        top3: "",
        top3_percentage: 0,
        top4: "",
        top4_percentage: 0,
        top5: "",
        top5_percentage: 0,
      },
      {
        top1: "",
        top1_percentage: 0,
        top2: "",
        top2_percentage: 0,
        top3: "",
        top3_percentage: 0,
        top4: "",
        top4_percentage: 0,
        top5: "",
        top5_percentage: 0,
      },
      {
        top1: "",
        top1_percentage: 0,
        top2: "",
        top2_percentage: 0,
        top3: "",
        top3_percentage: 0,
        top4: "",
        top4_percentage: 0,
        top5: "",
        top5_percentage: 0,
      },
      {
        top1: "",
        top1_percentage: 0,
        top2: "",
        top2_percentage: 0,
        top3: "",
        top3_percentage: 0,
        top4: "",
        top4_percentage: 0,
        top5: "",
        top5_percentage: 0,
      },
    ] as UserDemographicItem[],
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStatistics();
      setStatistics(response.data);

      // Populate form with existing data
      setFormData({
        facebook: response.data.facebook || 0,
        youtube: response.data.youtube || 0,
        tiktok: response.data.tiktok || 0,
        linkedin: response.data.linkedin || 0,
        website: response.data.website || 0,
        instagram: response.data.instagram || 0,
        website_male: response.data.website_male || 0,
        website_female: response.data.website_female || 0,
        user_demographic: response.data.user_demographic || [
          {
            top1: "",
            top1_percentage: 0,
            top2: "",
            top2_percentage: 0,
            top3: "",
            top3_percentage: 0,
            top4: "",
            top4_percentage: 0,
            top5: "",
            top5_percentage: 0,
          },
          {
            top1: "",
            top1_percentage: 0,
            top2: "",
            top2_percentage: 0,
            top3: "",
            top3_percentage: 0,
            top4: "",
            top4_percentage: 0,
            top5: "",
            top5_percentage: 0,
          },
          {
            top1: "",
            top1_percentage: 0,
            top2: "",
            top2_percentage: 0,
            top3: "",
            top3_percentage: 0,
            top4: "",
            top4_percentage: 0,
            top5: "",
            top5_percentage: 0,
          },
          {
            top1: "",
            top1_percentage: 0,
            top2: "",
            top2_percentage: 0,
            top3: "",
            top3_percentage: 0,
            top4: "",
            top4_percentage: 0,
            top5: "",
            top5_percentage: 0,
          },
          {
            top1: "",
            top1_percentage: 0,
            top2: "",
            top2_percentage: 0,
            top3: "",
            top3_percentage: 0,
            top4: "",
            top4_percentage: 0,
            top5: "",
            top5_percentage: 0,
          },
        ],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch statistics",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await updateStatistics({
        facebook: formData.facebook,
        youtube: formData.youtube,
        tiktok: formData.tiktok,
        linkedin: formData.linkedin,
        website: formData.website,
        instagram: formData.instagram,
        website_male: formData.website_male,
        website_female: formData.website_female,
        user_demographic: formData.user_demographic,
      });

      setStatistics(response.data);
      setSuccessMessage("Statistics updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update statistics",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDemographicChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setFormData((prev) => {
      const updated = [...prev.user_demographic];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, user_demographic: updated };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-black">
          Statistics Management
        </h1>
        <p className="text-sm text-gray-600 dark:text-black mt-1">
          Manage and update platform statistics and demographics
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Social Media Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-black mb-4 pb-2 border-b border-gray-200">
            Social Media Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-black mb-1.5">
                Facebook
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.facebook}
                onChange={(e) =>
                  handleInputChange("facebook", parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-black mb-1.5">
                YouTube
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.youtube}
                onChange={(e) =>
                  handleInputChange("youtube", parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-black mb-1.5">
                TikTok
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.tiktok}
                onChange={(e) =>
                  handleInputChange("tiktok", parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-black mb-1.5">
                LinkedIn
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.linkedin}
                onChange={(e) =>
                  handleInputChange("linkedin", parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-black mb-1.5">
                Website
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.website}
                onChange={(e) =>
                  handleInputChange("website", parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-black mb-1.5">
                Instagram
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.instagram}
                onChange={(e) =>
                  handleInputChange(
                    "instagram",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-black"
              />
            </div>
          </div>
        </div>

        {/* Website Demographics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-black mb-4 pb-2 border-b border-gray-200">
            Total Engagement Page
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-black mb-1.5">
                Website Male (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.website_male}
                onChange={(e) =>
                  handleInputChange(
                    "website_male",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-black mb-1.5">
                Website Female (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.website_female}
                onChange={(e) =>
                  handleInputChange(
                    "website_female",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-black"
              />
            </div>
          </div>
        </div>

        {/* Published Content (Read-only) */}
        {statistics && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-black mb-4 pb-2 border-b border-gray-200">
              Published Content
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-600 dark:text-black mb-1">
                  Articles Published
                </label>
                <p className="text-2xl font-bold text-gray-900 dark:text-black">
                  {statistics.articles_published}
                </p>
                <p className="text-xs text-gray-500 dark:text-black mt-1">
                  Auto-calculated from news table
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-600 dark:text-black mb-1">
                  Videos Published
                </label>
                <p className="text-2xl font-bold text-gray-900 dark:text-black">
                  {statistics.videos_published}
                </p>
                <p className="text-xs text-gray-500 dark:text-black mt-1">
                  Auto-calculated from news table
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Demographics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-black mb-4 pb-2 border-b border-gray-200">
            User Demographics
          </h2>
          <p className="text-sm text-gray-600 dark:text-black mb-4">
            Configure up to 5 demographic categories with top 5 items each
          </p>

          <div className="space-y-6">
            {formData.user_demographic.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
                <h3 className="text-sm font-semibold text-gray-700 dark:text-black mb-3">
                  Category {index + 1}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="space-y-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-black">
                        Top {num}
                      </label>
                      <input
                        type="text"
                        value={
                          (item[
                            `top${num}` as keyof UserDemographicItem
                          ] as string) || ""
                        }
                        onChange={(e) =>
                          handleDemographicChange(
                            index,
                            `top${num}`,
                            e.target.value,
                          )
                        }
                        placeholder={`Top ${num} value`}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-black"
                      />
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={
                          (item[
                            `top${num}_percentage` as keyof UserDemographicItem
                          ] as number) || 0
                        }
                        onChange={(e) =>
                          handleDemographicChange(
                            index,
                            `top${num}_percentage`,
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="Percentage"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black dark:text-black"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={fetchStatistics}
            disabled={saving}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
        >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
        >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Statistics
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
