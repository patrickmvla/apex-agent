import { getPlayerStats } from "@/api";
import { useMutation } from "@tanstack/react-query";

export const usePlayerStats = () => {
  return useMutation({
    mutationFn: getPlayerStats,
  });
};
