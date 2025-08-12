// Type definitions for Web APIs not fully covered by TypeScript

// WebUSB API types
interface USBDevice {
  vendorId: number;
  productId: number;
  deviceVersionMajor: number;
  deviceVersionMinor: number;
  deviceVersionSubminor: number;
  manufacturerName?: string;
  productName?: string;
  serialNumber?: string;
  configuration: USBConfiguration | null;
  configurations: USBConfiguration[];
  opened: boolean;
  usbVersionMajor: number;
  usbVersionMinor: number;
  usbVersionSubminor: number;
  deviceClass: number;
  deviceSubclass: number;
  deviceProtocol: number;

  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  selectAlternateInterface(interfaceNumber: number, alternateSetting: number): Promise<void>;
  controlTransferIn(setup: USBControlTransferParameters, length: number): Promise<USBInTransferResult>;
  controlTransferOut(setup: USBControlTransferParameters, data?: BufferSource): Promise<USBOutTransferResult>;
  clearHalt(direction: USBDirection, endpointNumber: number): Promise<void>;
  transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
  isochronousTransferIn(endpointNumber: number, packetLengths: number[]): Promise<USBIsochronousInTransferResult>;
  isochronousTransferOut(endpointNumber: number, data: BufferSource, packetLengths: number[]): Promise<USBIsochronousOutTransferResult>;
  reset(): Promise<void>;
}

interface USBConfiguration {
  configurationValue: number;
  configurationName?: string;
  interfaces: USBInterface[];
}

interface USBInterface {
  interfaceNumber: number;
  alternates: USBAlternateInterface[];
}

interface USBAlternateInterface {
  alternateSetting: number;
  interfaceClass: number;
  interfaceSubclass: number;
  interfaceProtocol: number;
  interfaceName?: string;
  endpoints: USBEndpoint[];
}

interface USBEndpoint {
  endpointNumber: number;
  direction: USBDirection;
  type: USBEndpointType;
  packetSize: number;
}

interface USBControlTransferParameters {
  requestType: USBRequestType;
  recipient: USBRecipient;
  request: number;
  value: number;
  index: number;
}

interface USBInTransferResult {
  data?: DataView;
  status: USBTransferStatus;
}

interface USBOutTransferResult {
  bytesWritten: number;
  status: USBTransferStatus;
}

interface USBIsochronousInTransferResult {
  data?: DataView;
  packets: USBIsochronousInTransferPacket[];
}

interface USBIsochronousOutTransferResult {
  packets: USBIsochronousOutTransferPacket[];
}

interface USBIsochronousInTransferPacket {
  data?: DataView;
  status: USBTransferStatus;
}

interface USBIsochronousOutTransferPacket {
  bytesWritten: number;
  status: USBTransferStatus;
}

type USBDirection = "in" | "out";
type USBEndpointType = "bulk" | "interrupt" | "isochronous";
type USBRequestType = "standard" | "class" | "vendor";
type USBRecipient = "device" | "interface" | "endpoint" | "other";
type USBTransferStatus = "ok" | "stall" | "babble";

interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

interface USBDeviceRequestOptions {
  filters: USBDeviceFilter[];
}

interface USB extends EventTarget {
  getDevices(): Promise<USBDevice[]>;
  requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>;
  addEventListener(type: "connect", listener: (event: USBConnectionEvent) => void): void;
  addEventListener(type: "disconnect", listener: (event: USBConnectionEvent) => void): void;
  removeEventListener(type: "connect", listener: (event: USBConnectionEvent) => void): void;
  removeEventListener(type: "disconnect", listener: (event: USBConnectionEvent) => void): void;
}

interface USBConnectionEvent extends Event {
  device: USBDevice;
}

// WebSerial API types
interface SerialPort {
  readable: ReadableStream;
  writable: WritableStream;
  
  getInfo(): SerialPortInfo;
  open(options?: SerialOptions): Promise<void>;
  close(): Promise<void>;
  getSignals(): Promise<SerialInputSignals>;
  setSignals(signals: SerialOutputSignals): Promise<void>;
  addEventListener(type: "connect", listener: (event: Event) => void): void;
  addEventListener(type: "disconnect", listener: (event: Event) => void): void;
  removeEventListener(type: "connect", listener: (event: Event) => void): void;
  removeEventListener(type: "disconnect", listener: (event: Event) => void): void;
}

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: ParityType;
  bufferSize?: number;
  flowControl?: FlowControlType;
}

interface SerialInputSignals {
  dataCarrierDetect: boolean;
  clearToSend: boolean;
  ringIndicator: boolean;
  dataSetReady: boolean;
}

interface SerialOutputSignals {
  dataTerminalReady?: boolean;
  requestToSend?: boolean;
  break?: boolean;
}

type ParityType = "none" | "even" | "odd";
type FlowControlType = "none" | "hardware";

interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[];
}

interface Serial extends EventTarget {
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  addEventListener(type: "connect", listener: (event: SerialConnectionEvent) => void): void;
  addEventListener(type: "disconnect", listener: (event: SerialConnectionEvent) => void): void;
  removeEventListener(type: "connect", listener: (event: SerialConnectionEvent) => void): void;
  removeEventListener(type: "disconnect", listener: (event: SerialConnectionEvent) => void): void;
}

interface SerialConnectionEvent extends Event {
  port: SerialPort;
}

// Extend Navigator interface
interface Navigator {
  usb?: USB;
  serial?: Serial;
}
