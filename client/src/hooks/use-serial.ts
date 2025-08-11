import { useState, useEffect, useCallback } from "react";
import { WebSerialAPI } from "@/lib/webserial";
import { useToast } from "@/hooks/use-toast";

export interface SerialPort {
  id: string;
  name: string;
}

export function useSerial() {
  const [isConnected, setIsConnected] = useState(false);
  const [availablePorts, setAvailablePorts] = useState<SerialPort[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<string | null>(null);
  const [serialAPI, setSerialAPI] = useState<WebSerialAPI | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const api = new WebSerialAPI();
    setSerialAPI(api);

    // Load available ports
    loadAvailablePorts();

    // Listen for connect/disconnect events
    const handleConnect = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsConnected(true);
      setConnectionInfo(customEvent.detail.info);
      toast({
        title: "Device Connected",
        description: `Successfully connected to ${customEvent.detail.info}`,
      });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionInfo(null);
      toast({
        title: "Device Disconnected",
        description: "Serial device has been disconnected",
      });
    };

    const handleData = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Data is handled by individual components
      console.log('Serial data received:', customEvent.detail.data);
    };

    const handleError = (event: Event) => {
      const customEvent = event as CustomEvent;
      toast({
        title: "Serial Error",
        description: customEvent.detail.error,
        variant: "destructive",
      });
    };

    if (api) {
      api.addEventListener('connect', handleConnect);
      api.addEventListener('disconnect', handleDisconnect);
      api.addEventListener('data', handleData);
      api.addEventListener('error', handleError);

      return () => {
        api.removeEventListener('connect', handleConnect);
        api.removeEventListener('disconnect', handleDisconnect);
        api.removeEventListener('data', handleData);
        api.removeEventListener('error', handleError);
      };
    }
  }, [toast]);

  const loadAvailablePorts = useCallback(async () => {
    if (!serialAPI) return;
    
    try {
      const ports = await serialAPI.getAvailablePorts();
      setAvailablePorts(ports);
    } catch (error) {
      console.error('Failed to load available ports:', error);
    }
  }, [serialAPI]);

  const connect = useCallback(async (portId?: string) => {
    if (!serialAPI) {
      toast({
        title: "WebSerial Not Available",
        description: "Your browser doesn't support WebSerial API",
        variant: "destructive",
      });
      return;
    }

    try {
      await serialAPI.connect(portId);
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect: ${error}`,
        variant: "destructive",
      });
    }
  }, [serialAPI, toast]);

  const disconnect = useCallback(async () => {
    if (!serialAPI) return;

    try {
      await serialAPI.disconnect();
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: `Failed to disconnect: ${error}`,
        variant: "destructive",
      });
    }
  }, [serialAPI, toast]);

  const sendData = useCallback(async (data: string) => {
    if (!serialAPI || !isConnected) {
      throw new Error("Not connected to serial device");
    }

    try {
      await serialAPI.write(data);
    } catch (error) {
      throw new Error(`Failed to send data: ${error}`);
    }
  }, [serialAPI, isConnected]);

  const configurePort = useCallback(async (options: {
    baudRate?: number;
    dataBits?: number;
    stopBits?: number;
    parity?: "none" | "even" | "odd";
    flowControl?: "none" | "hardware";
  }) => {
    if (!serialAPI) return;

    try {
      await serialAPI.configure(options);
      toast({
        title: "Port Configured",
        description: "Serial port configuration updated",
      });
    } catch (error) {
      toast({
        title: "Configuration Failed",
        description: `Failed to configure port: ${error}`,
        variant: "destructive",
      });
    }
  }, [serialAPI, toast]);

  return {
    isConnected,
    availablePorts,
    connectionInfo,
    connect,
    disconnect,
    sendData,
    configurePort,
    isSupported: serialAPI?.isSupported || false,
  };
}
