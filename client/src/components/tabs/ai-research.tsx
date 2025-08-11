import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Bot, Send, Lightbulb } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  chipContext?: any;
}

export default function AiResearch() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: recentQueries = [] } = useQuery({
    queryKey: ["/api/ai/queries"],
    refetchInterval: false,
  });

  const identifyChipMutation = useMutation({
    mutationFn: (data: { manufacturerId: string; deviceId: string }) =>
      apiRequest("POST", "/api/ai/identify", data),
    onSuccess: (response: any) => {
      const result = response.json ? response.json() : response;
      
      addMessage("assistant", formatChipIdentification(result), result);
      queryClient.invalidateQueries({ queryKey: ["/api/ai/queries"] });
      
      toast({
        title: "Chip Identified",
        description: `Successfully identified ${result.manufacturer} ${result.partNumber}`,
      });
    },
    onError: () => {
      toast({
        title: "Identification Failed",
        description: "Failed to identify chip. Please check your API key.",
        variant: "destructive",
      });
    },
  });

  const analyzeQueryMutation = useMutation({
    mutationFn: (data: { query: string; chipContext?: any }) =>
      apiRequest("POST", "/api/ai/analyze", data),
    onSuccess: (response: any) => {
      const result = response.json ? response.json() : response;
      addMessage("assistant", result.analysis);
      queryClient.invalidateQueries({ queryKey: ["/api/ai/queries"] });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze query. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addMessage = (type: ChatMessage["type"], content: string, chipContext?: any) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      chipContext,
    };
    setMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    addMessage("user", inputMessage);
    
    analyzeQueryMutation.mutate({
      query: inputMessage,
    });
    
    setInputMessage("");
  };

  const handleIdentifyChip = () => {
    if (!manufacturerId || !deviceId) {
      toast({
        title: "Missing Information",
        description: "Please provide both manufacturer and device IDs",
        variant: "destructive",
      });
      return;
    }

    addMessage("user", `Can you help me identify this flash memory chip? The manufacturer ID is 0x${manufacturerId} and device ID is 0x${deviceId}.`);
    
    identifyChipMutation.mutate({
      manufacturerId,
      deviceId,
    });
  };

  const formatChipIdentification = (result: any): string => {
    return `Based on the IDs you provided, this is a **${result.manufacturer} ${result.partNumber}** SPI flash memory chip.

**Chip Specifications:**
- Manufacturer: ${result.manufacturer} (0x${result.manufacturerId || 'N/A'})
- Part Number: ${result.partNumber}
- Capacity: ${result.capacity}
- Interface: ${result.interface}
- Package: ${result.packageType}
- Voltage: ${result.voltage}

**Key Features:**
${result.features.map((feature: string) => `- ${feature}`).join('\n')}

${result.programmingNotes ? `**Programming Notes:**\n${result.programmingNotes}` : ''}

💡 This chip is commonly used in microcontroller projects and can be programmed using your CH341A programmer.`;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    
    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const commonQueries = [
    "How to program BIOS chip?",
    "CH341A wiring diagram",
    "SPI flash pinout",
    "UART bridge setup",
  ];

  const recentIdentifications = Array.isArray(recentQueries) ? recentQueries
    .filter((query: any) => query.query.includes('Identify chip'))
    .slice(0, 3)
    .map((query: any) => {
      try {
        const response = JSON.parse(query.response);
        return {
          partNumber: response.partNumber || 'Unknown',
          manufacturer: response.manufacturer || 'Unknown',
          capacity: response.capacity || 'Unknown',
          interface: response.interface || 'Unknown',
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add initial message if no messages
  useEffect(() => {
    if (messages.length === 0) {
      addMessage("assistant", "👋 Welcome to AI Chipset Research! I can help you identify chips, explain pinouts, and suggest programming procedures. How can I assist you today?");
    }
  }, []);

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">AI Chipset Research</h2>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-400">Powered by</div>
            <Badge className="bg-hw-success text-white">OpenAI GPT-4o</Badge>
          </div>
        </div>

        <Card className="flex-1 bg-hw-darker border-gray-700 flex flex-col">
          {/* Chat Messages */}
          <CardContent className="flex-1 p-4 overflow-auto space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex space-x-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.type === "user" ? "bg-hw-primary" : "bg-hw-secondary"
                )}>
                  {message.type === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={cn(
                    "rounded-lg p-3",
                    message.type === "user" ? "bg-hw-code" : "bg-gray-800"
                  )}>
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content.split('\n').map((line, index) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return (
                            <div key={index} className="font-semibold mt-2 mb-1">
                              {line.slice(2, -2)}
                            </div>
                          );
                        }
                        if (line.startsWith('- ')) {
                          return (
                            <div key={index} className="ml-4">
                              {line}
                            </div>
                          );
                        }
                        if (line.includes('💡')) {
                          return (
                            <div key={index} className="mt-3 p-2 bg-hw-success bg-opacity-20 border border-hw-success border-opacity-30 rounded">
                              <p className="text-sm flex items-center">
                                <Lightbulb className="w-4 h-4 text-hw-success mr-2" />
                                {line.replace('💡 ', '')}
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div key={index} className={line.trim() ? "" : "h-2"}>
                            {line}
                          </div>
                        );
                      })}
                    </div>
                    
                    {message.chipContext && (
                      <div className="bg-hw-code rounded p-2 mt-3 text-xs font-mono">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-400">Confidence:</span>{' '}
                            <span className="text-hw-success">
                              {(message.chipContext.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          {message.chipContext.datasheet && (
                            <div>
                              <span className="text-gray-400">Datasheet:</span>{' '}
                              <a 
                                href={message.chipContext.datasheet}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-hw-primary hover:underline"
                              >
                                Available
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Chat Input */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex space-x-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Ask about chipsets, pinouts, programming procedures..."
                className="flex-1 bg-hw-code border-gray-600 text-white"
                disabled={analyzeQueryMutation.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || analyzeQueryMutation.isPending}
                className="bg-hw-primary hover:bg-hw-primary/80"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <div>AI can help identify chips, explain pinouts, and suggest programming procedures</div>
              <div>API usage: {Array.isArray(recentQueries) ? recentQueries.length : 0}/1000 requests today</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Research Panel */}
      <div className="w-80 bg-hw-darker p-4 border-l border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Quick Research</h3>
        
        <div className="space-y-4">
          <Card className="bg-hw-code border-gray-600">
            <CardHeader>
              <CardTitle className="text-sm">Chip Identifier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Mfg ID (EF)"
                    value={manufacturerId}
                    onChange={(e) => setManufacturerId(e.target.value)}
                    className="flex-1 bg-hw-darker border-gray-600 text-white font-mono text-sm"
                  />
                  <Input
                    placeholder="Dev ID (4018)"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="flex-1 bg-hw-darker border-gray-600 text-white font-mono text-sm"
                  />
                </div>
                <Button
                  onClick={handleIdentifyChip}
                  disabled={identifyChipMutation.isPending || !manufacturerId || !deviceId}
                  className="w-full bg-hw-primary hover:bg-hw-primary/80"
                >
                  Identify Chip
                </Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Common Queries</h4>
            <div className="space-y-1">
              {commonQueries.map((query) => (
                <Button
                  key={query}
                  onClick={() => setInputMessage(`"${query}"`)}
                  variant="outline"
                  className="w-full text-left px-2 py-2 text-xs bg-hw-code hover:bg-gray-600 border-gray-600 justify-start"
                >
                  "{query}"
                </Button>
              ))}
            </div>
          </div>

          {recentIdentifications.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Identifications</h4>
              <div className="space-y-2 text-xs">
                {recentIdentifications.map((chip: any, index) => (
                  <Card key={index} className="bg-hw-code border-gray-600">
                    <CardContent className="p-2">
                      <div className="font-mono text-hw-success font-medium">
                        {chip.partNumber}
                      </div>
                      <div className="text-gray-400">
                        {chip.manufacturer} • {chip.capacity} {chip.interface}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
