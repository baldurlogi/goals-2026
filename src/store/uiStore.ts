import { create } from "zustand";

type UiStore = {
  activeTab: "dashboard" | "goals" | "profile";
  setActiveTab: (tab: UiStore["activeTab"]) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  activeTab: "dashboard",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));