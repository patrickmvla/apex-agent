import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Map } from "lucide-react";
import { useEffect, useState } from "react";

const CountdownTimer = ({ endTime }: { endTime: number }) => {
  const calculateTimeLeft = () => {
    const difference = endTime * 1000 - new Date().getTime();
    let timeLeft = { hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const formatTime = (time: number) => time.toString().padStart(2, "0");

  return (
    <span>
      {`${formatTime(timeLeft.hours)}:${formatTime(
        timeLeft.minutes
      )}:${formatTime(timeLeft.seconds)}`}
    </span>
  );
};

export const MapCard = ({
  title,
  mapInfo,
}: {
  title: string;
  mapInfo: any;
}) => {
  if (!mapInfo || !mapInfo.current || !mapInfo.next) {
    return null;
  }

  return (
    <Card className="overflow-hidden group transition-all duration-300 border-slate-200 dark:border-slate-800 hover:shadow-lg hover:shadow-green-500/10 hover:border-green-500/30">
      {/* Map Image with Badge and Gradient */}
      <div className="relative">
        <img
          src={mapInfo.current.asset}
          alt={mapInfo.current.map}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/600x338/1a1a1a/ffffff?text=Map+Image";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <Badge
          variant="secondary"
          className="absolute bottom-3 left-3 text-sm rounded-md bg-slate-900/50 text-white border border-slate-700 backdrop-blur-sm"
        >
          {title}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-4">
        <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-slate-100">
          <Map className="h-6 w-6 text-green-500" />
          {mapInfo.current.map}
        </h3>

        <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
          <Clock className="h-5 w-5 text-green-500" />
          <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Time Remaining
          </span>
          <div className="ml-auto font-mono text-lg font-semibold text-slate-800 dark:text-slate-200">
            <CountdownTimer endTime={mapInfo.current.end} />
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <ArrowRight className="h-5 w-5" />
          <span className="text-sm font-medium">Next:</span>
          <strong className="text-slate-700 dark:text-slate-300">
            {mapInfo.next.map}
          </strong>
        </div>
      </CardContent>
    </Card>
  );
};
