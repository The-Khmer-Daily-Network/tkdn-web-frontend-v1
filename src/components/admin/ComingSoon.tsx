"use client";

import { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
  icon: LucideIcon;
}

export default function ComingSoon({
  title,
  description,
  icon: Icon,
}: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-8">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="p-6 bg-[#273C8F]/10 rounded-full">
            <Icon size={64} className="text-[#273C8F]" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-[#273C8F] text-white rounded-full text-sm font-semibold">
            Coming Soon
          </span>
        </div>
        {description && (
          <p className="text-gray-600 text-lg leading-relaxed">{description}</p>
        )}
        {!description && (
          <p className="text-gray-600 text-lg leading-relaxed">
            We're working hard to bring you this feature. Stay tuned for
            updates!
          </p>
        )}
      </div>
    </div>
  );
}
