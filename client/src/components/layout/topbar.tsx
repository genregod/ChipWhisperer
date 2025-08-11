import { useState } from "react";
import { Plug, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSerial } from "@/hooks/use-serial";
import { cn } from "@/lib/utils";

export default function TopBar() {
  const { isConnected, availablePorts, connect, disconnect, connectionInfo } = useSerial();
  const [selectedPort, setSelectedPort] = useState<string>("");

  const handleConnect = async () => {
    if (isConnected) {
      await disconnect();
    } else if (selectedPort) {
      await connect(selectedPort);
    } else {
      // Request port selection if no specific port selected
      await connect();
    }
  };

  return (
    <div className="h-12 bg-hw-darker border-b border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Plug className="text-hw-primary w-4 h-4" />
          <span className="text-sm">Device Connection</span>
          <div className="flex items-center space-x-2 ml-4">
            <Select value={selectedPort} onValueChange={setSelectedPort}>
              <SelectTrigger className="w-48 bg-hw-code border-gray-600 text-white text-sm">
                <SelectValue placeholder="Select port..." />
              </SelectTrigger>
              <SelectContent>
                {availablePorts.map((port) => (
                  <SelectItem key={port.id} value={port.id}>
                    {port.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleConnect}
              className={cn(
                "px-3 py-1 text-xs",
                isConnected
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-hw-primary hover:bg-hw-primary/80"
              )}
            >
              {isConnected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-xs text-gray-400">
          {connectionInfo ? (
            <span>{connectionInfo}</span>
          ) : (
            <span>No active connection</span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
