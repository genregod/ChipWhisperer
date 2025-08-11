import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Search, Download, Upload, Eraser, Check, FolderOpen } from "lucide-react";
import { useWebUSB } from "@/lib/webusb";
import { useToast } from "@/hooks/use-toast";

interface DetectedChip {
  manufacturerId: string;
  deviceId: string;
  name: string;
  capacity: string;
  blockSize: string;
  pageSize: string;
}

export default function SpiFlasher() {
  const [detectedChip, setDetectedChip] = useState<DetectedChip | null>(null);
  const [firmwareFile, setFirmwareFile] = useState<File | null>(null);
  const [startAddress, setStartAddress] = useState("0x0000");
  const [length, setLength] = useState("0x80000");
  const [progress, setProgress] = useState(0);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [operationLog, setOperationLog] = useState<string[]>([]);
  const [hexData, setHexData] = useState<string>("");
  const [hexViewMode, setHexViewMode] = useState<"hex" | "ascii" | "disasm">("hex");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isSupported, connect, disconnect, isConnected, detectChip, readData, writeData, eraseChip } = useWebUSB();
  const { toast } = useToast();

  const handleDetectChip = async () => {
    if (!isConnected) {
      try {
        await connect();
      } catch (error) {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to USB device. Make sure CH341A is connected.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsOperationInProgress(true);
      addLogEntry("Detecting chip...");
      
      const chipInfo = await detectChip();
      setDetectedChip(chipInfo);
      addLogEntry(`Chip detected: ${chipInfo.name}`);
      
      toast({
        title: "Chip Detected",
        description: `Successfully detected ${chipInfo.name}`,
      });
    } catch (error) {
      addLogEntry(`Detection failed: ${error}`);
      toast({
        title: "Detection Failed",
        description: "Failed to detect chip. Check connections.",
        variant: "destructive",
      });
    } finally {
      setIsOperationInProgress(false);
    }
  };

  const handleReadChip = async () => {
    if (!detectedChip) {
      toast({
        title: "No Chip Detected",
        description: "Please detect a chip first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsOperationInProgress(true);
      setProgress(0);
      addLogEntry("Reading chip...");
      
      const data = await readData(parseInt(startAddress, 16), parseInt(length, 16), (p) => {
        setProgress(p);
      });
      
      setHexData(data);
      addLogEntry(`Read completed: ${data.length} bytes`);
      
      toast({
        title: "Read Complete",
        description: `Successfully read ${data.length} bytes from chip`,
      });
    } catch (error) {
      addLogEntry(`Read failed: ${error}`);
      toast({
        title: "Read Failed",
        description: "Failed to read from chip.",
        variant: "destructive",
      });
    } finally {
      setIsOperationInProgress(false);
      setProgress(0);
    }
  };

  const handleWriteChip = async () => {
    if (!detectedChip || !firmwareFile) {
      toast({
        title: "Missing Requirements",
        description: "Please detect a chip and select a firmware file first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsOperationInProgress(true);
      setProgress(0);
      addLogEntry("Writing firmware...");
      
      const fileData = await firmwareFile.arrayBuffer();
      await writeData(parseInt(startAddress, 16), new Uint8Array(fileData), (p) => {
        setProgress(p);
      });
      
      addLogEntry(`Write completed: ${fileData.byteLength} bytes`);
      
      toast({
        title: "Write Complete",
        description: `Successfully wrote ${fileData.byteLength} bytes to chip`,
      });
    } catch (error) {
      addLogEntry(`Write failed: ${error}`);
      toast({
        title: "Write Failed",
        description: "Failed to write to chip.",
        variant: "destructive",
      });
    } finally {
      setIsOperationInProgress(false);
      setProgress(0);
    }
  };

  const handleEraseChip = async () => {
    if (!detectedChip) {
      toast({
        title: "No Chip Detected",
        description: "Please detect a chip first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsOperationInProgress(true);
      setProgress(0);
      addLogEntry("Erasing chip...");
      
      await eraseChip((p) => {
        setProgress(p);
      });
      
      addLogEntry("Erase completed");
      
      toast({
        title: "Erase Complete",
        description: "Successfully erased chip",
      });
    } catch (error) {
      addLogEntry(`Erase failed: ${error}`);
      toast({
        title: "Erase Failed",
        description: "Failed to erase chip.",
        variant: "destructive",
      });
    } finally {
      setIsOperationInProgress(false);
      setProgress(0);
    }
  };

  const handleVerifyChip = async () => {
    if (!detectedChip || !firmwareFile) {
      toast({
        title: "Missing Requirements",
        description: "Please detect a chip and select a firmware file first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsOperationInProgress(true);
      setProgress(0);
      addLogEntry("Verifying firmware...");
      
      const fileData = await firmwareFile.arrayBuffer();
      const chipData = await readData(parseInt(startAddress, 16), fileData.byteLength, (p) => {
        setProgress(p * 0.5); // Verification is read + compare
      });
      
      const fileArray = new Uint8Array(fileData);
      const chipArray = new Uint8Array(chipData.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
      
      let matches = true;
      for (let i = 0; i < fileArray.length; i++) {
        if (fileArray[i] !== chipArray[i]) {
          matches = false;
          addLogEntry(`Verification failed at offset 0x${i.toString(16).toUpperCase()}`);
          break;
        }
        if (i % 1000 === 0) {
          setProgress(50 + (i / fileArray.length) * 50);
        }
      }
      
      if (matches) {
        addLogEntry("Verification successful");
        toast({
          title: "Verification Successful",
          description: "Firmware matches chip contents",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "Firmware does not match chip contents",
          variant: "destructive",
        });
      }
    } catch (error) {
      addLogEntry(`Verification failed: ${error}`);
      toast({
        title: "Verification Failed",
        description: "Failed to verify chip contents.",
        variant: "destructive",
      });
    } finally {
      setIsOperationInProgress(false);
      setProgress(0);
    }
  };

  const addLogEntry = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setOperationLog(prev => [...prev, `[${timestamp}] ${message}`].slice(-50));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFirmwareFile(file);
      setLength(`0x${file.size.toString(16).toUpperCase()}`);
    }
  };

  const formatHexData = (data: string): string => {
    if (!data) return "";
    
    const lines: string[] = [];
    for (let i = 0; i < data.length; i += 32) {
      const address = (i / 2).toString(16).toUpperCase().padStart(8, '0');
      const hexChunk = data.substr(i, 32);
      const hexFormatted = hexChunk.match(/.{1,2}/g)?.join(' ') || '';
      const asciiChunk = hexChunk.match(/.{1,2}/g)?.map(byte => {
        const char = String.fromCharCode(parseInt(byte, 16));
        return char >= ' ' && char <= '~' ? char : '.';
      }).join('') || '';
      
      lines.push(`${address}: ${hexFormatted.padEnd(47)} ${asciiChunk}`);
    }
    return lines.join('\n');
  };

  if (!isSupported) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="bg-hw-darker border-gray-700">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">WebUSB Not Supported</h3>
            <p className="text-gray-400 mb-4">
              Your browser doesn't support WebUSB API. Please use Chrome or Edge.
            </p>
            <p className="text-sm text-gray-500">
              Alternatively, you can use external programming tools.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <div className="grid grid-cols-2 gap-6 h-full">
        {/* Chip Detection & Info */}
        <Card className="bg-hw-darker border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Chip Detection</CardTitle>
              <Button
                onClick={handleDetectChip}
                disabled={isOperationInProgress}
                className="bg-hw-primary hover:bg-hw-primary/80"
              >
                <Search className="w-4 h-4 mr-2" />
                Detect
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {detectedChip ? (
              <div className="space-y-3">
                <div className="bg-hw-code rounded p-3">
                  <div className="text-sm font-medium mb-2">Detected Chip</div>
                  <div className="font-mono text-xs space-y-1">
                    <div>
                      <span className="text-gray-400">Manufacturer ID:</span>{" "}
                      <span className="text-hw-success">0x{detectedChip.manufacturerId}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Device ID:</span>{" "}
                      <span className="text-hw-success">0x{detectedChip.deviceId}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Chip Name:</span>{" "}
                      <span className="text-white">{detectedChip.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Capacity:</span>{" "}
                      <span className="text-white">{detectedChip.capacity}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Block Size:</span>{" "}
                      <span className="text-white">{detectedChip.blockSize}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Page Size:</span>{" "}
                      <span className="text-white">{detectedChip.pageSize}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleReadChip}
                    disabled={isOperationInProgress}
                    className="bg-hw-success hover:bg-hw-success/80"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Read
                  </Button>
                  <Button
                    onClick={handleWriteChip}
                    disabled={isOperationInProgress || !firmwareFile}
                    className="bg-hw-secondary hover:bg-hw-secondary/80"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Write
                  </Button>
                  <Button
                    onClick={handleEraseChip}
                    disabled={isOperationInProgress}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Eraser className="w-4 h-4 mr-1" />
                    Erase
                  </Button>
                  <Button
                    onClick={handleVerifyChip}
                    disabled={isOperationInProgress || !firmwareFile}
                    className="bg-hw-warning hover:bg-hw-warning/80 text-black"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Verify
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Click "Detect" to identify the connected chip
              </div>
            )}
          </CardContent>
        </Card>

        {/* Firmware Operations */}
        <Card className="bg-hw-darker border-gray-700">
          <CardHeader>
            <CardTitle>Firmware Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Firmware File
                </label>
                <div className="flex">
                  <div
                    className="flex-1 bg-hw-code border border-gray-600 text-left px-3 py-2 rounded-l text-sm cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className={firmwareFile ? "text-white" : "text-gray-400"}>
                      {firmwareFile ? `${firmwareFile.name} (${(firmwareFile.size / 1024).toFixed(1)}KB)` : "Select firmware file..."}
                    </span>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded-r rounded-l-none"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".bin,.hex,.fw"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Start Address
                  </label>
                  <Input
                    value={startAddress}
                    onChange={(e) => setStartAddress(e.target.value)}
                    className="w-full bg-hw-code border-gray-600 text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Length
                  </label>
                  <Input
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full bg-hw-code border-gray-600 text-white font-mono text-sm"
                  />
                </div>
              </div>

              {isOperationInProgress && (
                <div className="bg-hw-code rounded p-3">
                  <div className="text-sm font-medium mb-2">Progress</div>
                  <Progress value={progress} className="mb-2" />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Operation in progress...</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                </div>
              )}

              {operationLog.length > 0 && (
                <div className="bg-hw-code rounded p-3 max-h-32 overflow-auto">
                  <div className="text-xs text-gray-400 space-y-1 font-mono">
                    {operationLog.map((entry, index) => (
                      <div key={index}>{entry}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hex Viewer */}
        <Card className="bg-hw-darker border-gray-700 col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hex Viewer</CardTitle>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setHexViewMode("ascii")}
                  variant={hexViewMode === "ascii" ? "default" : "outline"}
                  className="px-3 py-1 text-xs"
                >
                  ASCII
                </Button>
                <Button
                  onClick={() => setHexViewMode("hex")}
                  variant={hexViewMode === "hex" ? "default" : "outline"}
                  className="px-3 py-1 text-xs"
                >
                  HEX
                </Button>
                <Button
                  onClick={() => setHexViewMode("disasm")}
                  variant={hexViewMode === "disasm" ? "outline" : "outline"}
                  className="px-3 py-1 text-xs"
                  disabled
                >
                  Disasm
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-hw-code rounded p-3 h-64 overflow-auto font-mono text-xs hex-viewer">
              {hexData ? (
                <pre className="whitespace-pre-wrap">
                  {formatHexData(hexData)}
                </pre>
              ) : (
                <div className="text-gray-500 text-center pt-20">
                  No data loaded. Read from chip to view contents.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
