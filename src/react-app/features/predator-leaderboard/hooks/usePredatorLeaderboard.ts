import { useQuery } from "@tanstack/react-query";
import { getPredatorLeaderboard } from "@/api";

type PredatorData = any;

export const usePredatorLeaderboard = () => {
  return useQuery<PredatorData>({
    queryKey: ["predatorLeaderboard"],

    queryFn: getPredatorLeaderboard,

    staleTime: 15 * 60 * 1000,
  });
};
