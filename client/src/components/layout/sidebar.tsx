import { Microchip, Terminal, MemoryStick, Database, Bot, Settings, Zap, Usb } from "lucide-react";
import { TabType } from "@/pages/home";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { data: connections } = useQuery({
    queryKey: ["/api/connections"],
    refetchInterval: 5000,
  });

  const recentConnections = Array.isArray(connections) ? connections.slice(0, 3) : [];

  const navItems = [
    { id: "serial" as TabType, label: "Serial Console", icon: Terminal },
    { id: "spi" as TabType, label: "SPI Flasher", icon: MemoryStick },
    { id: "database" as TabType, label: "Chip Database", icon: Database },
    { id: "ai" as TabType, label: "AI Research", icon: Bot },
    { id: "settings" as TabType, label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-hw-darker border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-hw-primary rounded flex items-center justify-center">
            <Microchip className="text-white w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">HardwareDebugger</h1>
            <p className="text-xs text-gray-400">Pro v2.1.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                  isActive
                    ? "bg-hw-primary text-white"
                    : "text-gray-300 hover:bg-gray-800"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="ml-3">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Recent Devices */}
        <div className="mt-6">
          <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Recent Devices
          </h3>
          <div className="mt-2 space-y-1">
            {recentConnections.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500">
                No recent connections
              </div>
            ) : (
              recentConnections.map((connection: any) => (
                <div
                  key={connection.id}
                  className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-2",
                      connection.status === 'success' ? "bg-hw-success" : "bg-gray-500"
                    )} />
                    <span className="font-mono text-xs truncate">
                      {connection.deviceName}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </nav>

      {/* Status Bar */}
      <div className="p-3 border-t border-gray-700 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>WebSerial: Ready</span>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-hw-success rounded-full mr-1" />
            <span>Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
