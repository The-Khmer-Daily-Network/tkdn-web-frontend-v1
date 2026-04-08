"use client";
import CategoriesManagement from "@/features/admin/categoriesManagement";
import SMEProtectedRoute from "@/components/SMEProtectedRoute";

export default function CategoryManagementPage() {
  return (
    <SMEProtectedRoute>
      <div>
        <CategoriesManagement />
      </div>
    </SMEProtectedRoute>
  );
}
