export interface SerialPort {
  id: string;
  name: string;
}

export interface SerialConfiguration {
  baudRate?: number;
  dataBits?: number;
  stopBits?: number;
  parity?: "none" | "even" | "odd";
  flowControl?: "none" | "hardware";
}

export class WebSerialAPI extends EventTarget {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private isReading = false;

  constructor() {
    super();
  }

  get isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  async getAvailablePorts(): Promise<SerialPort[]> {
    if (!this.isSupported) {
      return [];
    }

    try {
      const ports = await (navigator as any).serial.getPorts();
      return ports.map((port: any, index: number) => ({
        id: `port_${index}`,
        name: port.getInfo().usbProductId 
          ? `USB Device (${port.getInfo().usbVendorId}:${port.getInfo().usbProductId})`
          : `Serial Port ${index + 1}`,
      }));
    } catch (error) {
      console.error('Failed to get serial ports:', error);
      return [];
    }
  }

  async connect(portId?: string): Promise<void> {
    if (!this.isSupported) {
      throw new Error('WebSerial API is not supported in this browser');
    }

    try {
      // Request port access
      this.port = await (navigator as any).serial.requestPort();
      
      // Open the port with default settings
      await this.port.open({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      });

      // Set up reader and writer
      this.reader = this.port.readable.getReader();
      this.writer = this.port.writable.getWriter();

      // Start reading
      this.startReading();

      // Get port info for connection details
      const info = this.port.getInfo();
      const connectionInfo = `115200 baud, 8N1${info.usbProductId ? ` (USB ${info.usbVendorId}:${info.usbProductId})` : ''}`;

      this.dispatchEvent(new CustomEvent('connect', {
        detail: { info: connectionInfo }
      }));

    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw new Error('No device selected');
      }
      throw new Error(`Failed to connect to serial device: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    this.isReading = false;

    try {
      if (this.reader) {
        await this.reader.cancel();
        await this.reader.releaseLock();
        this.reader = null;
      }

      if (this.writer) {
        await this.writer.releaseLock();
        this.writer = null;
      }

      if (this.port) {
        await this.port.close();
        this.port = null;
      }

      this.dispatchEvent(new CustomEvent('disconnect'));
    } catch (error) {
      console.error('Error during disconnect:', error);
      throw new Error(`Failed to disconnect: ${error.message}`);
    }
  }

  async write(data: string): Promise<void> {
    if (!this.writer) {
      throw new Error('Not connected to serial device');
    }

    try {
      const encoder = new TextEncoder();
      const dataWithNewline = data.endsWith('\n') ? data : data + '\n';
      await this.writer.write(encoder.encode(dataWithNewline));
    } catch (error) {
      throw new Error(`Failed to write data: ${error.message}`);
    }
  }

  async configure(options: SerialConfiguration): Promise<void> {
    if (!this.port) {
      throw new Error('Not connected to serial device');
    }

    // Note: WebSerial API doesn't support runtime reconfiguration
    // The port would need to be closed and reopened with new settings
    console.warn('Runtime serial port reconfiguration is not supported by WebSerial API');
  }

  private async startReading(): Promise<void> {
    if (!this.reader) return;

    this.isReading = true;
    const decoder = new TextDecoder();

    try {
      while (this.isReading && this.reader) {
        const { value, done } = await this.reader.read();
        
        if (done) {
          break;
        }

        if (value) {
          const text = decoder.decode(value);
          this.dispatchEvent(new CustomEvent('data', {
            detail: { data: text }
          }));
        }
      }
    } catch (error) {
      if (this.isReading) {
        this.dispatchEvent(new CustomEvent('error', {
          detail: { error: error.message }
        }));
      }
    }
  }
}
