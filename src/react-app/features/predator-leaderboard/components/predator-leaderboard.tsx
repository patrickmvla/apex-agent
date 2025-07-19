import { usePredatorLeaderboard } from "../hooks/usePredatorLeaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Monitor, Gamepad } from "lucide-react";

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "PC":
      return <Monitor className="h-4 w-4" />;
    case "PS4":
      return <Gamepad className="h-4 w-4" />;
    case "X1":
      return <Gamepad className="h-4 w-4" />;
    default:
      return null;
  }
};

const LeaderboardTable = ({ players }: { players: any[] }) => {
  if (!players || players.length === 0) {
    return <p>No Predator data available for this platform.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Rank</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">LP</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.slice(0, 10).map((player) => (
          <TableRow key={player.uid}>
            <TableCell className="font-medium">{player.rank}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <PlatformIcon platform={player.platform} />
                <span>{player.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              {player.val.toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex justify-between items-center p-2">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-1/4" />
      </div>
    ))}
  </div>
);

export const PredatorLeaderboardDisplay = () => {
  const { data, isLoading, isError, error } = usePredatorLeaderboard();

  if (isError) {
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        Error fetching Predator leaderboard: {error.message}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown />
          Apex Predator Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="PC">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="PC">PC</TabsTrigger>
            <TabsTrigger value="PS4">PlayStation</TabsTrigger>
            <TabsTrigger value="X1">Xbox</TabsTrigger>
          </TabsList>
          <TabsContent value="PC">
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <LeaderboardTable players={data?.RP?.PC?.players} />
            )}
          </TabsContent>
          <TabsContent value="PS4">
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <LeaderboardTable players={data?.RP?.PS4?.players} />
            )}
          </TabsContent>
          <TabsContent value="X1">
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <LeaderboardTable players={data?.RP?.X1?.players} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
