import { useMapRotation } from "./hooks/use-map-rotation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapCard } from "./components/map-card"; // Assuming this is your custom component
import { AlertTriangle, Hourglass, Map as MapIcon } from "lucide-react";

// A simple, reusable skeleton component for the loading state.
const LoadingSkeleton = () => (
    <div className="min-h-[250px] bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
);


const MapRotation = () => {
  const { data, isLoading, isError, error } = useMapRotation();

  // This internal function decides what to render based on the hook's state.
  const renderContent = () => {
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

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-red-500 bg-red-500/10 p-4 rounded-md">
           <AlertTriangle className="h-10 w-10 mb-2" />
           <p className="font-semibold">Error Fetching Map Rotation</p>
           <p className="text-sm">{error.message}</p>
        </div>
      );
    }

    // Check if any map data exists to provide a more graceful empty state.
    const hasData = data?.battle_royale || data?.ranked || data?.ltm;

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-100/50 dark:bg-slate-800/20 p-4 rounded-md">
                <Hourglass className="h-10 w-10 mb-2" />
                <p className="font-semibold">No Active Rotations</p>
                <p className="text-sm">Could not find any active map rotations at this time.</p>
            </div>
        );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/*
          The MapCard component you provide will be rendered here.
          It gracefully handles cases where a specific mode (e.g., LTM) might be null.
        */}
        <MapCard title="Battle Royale" mapInfo={data?.battle_royale} />
        <MapCard title="Ranked" mapInfo={data?.ranked} />
        <div className="md:col-span-2">
            <MapCard title="Limited-Time Mode" mapInfo={data?.ltm} />
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-slate-100/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <MapIcon className="h-6 w-6 text-green-500"/>
                Live Map Rotation
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
                Real-time map schedules for all game modes.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
    </Card>
  );
};

export default MapRotation;
