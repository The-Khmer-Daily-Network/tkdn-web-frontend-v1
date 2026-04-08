"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/category";
import type { Category, SubCategory } from "@/types/category";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: Category | SubCategory | null;
  parentId?: number | null;
  isSubCategory?: boolean;
}

function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  category,
  parentId,
  isSubCategory,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
    } else {
      setName("");
    }
    setError(null);
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (category) {
        // Update existing category
        await updateCategory(category.id, { name: name.trim() });
      } else {
        // Create new category
        await createCategory({
          name: name.trim(),
          parent_id: isSubCategory ? (parentId ?? null) : null,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
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
          className="bg-white rounded-lg shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {category ? "Edit" : "Create"} {isSubCategory ? "Sub" : ""}{" "}
              Category
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                disabled={loading}
                autoFocus
              />
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
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Saving..." : category ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Modal states
  const [isCreateMainModalOpen, setIsCreateMainModalOpen] = useState(false);
  const [isCreateSubModalOpen, setIsCreateSubModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    Category | SubCategory | null
  >(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set(),
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCategories();
      setCategories(response.categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch categories",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMainCategory = () => {
    setSelectedCategory(null);
    setSelectedParentId(null);
    setIsCreateMainModalOpen(true);
  };

  const handleCreateSubCategory = (parentId: number) => {
    setSelectedCategory(null);
    setSelectedParentId(parentId);
    setIsCreateSubModalOpen(true);
  };

  const handleEditCategory = (category: Category | SubCategory) => {
    setSelectedCategory(category);
    setSelectedParentId(category.parent_id);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number, hasSubcategories: boolean) => {
    if (hasSubcategories) {
      alert(
        "Cannot delete category with subcategories. Please delete subcategories first.",
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete category";
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading categories...</p>
      </div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={fetchCategories}
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
            Categories Management
          </h2>
          <button
            onClick={handleCreateMainCategory}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm"
          >
            <Plus size={16} />
            Add Main Category
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

        {categories.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No categories found.</p>
              <button
                onClick={handleCreateMainCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Category
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const hasSubcategories = category.subcategories.length > 0;

              return (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Main Category */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2 flex-1">
                      {hasSubcategories && (
                        <button
                          onClick={() => toggleExpand(category.id)}
                          className="cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp size={18} className="text-gray-600" />
                          ) : (
                            <ChevronDown size={18} className="text-gray-600" />
                          )}
                        </button>
                      )}
                      <span className="font-medium text-gray-900">
                        {category.name}
                      </span>
                      {hasSubcategories && (
                        <span className="text-xs text-gray-500">
                          ({category.subcategories.length} subcategories)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCreateSubCategory(category.id)}
                        className="cursor-pointer p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Add Sub Category"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="cursor-pointer p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(category.id, hasSubcategories)
                        }
                        disabled={
                          deletingId === category.id || hasSubcategories
                        }
                        className="cursor-pointer p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          hasSubcategories
                            ? "Cannot delete: has subcategories"
                            : "Delete Category"
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories */}
                  {isExpanded && hasSubcategories && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {category.subcategories.map((subcategory) => (
                        <div
                          key={subcategory.id}
                          className="flex items-center justify-between p-3 pl-10 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-gray-700">
                            {subcategory.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCategory(subcategory)}
                              className="cursor-pointer p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Sub Category"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(subcategory.id, false)
                              }
                              disabled={deletingId === subcategory.id}
                              className="cursor-pointer p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Sub Category"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={isCreateMainModalOpen}
        onClose={() => setIsCreateMainModalOpen(false)}
        onSuccess={fetchCategories}
        isSubCategory={false}
      />

      <CategoryModal
        isOpen={isCreateSubModalOpen}
        onClose={() => setIsCreateSubModalOpen(false)}
        onSuccess={fetchCategories}
        parentId={selectedParentId}
        isSubCategory={true}
      />

      <CategoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
        }}
        onSuccess={fetchCategories}
        category={selectedCategory}
        isSubCategory={selectedCategory?.parent_id !== null}
      />
    </div>
  );
}
