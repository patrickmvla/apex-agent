import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAskAI } from "../hooks/use-ask-ai";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils"; // Assuming you have a utility for classnames
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";

// Define the structure of a chat message
interface Message {
  role: "user" | "assistant";
  content: string;
}

// Define the validation schema for our chat input form
const formSchema = z.object({
  message: z.string().min(1, { message: "Message cannot be empty." }),
});

export const AIChat = () => {
  // State to hold the conversation history
  const [messages, setMessages] = useState<Message[]>([]);
  const { mutate, data, isPending, isError, error } = useAskAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Add user's message to the chat history
    setMessages((prev) => [...prev, { role: "user", content: values.message }]);
    // Call the AI
    mutate(values.message);
    form.reset();
  }
  
  // Effect to handle AI's response
  useEffect(() => {
    if (data?.response) {
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    }
  }, [data]);

  // Effect to handle errors
  useEffect(() => {
    if (isError && error) {
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${error.message}` }]);
    }
  }, [isError, error]);


  // Effect to auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Card className="h-[600px] flex flex-col bg-card/50">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary"/>
            AI Assistant
        </CardTitle>
        <CardDescription>Your go-to source for Apex Legends knowledge.</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Empty State */}
            {messages.length === 0 && !isPending && (
                <div className="text-center text-muted-foreground pt-16">
                    <Sparkles className="h-10 w-10 mx-auto mb-4 animate-pulse"/>
                    <h3 className="text-lg font-semibold">Start a Conversation</h3>
                    <p className="text-sm">Ask me anything about legends, weapons, or game lore!</p>
                </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, index) => (
              <div key={index} className={cn("flex items-end gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                    "rounded-2xl px-4 py-2 max-w-[80%] whitespace-pre-wrap", 
                    msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                        : 'bg-muted rounded-bl-none'
                )}>
                    <p className="text-sm">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isPending && (
              <div className="flex items-end gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl px-4 py-3 bg-muted rounded-bl-none flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
              </div>
            )}
            {/* Empty div to act as a scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 w-full">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder="Ask about a legend, weapon, or game mechanic..." {...field} className="h-10"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} size="icon" className="h-10 w-10 flex-shrink-0">
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
};
