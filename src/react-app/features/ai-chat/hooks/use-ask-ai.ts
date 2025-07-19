// src/apex-agent/features/ai-chat/hooks/useAskAI.ts

import { useMutation } from "@tanstack/react-query";
import { askAI } from "@/api";

export const useAskAI = () => {
  return useMutation({
   
    mutationFn: (message: string) => askAI(message),
  
  });
};
