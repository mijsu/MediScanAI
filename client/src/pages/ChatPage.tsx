import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sendChatMessage } from "@/lib/api";
import { Link } from "wouter";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickSuggestions = [
  "What does high cholesterol mean?",
  "How can I lower my blood pressure?",
  "Explain my CBC results",
  "What is a healthy glucose level?",
  "How to improve sleep quality?",
  "Best foods for heart health",
];

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary-50/20 dark:to-primary-950/10">
        <Card className="max-w-md backdrop-blur-sm bg-card/95 border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
              <MessageSquare className="h-10 w-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Sign In Required</CardTitle>
              <CardDescription className="mt-2">
                Chat with your AI health assistant
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/signin">
              <Button size="lg" className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-md" data-testid="button-sign-in-chat">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      if (!user) {
        throw new Error("You must be signed in to use chat");
      }

      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage(textToSend, conversationHistory, user.uid);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.message,
        timestamp: new Date(response.data.timestamp),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your message. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary-50/10 dark:to-primary-950/5 flex flex-col">
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col p-4 md:p-6 lg:p-8 gap-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            AI Health Assistant
          </h1>
          <p className="text-muted-foreground">
            Ask questions about your health, lab results, and medical conditions
          </p>
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col overflow-hidden backdrop-blur-sm bg-card/50 border-border/50 min-h-0">
          {/* Messages Area */}
          <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/10 to-primary-600/10 border border-primary-500/20">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Start a Conversation</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  I'm here to help you understand your health data and answer medical questions
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                  {quickSuggestions.map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover-elevate active-elevate-2 px-4 py-2 text-sm border-border/50 bg-card/50"
                      onClick={() => handleSuggestionClick(suggestion)}
                      data-testid={`suggestion-${suggestion.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-10 w-10 shrink-0 border-2 border-primary-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 max-w-[80%] md:max-w-[70%] ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/30"
                      : "bg-muted/50 border border-border/50 backdrop-blur-sm"
                  }`}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-2 ${message.role === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.role === "user" && (
                  <Avatar className="h-10 w-10 shrink-0 border-2 border-border/50">
                    <AvatarFallback className="bg-muted">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-10 w-10 shrink-0 border-2 border-primary-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-3 bg-muted/50 border border-border/50 backdrop-blur-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          <div className="border-t border-border/50 p-4 bg-card/30 backdrop-blur-sm">
            {messages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {quickSuggestions.slice(0, 3).map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover-elevate active-elevate-2 text-xs px-3 py-1.5 border-border/50"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a health question..."
                disabled={isTyping}
                data-testid="input-chat-message"
                className="flex-1 bg-background/50 border-border/50 focus-visible:ring-primary-500"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-md"
                data-testid="button-send-message"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              AI responses are for informational purposes only. Always consult healthcare professionals.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
