import { create } from "zustand";
import { persist } from "zustand/middleware";
import { env } from "@/lib/env";

const ENV_DEFAULT = env.NEXT_PUBLIC_DEMO_MODE === "true";

interface DemoModeState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
}

export const useDemoModeStore = create<DemoModeState>()(
  persist(
    (set) => ({
      enabled: ENV_DEFAULT,
      setEnabled: (enabled) => set({ enabled }),
      toggle: () => set((s) => ({ enabled: !s.enabled })),
    }),
    { name: "transitflow-demo-mode" },
  ),
);
