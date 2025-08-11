import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import SerialConsole from "@/components/tabs/serial-console";
import SpiFlasher from "@/components/tabs/spi-flasher";
import ChipDatabase from "@/components/tabs/chip-database";
import AiResearch from "@/components/tabs/ai-research";
import Settings from "@/components/tabs/settings";

export type TabType = "serial" | "spi" | "database" | "ai" | "settings";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("serial");

  const renderTabContent = () => {
    switch (activeTab) {
      case "serial":
        return <SerialConsole />;
      case "spi":
        return <SpiFlasher />;
      case "database":
        return <ChipDatabase />;
      case "ai":
        return <AiResearch />;
      case "settings":
        return <Settings />;
      default:
        return <SerialConsole />;
    }
  };

  return (
    <div className="flex h-screen bg-hw-dark text-white overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 overflow-hidden">
          <div className="tab-content h-full">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
