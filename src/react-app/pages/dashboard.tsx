import { AIChat } from "@/features/ai-chat/components/ai-chat";
import MapRotation from "@/features/map-rotation/map-rotation";
import { PlayerStatsSearch } from "@/features/player-stats/components/player-stats-card";
import { Button } from "@/components/ui/button"; // Assuming you have a button component
import { Gamepad2, Moon, Sun } from "lucide-react";

// A dedicated, reusable Header component for the application.
const Header = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
            <div className="container mx-auto flex h-full items-center justify-between px-4">
                {/* Logo and Title */}
                <div className="flex items-center gap-2">
                    <Gamepad2 className="h-7 w-7 text-green-500" />
                    <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        Apex Intel Hub
                    </span>
                </div>
                {/* Placeholder for theme toggle or other actions */}
                <Button variant="ghost" size="icon">
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </div>
        </header>
    );
};


const Dashboard = () => {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      {/* Background decorative element */}
      <div className="absolute top-0 left-0 -z-10 h-full w-full">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60vw] h-[60vh] bg-green-500/10 dark:bg-green-500/20 rounded-full blur-[120px]"></div>
      </div>
      
      {/* Application Header */}
      <Header />

      {/* Main Content Area */}
      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12 md:px-6 lg:px-8 space-y-12">
        {/* Page Title Section */}
        {/* <section className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-5xl">
                Dashboard
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400">
                Your central command for live game data, player statistics, and AI-powered insights.
            </p>
        </section> */}

        {/* Top Row: AI Chat and Player Stats */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3">
            <AIChat />
          </div>
          <div className="lg:col-span-2">
            <PlayerStatsSearch />
          </div>
        </section>

        {/* Bottom Row: Map Rotation */}
        <section>
          <MapRotation />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
