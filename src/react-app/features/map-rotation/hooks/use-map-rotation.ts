import { getMapRotation } from "@/api";
import { useQuery } from "@tanstack/react-query";

interface MapRotationData {
  battle_royale: {
    current: { map: string; remainingTime: string };
    next: { map: string };
  };
  ranked: {
    current: { map: string; remainingTime: string };
    next: { map: string };
  };
  ltm: {
    current: { map: string; remainingTime: string };
    next: { map: string };
  };
}

export const useMapRotation = () => {
  return useQuery<MapRotationData>({
    queryKey: ["mapRotation"],
    queryFn: getMapRotation,
    refetchInterval: 5 * 60 * 1000,
  });
};
