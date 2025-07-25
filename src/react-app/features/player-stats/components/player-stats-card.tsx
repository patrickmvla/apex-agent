import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { usePlayerStats } from "../hooks/use-player-stats";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  BarChart,
  Crown,
  Loader2,
  Search,
  ServerCrash,
  Swords,
} from "lucide-react";

const formSchema = z.object({
  playerName: z.string().min(2, {
    message: "Player name must be at least 2 characters.",
  }),
  platform: z.enum(["PC", "PS4", "X1"]),
});

const StatItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-sm">
    <div className="text-green-500">{icon}</div>
    <div className="flex-grow">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
        {value}
      </p>
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
        <div className="flex flex-col items-center justify-center h-80 text-slate-500">
          <Loader2 className="h-12 w-12 animate-spin text-green-500" />
          <p className="mt-4">Searching for player...</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center h-80 flex flex-col justify-center items-center text-red-500">
          <ServerCrash className="h-12 w-12 mb-4" />
          <h3 className="text-xl font-bold">Search Failed</h3>
          <p className="text-sm text-red-400">{error.message}</p>
        </div>
      );
    }

    if (data && data.global) {
      const legend = data.legends?.selected;
      const rank = data.global.rank;
      const legendKills =
        legend?.data?.find((d: any) => d.name === "Kills")?.value || 0;

      return (
        <div className="animate-in fade-in-50 duration-500">
          <div className="relative h-40 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <img
              src={legend?.ImgAssets?.banner}
              alt={legend?.LegendName || "Legend Banner"}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/70 to-transparent dark:from-slate-900 dark:via-slate-900/70" />
            <div className="absolute bottom-4 left-4 flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-slate-50 dark:border-slate-900 shadow-lg">
                <AvatarImage
                  src={legend?.ImgAssets?.icon}
                  alt={legend?.LegendName}
                />
                <AvatarFallback className="text-3xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {data.global.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 drop-shadow-md">
                  {data.global.name}
                </h3>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Level {data.global.level} • {data.global.platform}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatItem
              icon={
                <img
                  src={rank?.rankImg}
                  alt={rank?.rankName}
                  className="h-10 w-10"
                />
              }
              label="Current Rank"
              value={`${rank?.rankName} ${rank?.rankDiv}`}
            />
            <StatItem
              icon={<BarChart className="h-10 w-10" />}
              label="Rank Score"
              value={`${rank?.rankScore.toLocaleString()} LP`}
            />
            {legend && (
              <StatItem
                icon={<Swords className="h-10 w-10" />}
                label={`${legend.LegendName} Kills`}
                value={legendKills.toLocaleString()}
              />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="text-center h-80 flex flex-col justify-center items-center text-slate-400 dark:text-slate-500">
        <Search className="h-16 w-16 mb-4" />
        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
          Search for a Player
        </h3>
        <p className="text-sm">Enter a name and platform to see their stats.</p>
      </div>
    );
  };

  return (
    <Card className="bg-slate-100/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-green-500" />
          Player Stat Tracker
        </CardTitle>
        <CardDescription>
          Find real-time stats for any Apex Legends player.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end"
          >
            <FormField
              control={form.control}
              name="playerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., iiTzTimmy" {...field} />
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full md:w-[150px]">
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
            <Button
              type="submit"
              disabled={isPending}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </form>
        </Form>

        <div className="mt-6">{renderContent()}</div>
      </CardContent>
    </Card>
  );
};
