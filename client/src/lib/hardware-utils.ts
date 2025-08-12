// Browser compatibility and error handling utilities for hardware debugging

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  supported: boolean;
  webSerialSupported: boolean;
  webUSBSupported: boolean;
  limitations: string[];
}

export interface DeviceTypeInfo {
  name: string;
  type: 'serial' | 'usb';
  vendors: string[];
  commonNames: string[];
  requiredTab: string;
  driverInfo?: {
    windows?: string;
    macos?: string;
    linux?: string;
  };
}

export const DEVICE_TYPES: DeviceTypeInfo[] = [
  {
    name: "CH341A Programmer",
    type: "usb",
    vendors: ["1a86"],
    commonNames: ["CH341A", "CH341 programmer", "SPI programmer"],
    requiredTab: "SPI Flasher",
    driverInfo: {
      windows: "CH341SER driver required",
      macos: "Usually works without additional drivers",
      linux: "Included in kernel (udev rules may be needed)"
    }
  },
  {
    name: "ESP32/ESP8266",
    type: "serial",
    vendors: ["10c4", "1a86"],
    commonNames: ["ESP32", "ESP8266", "NodeMCU", "Wemos"],
    requiredTab: "Serial Console",
    driverInfo: {
      windows: "CP2102/CH340 driver required",
      macos: "CP2102 driver may be needed",
      linux: "Usually included in kernel"
    }
  },
  {
    name: "Arduino",
    type: "serial",
    vendors: ["2341", "1b4f", "2a03"],
    commonNames: ["Arduino Uno", "Arduino Nano", "Arduino Pro"],
    requiredTab: "Serial Console",
    driverInfo: {
      windows: "Arduino IDE drivers or CH340/FTDI drivers",
      macos: "FTDI driver may be needed",
      linux: "Usually included in kernel"
    }
  }
];

export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;
  const vendor = navigator.vendor || '';
  
  let name = "Unknown";
  let version = "Unknown";
  let engine = "Unknown";
  let supported = false;
  let webSerialSupported = false;
  let webUSBSupported = false;
  const limitations: string[] = [];

  // Detect browser
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    name = "Chrome";
    engine = "Blink";
    supported = true;
    webSerialSupported = 'serial' in navigator;
    webUSBSupported = 'usb' in navigator;
    
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) {
      version = match[1];
      const versionNum = parseInt(version);
      if (versionNum < 89) {
        limitations.push("WebSerial requires Chrome 89+");
        webSerialSupported = false;
      }
      if (versionNum < 61) {
        limitations.push("WebUSB requires Chrome 61+");
        webUSBSupported = false;
      }
    }
  } else if (userAgent.includes("Edg")) {
    name = "Edge";
    engine = "Blink";
    supported = true;
    webSerialSupported = 'serial' in navigator;
    webUSBSupported = 'usb' in navigator;
    
    const match = userAgent.match(/Edg\/(\d+)/);
    if (match) {
      version = match[1];
    }
  } else if (userAgent.includes("Firefox")) {
    name = "Firefox";
    engine = "Gecko";
    supported = false;
    webSerialSupported = false;
    webUSBSupported = false;
    limitations.push("WebSerial not supported in Firefox");
    limitations.push("WebUSB not supported in Firefox");
    limitations.push("Use Chrome or Edge for hardware connectivity");
    
    const match = userAgent.match(/Firefox\/(\d+)/);
    if (match) {
      version = match[1];
    }
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    name = "Safari";
    engine = "WebKit";
    supported = false;
    webSerialSupported = false;
    webUSBSupported = false;
    limitations.push("WebSerial not supported in Safari");
    limitations.push("WebUSB not supported in Safari");
    limitations.push("Use Chrome or Edge for hardware connectivity");
    
    const match = userAgent.match(/Version\/(\d+)/);
    if (match) {
      version = match[1];
    }
  }

  // Additional checks for API availability
  if (typeof navigator === 'undefined') {
    limitations.push("Navigator API not available");
    webSerialSupported = false;
    webUSBSupported = false;
  }

  // Check for HTTPS requirement
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    limitations.push("HTTPS required for WebUSB/WebSerial APIs");
    webSerialSupported = false;
    webUSBSupported = false;
  }

  return {
    name,
    version,
    engine,
    supported,
    webSerialSupported,
    webUSBSupported,
    limitations
  };
}

