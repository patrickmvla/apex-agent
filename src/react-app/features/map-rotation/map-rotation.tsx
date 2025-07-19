import { LoadingSkeleton } from "./components/loading-skeleton";
import { MapCard } from "./components/map-card";
import { useMapRotation } from "./hooks/use-map-rotation";

/**
 * Renders the map rotation section with a specific grid layout:
 * - On medium screens and up, the first two cards are side-by-side.
 * - The third card is placed below them, spanning the full width.
 * - On smaller screens, all cards stack vertically.
 */
const MapRotation = () => {
  const { data, isLoading, isError, error } = useMapRotation();

  // Display a layout-aware loading skeleton.
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <div className="md:col-span-2">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Display an error message if the data fetch fails.
  if (isError) {
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        Error fetching map rotation: {error.message}
      </div>
    );
  }

  // Display the map cards in the desired 2x1 grid layout.
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MapCard title="Battle Royale" mapInfo={data?.battle_royale} />
      <MapCard title="Ranked" mapInfo={data?.ranked} />
      <div className="md:col-span-2">
        <MapCard title="LTM" mapInfo={data?.ltm} />
      </div>
    </div>
  );
};

export default MapRotation;
