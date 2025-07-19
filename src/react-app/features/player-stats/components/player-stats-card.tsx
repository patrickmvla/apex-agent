import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { usePlayerStats } from "../hooks/use-player-stats";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BarChart, Loader2, Search, ServerCrash, User } from "lucide-react";

// Zod schema for form validation
const formSchema = z.object({
  playerName: z.string().min(2, {
    message: "Player name must be at least 2 characters.",
  }),
  platform: z.enum(["PC", "PS4", "X1"]),
});

// A small, reusable component for displaying a single stat
const StatItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
        <div className="text-muted-foreground">{icon}</div>
        <div className="flex-grow">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-bold text-lg text-foreground">{value}</p>
        </div>
    </div>
);

export const PlayerStatsSearch = () => {
  const { mutate, data, isPending, isError, error } = usePlayerStats();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerName: "",
      platform: "PC",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(values);
  }

  const renderContent = () => {
    if (isPending) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center h-64 flex flex-col justify-center items-center text-destructive">
            <ServerCrash className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-bold">Search Failed</h3>
            <p className="text-sm">{error.message}</p>
        </div>
      );
    }

    if (data && data.global) {
      const legend = data.legends?.selected;
      const rank = data.global.rank;
      const legendKills = legend?.data?.find((d: any) => d.name === "Kills")?.value || 0;

      return (
        <div className="mt-4 animate-in fade-in duration-500">
            <div className="relative h-32 rounded-t-lg overflow-hidden">
                <img 
                    src={legend?.ImgAssets?.banner} 
                    alt={legend?.LegendName}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => { e.currentTarget.src = "https://placehold.co/600x128/1a1a1a/ffffff?text=+"}}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>
            
            <div className="relative px-4 -mt-12">
                <Avatar className="h-24 w-24 border-4 border-background">
                    <AvatarImage src={legend?.ImgAssets?.icon} alt={legend?.LegendName} />
                    <AvatarFallback className="text-2xl">{data.global.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
            </div>

            <div className="p-4 space-y-1">
                <h3 className="text-2xl font-bold">{data.global.name}</h3>
                <p className="text-muted-foreground">Level {data.global.level} • {data.global.platform}</p>
            </div>
            
            <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StatItem 
                    icon={<img src={rank?.rankImg} alt={rank?.rankName} className="h-8 w-8"/>}
                    label="Current Rank"
                    value={`${rank?.rankName} ${rank?.rankDiv}`}
                />
                <StatItem 
                    icon={<BarChart className="h-8 w-8"/>}
                    label="Rank Score"
                    value={`${rank?.rankScore} LP`}
                />
                {legend && (
                     <StatItem 
                        icon={<User className="h-8 w-8"/>}
                        label={`${legend.LegendName} Kills`}
                        value={legendKills}
                    />
                )}
            </div>
        </div>
      );
    }

    // Initial state before any search
    return (
        <div className="text-center h-64 flex flex-col justify-center items-center text-muted-foreground">
            <Search className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">Search for a Player</h3>
            <p className="text-sm">Enter a name and platform to see their stats.</p>
        </div>
    );
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <FormField
            control={form.control}
            name="playerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Player Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter player name..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="PS4">PlayStation</SelectItem>
                    <SelectItem value="X1">Xbox</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search
          </Button>
        </form>
      </Form>
      
      {/* This is where the results, loading, or error states will be rendered */}
      <div className="mt-4 border-t pt-4">
        {renderContent()}
      </div>
    </div>
  );
};