export function identifyDeviceType(deviceName: string, vendorId?: string): DeviceTypeInfo | null {
  const lowerName = deviceName.toLowerCase();
  
  for (const deviceType of DEVICE_TYPES) {
    // Check by vendor ID
    if (vendorId && deviceType.vendors.includes(vendorId.toLowerCase())) {
      return deviceType;
    }
    
    // Check by common names
    for (const commonName of deviceType.commonNames) {
      if (lowerName.includes(commonName.toLowerCase())) {
        return deviceType;
      }
    }
  }
  
  return null;
}

export interface HardwareError extends Error {
  code: string;
  category: 'connection' | 'permission' | 'driver' | 'hardware' | 'browser';
  suggestions: string[];
  deviceType?: string;
}

export function createHardwareError(
  message: string,
  code: string,
  category: HardwareError['category'],
  suggestions: string[] = [],
  deviceType?: string
): HardwareError {
  const error = new Error(message) as HardwareError;
  error.code = code;
  error.category = category;
  error.suggestions = suggestions;
  error.deviceType = deviceType;
  return error;
}

export function parseConnectionError(error: Error, deviceType?: string): HardwareError {
  const message = error.message.toLowerCase();
  
  if (message.includes('no device selected') || message.includes('notfounderror')) {
    return createHardwareError(
      'No device selected',
      'DEVICE_NOT_SELECTED',
      'permission',
      [
        'Make sure your device is connected to a USB port',
        'Click the Connect button and select your device from the browser popup',
        'Try a different USB cable or port if the device doesn\'t appear',
        deviceType === 'CH341A' ? 'Install CH341SER driver if this is your first time (Windows)' : 'Install appropriate drivers for your device'
      ],
      deviceType
    );
  }
  
  if (message.includes('access denied') || message.includes('permission denied')) {
    return createHardwareError(
      'Permission denied',
      'PERMISSION_DENIED',
      'permission',
      [
        'The browser denied access to the device',
        'Try disconnecting and reconnecting the device',
        'Restart your browser and try again',
        'Check that no other applications are using the device'
      ],
      deviceType
    );
  }
  
  if (message.includes('failed to open') || message.includes('device busy')) {
    return createHardwareError(
      'Device busy or in use',
      'DEVICE_BUSY',
      'connection',
      [
        'Close any other applications that might be using the device',
        'Disconnect and reconnect the device',
        'Restart your computer if the device appears to be stuck',
        'Check that the device is not being used by another browser tab'
      ],
      deviceType
    );
  }
  
  if (message.includes('not supported') || message.includes('webusb') || message.includes('webserial')) {
    return createHardwareError(
      'Browser API not supported',
      'API_NOT_SUPPORTED',
      'browser',
      [
        'Use Chrome, Edge, or another Chromium-based browser',
        'Update your browser to the latest version',
        'Make sure you\'re using HTTPS (or localhost for development)',
        'Some features require Chrome 89+ or Edge 89+'
      ],
      deviceType
    );
  }
  
  if (message.includes('chip detection') || message.includes('failed to detect')) {
    return createHardwareError(
      'Hardware detection failed',
      'DETECTION_FAILED',
      'hardware',
      [
        'Check that the chip is properly seated in the programmer socket',
        'Verify that the chip orientation is correct (pin 1 alignment)',
        'Try cleaning the chip pins and socket contacts',
        'Ensure the chip is compatible with your programmer',
        'Check that the programmer is receiving adequate USB power'
      ],
      deviceType
    );
  }
  
  // Default error handling
  return createHardwareError(
    error.message,
    'UNKNOWN_ERROR',
    'connection',
    [
      'Try disconnecting and reconnecting the device',
      'Restart your browser',
      'Check USB cable and try a different port',
      'Verify that device drivers are installed'
    ],
    deviceType
  );
}

export function getDriverInstructions(deviceType: DeviceTypeInfo): string[] {
  const platform = navigator.platform.toLowerCase();
  const instructions: string[] = [];
  
  if (platform.includes('win')) {
    if (deviceType.driverInfo?.windows) {
      instructions.push(`Windows: ${deviceType.driverInfo.windows}`);
    }
  } else if (platform.includes('mac')) {
    if (deviceType.driverInfo?.macos) {
      instructions.push(`macOS: ${deviceType.driverInfo.macos}`);
    }
  } else if (platform.includes('linux')) {
    if (deviceType.driverInfo?.linux) {
      instructions.push(`Linux: ${deviceType.driverInfo.linux}`);
    }
  }
  
  return instructions;
}
