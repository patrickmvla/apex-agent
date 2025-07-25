import { useMutation } from "@tanstack/react-query";
import { askAI, type ChatHistoryItem } from "@/api";

type AskAIVariables = {
  message: string;
  history: ChatHistoryItem[];
};

export const useAskAI = () => {
  return useMutation({
    mutationFn: ({ message, history }: AskAIVariables) =>
      askAI(message, history),
  });
};
