import { useQuery } from "@tanstack/react-query";
import { getStoreRotation } from "@/api";


type StoreItem = any;

export const useStoreRotation = () => {
  return useQuery<StoreItem[]>({
   
    queryKey: ["storeRotation"],
   
    queryFn: getStoreRotation,
    
    staleTime: 60 * 60 * 1000, 
  });
};
