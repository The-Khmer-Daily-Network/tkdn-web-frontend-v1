"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, UserPlus } from "lucide-react";
import {
  getPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher,
} from "@/services/publisher";
import type { Publisher } from "@/types/publisher";

interface PublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  publisher?: Publisher | null;
}

function PublisherModal({
  isOpen,
  onClose,
  onSuccess,
  publisher,
}: PublisherModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gmail, setGmail] = useState("");
  const [sme, setSme] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publisher) {
      setFirstName(publisher.first_name);
      setLastName(publisher.last_name);
      setNickname(publisher.nickname);
      setGmail(publisher.gmail);
      setSme(publisher.sme || false);
    } else {
      setFirstName("");
      setLastName("");
      setNickname("");
      setGmail("");
      setSme(false);
    }
    setError(null);
  }, [publisher, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !nickname.trim() ||
      !gmail.trim()
    ) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (publisher) {
        // Update existing publisher
        await updatePublisher(publisher.id, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          nickname: nickname.trim(),
          gmail: gmail.trim(),
          sme: sme,
        });
      } else {
        // Create new publisher
        await createPublisher({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          nickname: nickname.trim(),
          gmail: gmail.trim(),
          sme: sme,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save publisher";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h2 className="text-xl font-semibold text-gray-900">
              {publisher ? "Edit" : "Create"} Publisher
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nickname <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter nickname"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gmail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                disabled={loading}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sme}
                  onChange={(e) => setSme(e.target.checked)}
                  className="cursor-pointer w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-700">
                  SME (Senior Management Team)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                SME can full control the whole platform
              </p>
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
                  !nickname.trim() ||
                  !gmail.trim()
                }
                className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Saving..." : publisher ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function Publishers() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(
    null,
  );

  useEffect(() => {
    fetchPublishers();
  }, []);

  const fetchPublishers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPublishers();
      setPublishers(response.data);
    } catch (err) {
      console.error("Error fetching publishers:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch publishers",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePublisher = () => {
    setSelectedPublisher(null);
    setIsCreateModalOpen(true);
  };

  const handleEditPublisher = (publisher: Publisher) => {
    setSelectedPublisher(publisher);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this publisher?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deletePublisher(id);
      await fetchPublishers();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete publisher";
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading publishers...</p>
      </div>
    );
  }

  if (error && publishers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={fetchPublishers}
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
            Publishers Management
          </h2>
          <button
            onClick={handleCreatePublisher}
            className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm"
          >
            <Plus size={16} />
            Add Publisher
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

        {publishers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No publishers found.</p>
              <button
                onClick={handleCreatePublisher}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Publisher
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {publishers.map((publisher) => (
              <div
                key={publisher.id}
                className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {publisher.first_name} {publisher.last_name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>
                            <span className="font-medium">Nickname:</span>{" "}
                            {publisher.nickname}
                          </span>
                          <span>
                            <span className="font-medium">Email:</span>{" "}
                            {publisher.gmail}
                          </span>
                          {publisher.sme && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                              SME
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditPublisher(publisher)}
                      className="cursor-pointer p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit Publisher"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(publisher.id)}
                      disabled={deletingId === publisher.id}
                      className="cursor-pointer p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Publisher"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <PublisherModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchPublishers}
      />

      <PublisherModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPublisher(null);
        }}
        onSuccess={fetchPublishers}
        publisher={selectedPublisher}
      />
    </div>
  );
}
