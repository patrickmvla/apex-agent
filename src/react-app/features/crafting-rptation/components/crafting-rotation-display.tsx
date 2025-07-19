import { useCraftingRotation } from "../hooks/useCraftingRotation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Hammer } from "lucide-react";

const CraftingItemCard = ({ item }: { item: any }) => {
  const bundleContent = item.bundleContent?.[0];
  if (!bundleContent) return null;

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="aspect-video bg-muted flex items-center justify-center p-4">
        <img
          src={bundleContent.itemType.asset}
          alt={bundleContent.itemType.name}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/400x225/1a1a1a/ffffff?text=Item+Image";
          }}
        />
      </div>
      <CardHeader className="flex-grow">
        <CardTitle className="text-lg">{bundleContent.itemType.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hammer className="h-5 w-5" />
          <span className="font-bold text-foreground">{item.cost}</span>
          <span>Crafting Metals</span>
        </div>
      </CardContent>
    </Card>
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
          <Skeleton className="h-5 w-1/2" />
        </CardContent>
      </Card>
    ))}
  </>
);

export const CraftingRotationDisplay = () => {
  const { data, isLoading, isError, error } = useCraftingRotation();

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
        Error fetching crafting rotation: {error.message}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Current Crafting Rotation</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data?.map((item: any) => (
          <CraftingItemCard key={item.bundle} item={item} />
        ))}
      </div>
    </div>
  );
};
