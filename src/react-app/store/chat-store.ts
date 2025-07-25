import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  role: "user" | "assistant";
  parts: Array<{ text: string }>;
  sources?: string[];
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "chat-storage",
    }
  )
);
