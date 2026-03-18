import { create } from "zustand";

/** UI-only navigation state. Do not store Supabase/server entities here; use TanStack Query for server-backed data. */
type UiStore = {
  activeTab: "dashboard" | "goals" | "profile";
  setActiveTab: (tab: UiStore["activeTab"]) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  activeTab: "dashboard",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));