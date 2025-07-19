import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Map } from "lucide-react";
import { CountdownTimer } from "./countdown-timer";

export const MapCard = ({
  title,
  mapInfo,
}: {
  title: string;
  mapInfo: any;
}) => {
  // Return null if there's no map data to display, preventing empty cards.
  if (!mapInfo || !mapInfo.current || !mapInfo.next) {
    return null;
  }

  return (
    <Card className="overflow-hidden group transition-all duration-300 rounded-none">
      {/* Map Image with Badge */}
      <div className="relative">
        <img
          src={mapInfo.current.asset}
          alt={mapInfo.current.map}
          className="w-full aspect-video object-cover"
          onError={(e) => {
            // Fallback for broken image links
            e.currentTarget.src =
              "https://placehold.co/600x338/1a1a1a/ffffff?text=Map+Image";
          }}
        />
        {/* Game mode badge */}
        <Badge variant="secondary" className="absolute top-3 right-3 text-sm rounded-sm">
          {title}
        </Badge>
      </div>

      {/* Unified Card Content */}
      <CardContent className="p-4 space-y-4">
        {/* Current Map Title */}
        <h3 className="flex items-center gap-2 text-2xl font-bold">
          <Map className="h-6 w-6 text-primary" />
          {mapInfo.current.map}
        </h3>

        {/* Countdown Timer */}
        <div className="flex items-center gap-3 p-3 bg-muted">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground text-sm font-medium">
            Time Remaining
          </span>
          <div className="ml-auto font-mono text-lg font-semibold text-foreground">
            <CountdownTimer endTime={mapInfo.current.end} />
          </div>
        </div>

        {/* Next Map Info */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <ArrowRight className="h-5 w-5" />
          <span className="text-sm font-medium">Next Map:</span>
          <strong className="text-foreground">{mapInfo.next.map}</strong>
        </div>
      </CardContent>
    </Card>
  );
};
