import { useQuery } from "@tanstack/react-query";
import { getCraftingRotation } from "@/api";

type CraftingItem = any;

export const useCraftingRotation = () => {
  return useQuery<CraftingItem[]>({
    queryKey: ["craftingRotation"],

    queryFn: getCraftingRotation,

    staleTime: 60 * 60 * 1000,
  });
};
