import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useAskAI } from "../hooks/use-ask-ai";
import { type ChatHistoryItem } from "@/api";
import { type ChatMessage, useChatStore } from "@/store/chat-store";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Bot,
  Loader2,
  Send,
  Sparkles,
  BookCheck,
  Trash2,
  User,
} from "lucide-react";

const formSchema = z.object({
  message: z.string().min(1, { message: "Message cannot be empty." }),
});

export const AIChat = () => {
  const { messages, addMessage, clearMessages } = useChatStore();
  const { mutate, data, isPending, isError, error } = useAskAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const historyForApi: ChatHistoryItem[] = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: msg.parts,
    }));

    addMessage({
      role: "user",
      parts: [{ text: values.message }],
    });

    mutate({ message: values.message, history: historyForApi });
    form.reset();
  }

  useEffect(() => {
    if (data?.answer) {
      addMessage({
        role: "assistant",
        parts: [{ text: data.answer }],
        sources: data.sources,
      });
    }
  }, [data, addMessage]);

  useEffect(() => {
    if (isError && error) {
      addMessage({
        role: "assistant",
        parts: [
          {
            text: `An error occurred: ${error.message}. Please try again.`,
          },
        ],
      });
    }
  }, [isError, error, addMessage]);

  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  return (
    <Card className="h-[700px] flex flex-col bg-slate-50 dark:bg-slate-900 border-green-200/40">
      <CardHeader className="border-b border-green-200/40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-green-500 flex-shrink-0" />
            <div>
              <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Apex Intel
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Your AI guide to the Outlands.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearMessages}
            disabled={messages.length === 0}
            aria-label="Clear chat"
            className="hover:bg-red-500/10 cursor-pointer h-8 w-8"
          >
            <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-500" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {messages.length === 0 && !isPending && (
              <div className="text-center text-slate-500 pt-20">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-green-400/70 animate-pulse" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  Start a Conversation
                </h3>
                <p className="text-sm">
                  Ask anything about legends, weapons, or game lore!
                </p>
              </div>
            )}

            {messages.map((msg: ChatMessage, index: number) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <Avatar className="h-9 w-9 border-2 border-green-500/50">
                    <AvatarFallback className="bg-green-500 text-white">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div
                    className={cn(
                      "rounded-xl px-4 py-2",
                      msg.role === "user"
                        ? "bg-green-600 text-white rounded-br-none"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm"
                    )}
                  >
                    <p className="text-sm leading-relaxed">
                      {msg.parts?.[0]?.text}
                    </p>
                  </div>
                  {msg.role === "assistant" &&
                    msg.sources &&
                    msg.sources.length > 0 && (
                      <div className="text-xs text-slate-500 flex items-center gap-2 pl-2">
                        <BookCheck className="h-4 w-4" />
                        <strong>Sources:</strong>
                        <span className="truncate">
                          {[...new Set(msg.sources)].join(", ")}
                        </span>
                      </div>
                    )}
                </div>
                {msg.role === "user" && (
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isPending && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-9 w-9 border-2 border-green-500/50">
                  <AvatarFallback className="bg-green-500 text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-xl px-4 py-3 bg-white dark:bg-slate-800 shadow-sm rounded-bl-none flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-green-500 animate-spin" />
                  <span className="text-sm text-slate-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t border-green-200/40">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex gap-3 w-full"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input
                      placeholder="Ask about a legend, weapon, or game mechanic..."
                      {...field}
                      className="h-11 rounded-full bg-white dark:bg-slate-800 focus-visible:ring-green-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isPending}
              size="icon"
              className="h-11 w-11 flex-shrink-0 rounded-full bg-green-600 hover:bg-green-700 transition-transform duration-200 ease-in-out hover:scale-110"
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
};
