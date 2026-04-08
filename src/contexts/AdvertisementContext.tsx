"use client";

import { createContext, useContext, ReactNode } from "react";
import type { AdvertisementImage } from "@/types/advertisement";

interface AdvertisementContextType {
  images: AdvertisementImage[];
  loading: boolean;
}

const AdvertisementContext = createContext<AdvertisementContextType>({
  images: [],
  loading: true,
});

export function useAdvertisement() {
  return useContext(AdvertisementContext);
}

interface AdvertisementProviderProps {
  children: ReactNode;
  images: AdvertisementImage[];
  loading: boolean;
}

export function AdvertisementProvider({
  children,
  images,
  loading,
}: AdvertisementProviderProps) {
  return (
    <AdvertisementContext.Provider value={{ images, loading }}>
      {children}
    </AdvertisementContext.Provider>
  );
}
