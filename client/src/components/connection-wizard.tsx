import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, HelpCircle, Plug, Usb, Monitor, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSerial } from "@/hooks/use-serial";
import { useWebUSB } from "@/lib/webusb";

interface DeviceInfo {
  name: string;
  type: "serial" | "usb";
  interface: string;
  description: string;
  tab: string;
  instructions: string[];
  compatibility: {
    chrome: boolean;
    firefox: boolean;
    safari: boolean;
  };
}

const DEVICE_CATALOG: DeviceInfo[] = [
  {
    name: "CH341A Programmer",
    type: "usb",
    interface: "WebUSB",
    description: "SPI flash memory programmer for EEPROM/flash chips",
    tab: "SPI Flasher",
    instructions: [
      "Connect CH341A programmer to your computer via USB",
      "Ensure drivers are installed (Windows may require CH341SER driver)",
      "Click 'Connect' in the SPI Flasher tab",
      "Select your CH341A device when prompted"
    ],
    compatibility: { chrome: true, firefox: false, safari: false }
  },
  {
    name: "ESP32/ESP8266",
    type: "serial",
    interface: "WebSerial",
    description: "Microcontroller development boards with UART/Serial interface",
    tab: "Serial Console",
    instructions: [
      "Connect your ESP32/ESP8266 to USB port",
      "Install CP2102/CH340 drivers if needed",
      "Open Serial Console tab",
      "Click 'Connect' and select your device port",
      "Choose appropriate baud rate (usually 115200)"
    ],
    compatibility: { chrome: true, firefox: false, safari: false }
  },
  {
    name: "Arduino Boards",
    type: "serial",
    interface: "WebSerial",
    description: "Arduino Uno, Nano, Pro Mini, etc. with USB-to-Serial converter",
    tab: "Serial Console",
    instructions: [
      "Connect Arduino board via USB cable",
      "Install Arduino IDE drivers if needed",
      "Open Serial Console tab",
      "Click 'Connect' and select Arduino port",
      "Set baud rate to match your sketch (default 9600)"
    ],
    compatibility: { chrome: true, firefox: false, safari: false }
  },
  {
    name: "Generic Serial Device",
    type: "serial",
    interface: "WebSerial",
    description: "Any device with UART/RS232 serial communication",
    tab: "Serial Console",
    instructions: [
      "Connect device to computer via USB-to-Serial adapter",
      "Install necessary drivers for your adapter",
      "Open Serial Console tab",
      "Click 'Connect' and select the correct port",
      "Configure baud rate and serial parameters"
    ],
    compatibility: { chrome: true, firefox: false, safari: false }
  }
];

