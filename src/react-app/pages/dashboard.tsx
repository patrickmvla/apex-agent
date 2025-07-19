import { AIChat } from "@/features/ai-chat/components/ai-chat";
import MapRotation from "@/features/map-rotation/map-rotation";
import { PlayerStatsSearch } from "@/features/player-stats/components/player-stats-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header Section */}
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Apex Legends Dashboard
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Your central hub for live game data, player statistics, and AI-powered insights.
        </p>
      </header>

      {/* Main content area */}
      <div className="space-y-8">
        {/* Top Row: AI Chat and Player Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          
          {/* AI Chat takes up more space on the left */}
          <div className="lg:col-span-3">
            {/* The AIChat component is already a self-contained card, so we place it directly. */}
            <AIChat />
          </div>

          {/* Player Stats on the right */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Player Statistics</CardTitle>
                <CardDescription>
                  Search for a player to view their stats.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* The redesigned PlayerStatsSearch component fits perfectly here. */}
                <PlayerStatsSearch />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Row: Map Rotation */}
        <Card>
          <CardHeader>
            <CardTitle>Live Map Rotation</CardTitle>
            <CardDescription>
              Check the current and upcoming map schedules for all game modes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* The MapRotation component arranges the individual map cards. */}
            <MapRotation />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
