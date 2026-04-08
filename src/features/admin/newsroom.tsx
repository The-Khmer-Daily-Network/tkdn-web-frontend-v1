"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  getNewsroomTeam,
  createNewsroomTeam,
  updateNewsroomTeam,
  deleteNewsroomTeam,
  getNewsroomTeamImages,
  uploadNewsroomTeamImage,
} from "@/services/newsroomTeam";
import type { NewsroomTeam, NewsroomTeamImage } from "@/types/newsroomTeam";

interface NewsroomTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamMember?: NewsroomTeam | null;
}

function NewsroomTeamModal({
  isOpen,
  onClose,
  onSuccess,
  teamMember,
}: NewsroomTeamModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image upload states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [availableImages, setAvailableImages] = useState<NewsroomTeamImage[]>(
    [],
  );
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (teamMember) {
      setFirstName(teamMember.first_name);
      setLastName(teamMember.last_name);
      setPosition(teamMember.position);
      setImageUrl(teamMember.image_url || "");
    } else {
      setFirstName("");
      setLastName("");
      setPosition("");
      setImageUrl("");
    }
    setError(null);
    setUploadedImageUrl(null);
  }, [teamMember, isOpen]);

  useEffect(() => {
    if (showImageSelector) {
      fetchAvailableImages();
    }
  }, [showImageSelector]);

  const fetchAvailableImages = async () => {
    try {
      const response = await getNewsroomTeamImages();
      setAvailableImages(response.data);
    } catch (err) {
      console.error("Error fetching images:", err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setError(null);

      const response = await uploadNewsroomTeamImage(file);

      // Handle single or array response
      const uploadedImage = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      setUploadedImageUrl(uploadedImage.image_url);
      setImageUrl(uploadedImage.image_url);

      // Refresh available images
      await fetchAvailableImages();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSelectImage = (image: NewsroomTeamImage) => {
    setImageUrl(image.image_url);
    setShowImageSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !position.trim()) {
      setError("First name, last name, and position are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (teamMember) {
        // Update existing team member
        await updateNewsroomTeam(teamMember.id, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          position: position.trim(),
          image_url: imageUrl.trim() || null,
        });
      } else {
        // Create new team member
        await createNewsroomTeam({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          position: position.trim(),
          image_url: imageUrl.trim() || null,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save team member";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h2 className="text-xl font-semibold text-gray-900">
              {teamMember ? "Edit" : "Create"} Newsroom Team Member
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Enter position"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Enter image URL or upload image"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowImageSelector(!showImageSelector)}
                    className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {showImageSelector ? "Hide" : "Select"} Image
                  </button>
                  <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {isUploadingImage ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    Upload
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={loading || isUploadingImage}
                    />
                  </label>
                </div>

                {showImageSelector && (
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
                    {availableImages.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No images available
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {availableImages.map((image) => (
                          <div
                            key={image.id}
                            onClick={() => handleSelectImage(image)}
                            className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                              imageUrl === image.image_url
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                          >
                            <img
                              src={image.image_url}
                              alt={image.name}
                              className="w-full h-20 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {uploadedImageUrl && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      Image uploaded successfully! URL has been set.
                    </p>
                  </div>
                )}

                {imageUrl && (
                  <div className="mt-2">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      onError={() => {
                        // Image failed to load
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="cursor-pointer px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  !firstName.trim() ||
                  !lastName.trim() ||
                  !position.trim()
                }
                className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Saving..." : teamMember ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function Newsroom() {
  const [teamMembers, setTeamMembers] = useState<NewsroomTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] =
    useState<NewsroomTeam | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNewsroomTeam();
      // Sort by ID ascending so first added appears first
      const sortedMembers = [...response.data].sort((a, b) => a.id - b.id);
      setTeamMembers(sortedMembers);
    } catch (err) {
      console.error("Error fetching team members:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch team members",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeamMember = () => {
    setSelectedTeamMember(null);
    setIsCreateModalOpen(true);
  };

  const handleEditTeamMember = (teamMember: NewsroomTeam) => {
    setSelectedTeamMember(teamMember);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this team member?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteNewsroomTeam(id);
      await fetchTeamMembers();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete team member";
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading team members...</p>
      </div>
    );
  }

  if (error && teamMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={fetchTeamMembers}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Newsroom Team Management
          </h2>
          <button
            onClick={handleCreateTeamMember}
            className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm"
          >
            <Plus size={16} />
            Add Team Member
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        {teamMembers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No team members found.</p>
              <button
                onClick={handleCreateTeamMember}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Team Member
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {member.image_url && (
                  <div className="w-[250px] h-[300px] bg-gray-100 overflow-hidden mx-auto">
                    <img
                      src={member.image_url}
                      alt={`${member.first_name} ${member.last_name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {member.first_name} {member.last_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {member.position}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => handleEditTeamMember(member)}
                      className="cursor-pointer flex-1 px-3 py-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Edit2 size={14} className="inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      disabled={deletingId === member.id}
                      className="cursor-pointer flex-1 px-3 py-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <Trash2 size={14} className="inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <NewsroomTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchTeamMembers}
      />

      <NewsroomTeamModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTeamMember(null);
        }}
        onSuccess={fetchTeamMembers}
        teamMember={selectedTeamMember}
      />
    </div>
  );
}