export default function ConnectionWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [browserInfo, setBrowserInfo] = useState<{
    name: string;
    supported: boolean;
    webSerial: boolean;
    webUSB: boolean;
  } | null>(null);

  const { isSupported: serialSupported } = useSerial();
  const { isSupported: usbSupported } = useWebUSB();

  useEffect(() => {
    // Detect browser and capabilities
    const userAgent = navigator.userAgent;
    let browserName = "Unknown";
    let supported = false;
    
    if (userAgent.includes("Chrome")) {
      browserName = "Chrome";
      supported = true;
    } else if (userAgent.includes("Edg")) {
      browserName = "Edge";
      supported = true;
    } else if (userAgent.includes("Firefox")) {
      browserName = "Firefox";
      supported = false;
    } else if (userAgent.includes("Safari")) {
      browserName = "Safari";
      supported = false;
    }

    setBrowserInfo({
      name: browserName,
      supported,
      webSerial: serialSupported,
      webUSB: usbSupported
    });
  }, [serialSupported, usbSupported]);

  const getBrowserBadge = () => {
    if (!browserInfo) return null;
    
    return (
      <Badge 
        variant={browserInfo.supported ? "default" : "destructive"}
        className="ml-2"
      >
        {browserInfo.name} {browserInfo.supported ? "✓" : "✗"}
      </Badge>
    );
  };

  const getInterfaceBadge = (type: "serial" | "usb") => {
    const supported = type === "serial" ? serialSupported : usbSupported;
    return (
      <Badge 
        variant={supported ? "default" : "secondary"}
        className="text-xs"
      >
        {type === "serial" ? "WebSerial" : "WebUSB"} {supported ? "✓" : "✗"}
      </Badge>
    );
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-hw-darker border-hw-primary text-hw-primary hover:bg-hw-primary hover:text-white"
      >
        <HelpCircle className="w-4 h-4 mr-2" />
        Connection Help
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-hw-darker border-gray-700">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white flex items-center">
                <Plug className="w-5 h-5 mr-2 text-hw-primary" />
                Device Connection Guide
                {getBrowserBadge()}
              </CardTitle>
              <CardDescription className="text-gray-400">
                Learn how to connect your hardware devices and troubleshoot connection issues
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Browser Compatibility Alert */}
          {browserInfo && !browserInfo.supported && (
            <Alert className="mb-6 border-red-600 bg-red-900/20">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-red-400">
                <strong>Browser Not Supported:</strong> {browserInfo.name} doesn't support WebUSB/WebSerial APIs. 
                Please use Chrome, Edge, or another Chromium-based browser for hardware connectivity.
              </AlertDescription>
            </Alert>
          )}

          {/* API Status */}
          <div className="mb-6 p-4 bg-hw-code rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-white mb-3">Browser API Support</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">WebSerial (UART/Serial devices)</span>
                {getInterfaceBadge("serial")}
              </div>
              <div className="flex items-center gap-2">
                <Usb className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">WebUSB (CH341A programmers)</span>
                {getInterfaceBadge("usb")}
              </div>
            </div>
            {(!serialSupported || !usbSupported) && (
              <p className="text-xs text-gray-500 mt-2">
                Some features may be limited due to browser API restrictions.
              </p>
            )}
          </div>

          {/* Device Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Select Your Device Type</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEVICE_CATALOG.map((device, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer border transition-all ${
                    selectedDevice === device 
                      ? "border-hw-primary bg-hw-primary/10" 
                      : "border-gray-700 hover:border-gray-600 bg-hw-code"
                  }`}
                  onClick={() => setSelectedDevice(device)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-white">{device.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {device.type === "serial" ? (
                          <Monitor className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Usb className="w-4 h-4 text-gray-400" />
                        )}
                        {getInterfaceBadge(device.type)}
                      </div>
                    </div>
                    <CardDescription className="text-xs text-gray-400">
                      {device.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Use in: <strong>{device.tab}</strong> tab</span>
                      <Badge 
                        variant={browserInfo && device.compatibility[browserInfo.name.toLowerCase() as keyof typeof device.compatibility] ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {browserInfo && device.compatibility[browserInfo.name.toLowerCase() as keyof typeof device.compatibility] ? "Compatible" : "Limited"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Device Instructions */}
            {selectedDevice && (
              <Card className="mt-6 bg-hw-code border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                    Connection Instructions for {selectedDevice.name}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Follow these steps to connect your {selectedDevice.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="border-blue-600 bg-blue-900/20">
                      <HelpCircle className="w-4 h-4" />
                      <AlertDescription className="text-blue-400">
                        <strong>Important:</strong> Browser security requires you to manually grant permission for each device. 
                        Devices won't appear in dropdowns until you've explicitly authorized them.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Step-by-step Instructions:</h4>
                      <ol className="space-y-2 text-sm text-gray-300">
                        {selectedDevice.instructions.map((instruction, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-hw-primary text-white text-xs rounded-full flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <Separator className="bg-gray-700" />

                    <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-yellow-400 mb-2">Troubleshooting Tips:</h4>
                      <ul className="space-y-1 text-xs text-yellow-300">
                        <li>• If device doesn't appear: Check USB cable and try different port</li>
                        <li>• Driver issues: Install manufacturer drivers (CH341SER for CH341A, CP2102 for ESP32)</li>
                        <li>• Permission denied: Click "Connect" button first, then select device from browser popup</li>
                        <li>• Connection drops: Check USB power, avoid USB hubs if possible</li>
                        {selectedDevice.type === "serial" && (
                          <li>• Wrong baud rate: Common rates are 9600, 115200, 230400</li>
                        )}
                      </ul>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        onClick={() => setIsOpen(false)}
                        className="bg-hw-primary hover:bg-hw-primary/80 text-white"
                      >
                        Got it, let's connect!
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
