import { useStoreRotation } from "../hooks/useStoreRotation";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins } from "lucide-react";

const StoreItemCard = ({ item }: { item: any }) => {
  const price = item.pricing?.[0];

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="aspect-video overflow-hidden">
        <img
          src={item.asset}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/400x225/1a1a1a/ffffff?text=Item+Image";
          }}
        />
      </div>
      <CardHeader className="flex-grow">
        <CardTitle className="text-lg">{item.title}</CardTitle>
      </CardHeader>
      {price && (
        <CardFooter>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Coins className="h-5 w-5" />
            <span className="font-bold text-foreground">{price.quantity}</span>
            <span>{price.ref}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

const LoadingSkeleton = () => (
  <>
    {[...Array(8)].map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <Skeleton className="w-full aspect-video" />
        <CardHeader>
          <Skeleton className="h-5 w-3/4" />
        </CardHeader>
        <CardFooter>
          <Skeleton className="h-5 w-1/2" />
        </CardFooter>
      </Card>
    ))}
  </>
);

export const StoreRotationDisplay = () => {
  const { data, isLoading, isError, error } = useStoreRotation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        Error fetching store rotation: {error.message}
      </div>
    );
  }

  const storeData = data as any as {
    featured?: { entries: any[] };
    daily?: { entries: any[] };
    weekly?: { entries: any[] };
  };

  const allItems = [
    ...(storeData?.featured?.entries || []),
    ...(storeData?.daily?.entries || []),
    ...(storeData?.weekly?.entries || []),
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Daily & Featured Store</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {allItems.length > 0 ? (
          allItems.map((item: any, index: number) => (
            <StoreItemCard key={`${item.title}-${index}`} item={item} />
          ))
        ) : (
          <p>No store items available at the moment.</p>
        )}
      </div>
    </div>
  );
};
