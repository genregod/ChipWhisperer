import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Monitor, AlertTriangle, CheckCircle, Settings } from "lucide-react";
import { useSerial } from "@/hooks/use-serial";
import { useWebSocket } from "@/hooks/use-websocket";
import { cn } from "@/lib/utils";

interface ConsoleMessage {
  id: string;
  type: "input" | "output" | "info" | "error" | "warning";
  text: string;
  timestamp: Date;
}

export default function SerialConsole() {
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [echoCommands, setEchoCommands] = useState(true);
  const [baudRate, setBaudRate] = useState("115200");
  const [dataBits, setDataBits] = useState("8");
  const [parity, setParity] = useState("none");
  const [stopBits, setStopBits] = useState("1");
  const [dataFormat, setDataFormat] = useState("ascii");
  const [showConnectionHelp, setShowConnectionHelp] = useState(false);
  
  const consoleRef = useRef<HTMLDivElement>(null);
  const { sendData, isConnected, isSupported } = useSerial();
  const { sendMessage } = useWebSocket();

  const addMessage = (type: ConsoleMessage["type"], text: string) => {
    const message: ConsoleMessage = {
      id: Date.now().toString(),
      type,
      text,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, message].slice(-1000)); // Keep last 1000 messages
  };

  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Listen for WebSocket messages
  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'serial_data') {
          addMessage("output", data.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleWebSocketMessage);
      return () => window.removeEventListener('message', handleWebSocketMessage);
    }
  }, []);

  const handleSendCommand = async () => {
    if (!command.trim() || !isConnected) return;

    if (echoCommands) {
      addMessage("input", `> ${command}`);
    }

    try {
      await sendData(command);
      
      // Send to WebSocket for broadcasting
      sendMessage({
        type: 'serial_data',
        data: command,
      });
      
      setCommand("");
    } catch (error) {
      addMessage("error", `Error sending command: ${error}`);
    }
  };

  const clearConsole = () => {
    setMessages([]);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const getMessageClass = (type: ConsoleMessage["type"]) => {
    switch (type) {
      case "input":
        return "text-white";
      case "output":
        return "text-hw-success";
      case "info":
        return "text-hw-primary";
      case "warning":
        return "text-hw-warning";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const quickCommands = [
    "AT+GMR",
    "AT+CWLAP", 
    "AT+RST",
    "ESP.restart()",
  ];

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col">
        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-hw-darker border-b border-gray-700 p-3">
            <Alert className="border-blue-600 bg-blue-900/20">
              <Monitor className="w-4 h-4" />
              <AlertDescription className="text-blue-400">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold mb-1">Serial Device Connection Required</div>
                    <div className="text-sm">Connect ESP32, Arduino, or other serial devices. Use the connection button in the top bar.</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConnectionHelp(!showConnectionHelp)}
                    className="text-blue-400 border-blue-400 hover:bg-blue-900/40"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
            
            {showConnectionHelp && (
              <div className="mt-3 p-3 bg-hw-code rounded border border-gray-600">
                <div className="text-sm text-gray-300 space-y-2">
                  <div className="font-semibold text-white">Connection Steps:</div>
                  <ol className="space-y-1 text-xs">
                    <li>1. Connect your serial device (ESP32, Arduino, etc.) to a USB port</li>
                    <li>2. Install drivers if needed (CP2102 for ESP32, CH340 for some Arduino clones)</li>
                    <li>3. Click "Connect" in the top bar</li>
                    <li>4. Select your device from the browser popup</li>
                    <li>5. Configure baud rate (usually 115200 for ESP32, 9600 for Arduino)</li>
                  </ol>
                  <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-600 rounded text-yellow-300">
                    <div className="text-xs">
                      <strong>Note:</strong> Devices don't appear automatically in dropdowns. 
                      Browser security requires explicit permission for each device.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {isConnected && (
          <div className="bg-hw-darker border-b border-gray-700 p-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Connected</span>
                <Badge className="bg-green-900/30 text-green-400 text-xs">
                  {baudRate} baud
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConnectionHelp(!showConnectionHelp)}
                className="text-gray-400 hover:text-white p-1"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Console Output */}
        <div
          ref={consoleRef}
          className="flex-1 bg-hw-code p-4 overflow-auto font-mono text-sm console-output"
        >
          <div className="space-y-1">
            {messages.length === 0 ? (
              <div className="text-gray-500">
                Console ready. Connect to a device to start receiving data.
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={cn("console-line", getMessageClass(message.type))}>
                  {showTimestamps && (
                    <span className="text-gray-400 mr-2">
                      [{formatTimestamp(message.timestamp)}]
                    </span>
                  )}
                  <span>{message.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Command Input */}
        <div className="bg-hw-darker border-t border-gray-700 p-3">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 font-mono">{'>'}</span>
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendCommand()}
              placeholder="Enter command..."
              className="flex-1 bg-hw-code border-gray-600 text-white font-mono text-sm"
              disabled={!isConnected}
            />
            <Button
              onClick={handleSendCommand}
              disabled={!isConnected || !command.trim()}
              className="bg-hw-primary hover:bg-hw-primary/80 px-4 py-2 text-sm"
            >
              Send
            </Button>
            <Button
              onClick={clearConsole}
              variant="outline"
              className="bg-gray-600 hover:bg-gray-500 px-3 py-2 text-sm border-gray-600"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="w-80 bg-hw-darker border-l border-gray-700 p-4">
        <h3 className="text-lg font-semibold mb-4">Serial Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Baud Rate</label>
            <Select value={baudRate} onValueChange={setBaudRate}>
              <SelectTrigger className="w-full bg-hw-code border-gray-600 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9600">9600</SelectItem>
                <SelectItem value="19200">19200</SelectItem>
                <SelectItem value="38400">38400</SelectItem>
                <SelectItem value="57600">57600</SelectItem>
                <SelectItem value="115200">115200</SelectItem>
                <SelectItem value="230400">230400</SelectItem>
                <SelectItem value="460800">460800</SelectItem>
                <SelectItem value="921600">921600</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Data Bits</label>
              <Select value={dataBits} onValueChange={setDataBits}>
                <SelectTrigger className="w-full bg-hw-code border-gray-600 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Parity</label>
              <Select value={parity} onValueChange={setParity}>
                <SelectTrigger className="w-full bg-hw-code border-gray-600 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="even">Even</SelectItem>
                  <SelectItem value="odd">Odd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Stop Bits</label>
              <Select value={stopBits} onValueChange={setStopBits}>
                <SelectTrigger className="w-full bg-hw-code border-gray-600 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-scroll"
                checked={autoScroll}
                onCheckedChange={(checked) => setAutoScroll(checked === true)}
              />
              <label htmlFor="auto-scroll" className="text-sm text-gray-300">
                Auto-scroll
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-timestamps"
                checked={showTimestamps}
                onCheckedChange={(checked) => setShowTimestamps(checked === true)}
              />
              <label htmlFor="show-timestamps" className="text-sm text-gray-300">
                Show timestamps
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="echo-commands"
                checked={echoCommands}
                onCheckedChange={(checked) => setEchoCommands(checked === true)}
              />
              <label htmlFor="echo-commands" className="text-sm text-gray-300">
                Echo local commands
              </label>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Quick Commands</h4>
            <div className="space-y-1">
              {quickCommands.map((cmd) => (
                <Button
                  key={cmd}
                  onClick={() => setCommand(cmd)}
                  variant="outline"
                  className="w-full text-left px-2 py-1 text-xs bg-hw-code hover:bg-gray-600 font-mono justify-start border-gray-600"
                >
                  {cmd}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Data Format</h4>
            <div className="flex space-x-2">
              <Button
                onClick={() => setDataFormat("ascii")}
                className={cn(
                  "flex-1 px-2 py-1 text-xs",
                  dataFormat === "ascii"
                    ? "bg-hw-primary text-white"
                    : "bg-gray-600 hover:bg-gray-500"
                )}
              >
                ASCII
              </Button>
              <Button
                onClick={() => setDataFormat("hex")}
                className={cn(
                  "flex-1 px-2 py-1 text-xs",
                  dataFormat === "hex"
                    ? "bg-hw-primary text-white"
                    : "bg-gray-600 hover:bg-gray-500"
                )}
              >
                HEX
              </Button>
              <Button
                onClick={() => setDataFormat("binary")}
                className={cn(
                  "flex-1 px-2 py-1 text-xs",
                  dataFormat === "binary"
                    ? "bg-hw-primary text-white"
                    : "bg-gray-600 hover:bg-gray-500"
                )}
              >
                Binary
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
