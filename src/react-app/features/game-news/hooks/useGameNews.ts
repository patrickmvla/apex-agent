import { useQuery } from "@tanstack/react-query";
import { getGameNews } from "@/api";

type NewsArticle = any;

export const useGameNews = () => {
  return useQuery<NewsArticle[]>({
    queryKey: ["gameNews"],

    queryFn: getGameNews,

    staleTime: 30 * 60 * 1000,
  });
};
