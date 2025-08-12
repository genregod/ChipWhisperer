import { useState } from "react";
import { Plug, HelpCircle, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSerial } from "@/hooks/use-serial";
import { cn } from "@/lib/utils";

export default function TopBar() {
  const { isConnected, availablePorts, connect, disconnect, connectionInfo, isSupported } = useSerial();
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleConnect = async () => {
    if (isConnected) {
      await disconnect();
      setSelectedPort("");
    } else {
      setIsConnecting(true);
      try {
        if (selectedPort) {
          await connect(selectedPort);
        } else {
          // Request port selection if no specific port selected
          await connect();
        }
      } catch (error) {
        console.error('Connection failed:', error);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const handleRefreshPorts = () => {
    // Force a refresh of available ports
    window.location.reload();
  };

  const getConnectionStatus = () => {
    if (isConnected) {
      return { icon: CheckCircle, color: "text-green-400", text: "Connected" };
    } else if (isConnecting) {
      return { icon: RefreshCw, color: "text-yellow-400", text: "Connecting..." };
    } else {
      return { icon: Plug, color: "text-gray-400", text: "Disconnected" };
    }
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <TooltipProvider>
      <div className="h-12 bg-hw-darker border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <StatusIcon className={cn("w-4 h-4", status.color, isConnecting && "animate-spin")} />
            <span className="text-sm font-medium">Device Connection</span>
            
            {!isSupported && (
              <Badge className="bg-red-600 text-white text-xs">
                Not Supported
              </Badge>
            )}
            
            <div className="flex items-center space-x-2 ml-4">
              <div className="relative">
                <Select value={selectedPort} onValueChange={setSelectedPort} disabled={isConnected || !isSupported}>
                  <SelectTrigger className="w-48 bg-hw-code border-gray-600 text-white text-sm">
                    <SelectValue 
                      placeholder={
                        !isSupported 
                          ? "Browser not supported" 
                          : availablePorts.length === 0 
                            ? "No authorized ports" 
                            : "Select port..."
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePorts.length === 0 ? (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        <div className="mb-2">No ports available</div>
                        <div className="text-xs text-gray-600">
                          Click Connect to authorize a device
                        </div>
                      </div>
                    ) : (
                      availablePorts.map((port) => (
                        <SelectItem key={port.id} value={port.id}>
                          {port.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {!isSupported && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="absolute -top-1 -right-1 w-3 h-3 text-red-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">WebSerial API not supported in this browser</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              
              <Button
                onClick={handleConnect}
                disabled={!isSupported || isConnecting}
                className={cn(
                  "px-3 py-1 text-xs",
                  isConnected
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-hw-primary hover:bg-hw-primary/80"
                )}
              >
                {isConnecting ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
              </Button>
              
              {!isConnected && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshPorts}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Refresh port list</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-xs text-gray-400">
            {connectionInfo ? (
              <span className="text-green-400">{connectionInfo}</span>
            ) : (
              <span>No active connection</span>
            )}
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white"
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Connection help and troubleshooting</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Connection Help Alert */}
        {showHelp && (
          <div className="absolute top-12 left-4 right-4 z-50">
            <Alert className="bg-hw-darker border-hw-primary">
              <HelpCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <div className="font-semibold">Connection Tips:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Browser Permission:</strong> Devices don't appear automatically. Click "Connect" to grant access.</li>
                    <li>• <strong>Serial Devices:</strong> ESP32, Arduino, etc. use Serial Console tab</li>
                    <li>• <strong>USB Programmers:</strong> CH341A devices use SPI Flasher tab</li>
                    <li>• <strong>Drivers:</strong> Install CH341SER (CH341A) or CP2102 (ESP32) drivers if needed</li>
                  </ul>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowHelp(false)}
                    className="mt-2"
                  >
                    Got it
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
