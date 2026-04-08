"use client";
import { useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import CoversContents from "@/features/admin/coversContents";
import CoverSelectorModal from "@/components/admin/CoverSelectorModal";
import type { ContentCover } from "@/types/contentCover";

export default function Covers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCover, setSelectedCover] = useState<ContentCover | null>(null);

  return (
    <div>
      {/* <PageHeader title="Covers" /> */}
      <CoversContents />

      {/* Modal for testing */}
      <CoverSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(cover) => {
          setSelectedCover(cover);
          console.log("Selected cover:", cover);
        }}
      />
    </div>
  );
}
