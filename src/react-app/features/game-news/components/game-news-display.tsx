import { useGameNews } from "../hooks/useGameNews";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const NewsArticleCard = ({ article }: { article: any }) => {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <Card className="overflow-hidden h-full hover:border-primary transition-colors">
        <div className="aspect-video overflow-hidden">
          <img
            src={article.img}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/400x225/1a1a1a/ffffff?text=News+Image";
            }}
          />
        </div>
        <CardHeader>
          <CardTitle className="text-lg">{article.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>{article.short_desc}</CardDescription>
        </CardContent>
      </Card>
    </a>
  );
};

const LoadingSkeleton = () => (
  <>
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <Skeleton className="w-full aspect-video" />
        <CardHeader>
          <Skeleton className="h-5 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    ))}
  </>
);

export const GameNewsDisplay = () => {
  const { data, isLoading, isError, error } = useGameNews();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        Error fetching game news: {error.message}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Latest News</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.map((article: any) => (
          <NewsArticleCard key={article.title} article={article} />
        ))}
      </div>
    </div>
  );
};
