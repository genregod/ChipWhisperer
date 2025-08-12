export interface DetectedChip {
  manufacturerId: string;
  deviceId: string;
  name: string;
  capacity: string;
  blockSize: string;
  pageSize: string;
}

export interface WebUSBError extends Error {
  code?: string;
  originalError?: Error;
}

export function useWebUSB() {
  const isSupported = typeof navigator !== 'undefined' && 'usb' in navigator && !!navigator.usb;
  let device: USBDevice | null = null;
  let isConnected = false;

  const connect = async (): Promise<void> => {
    if (!isSupported) {
      throw new Error('WebUSB API is not supported in this browser. Please use Chrome, Edge, or other Chromium-based browsers.');
    }

    if (!navigator.usb) {
      throw new Error('USB interface not available');
    }

    try {
      // Request CH341A device (vendor ID: 0x1a86, product ID: 0x5512)
      device = await navigator.usb.requestDevice({
        filters: [
          { vendorId: 0x1a86, productId: 0x5512 }, // CH341A
          { vendorId: 0x1a86, productId: 0x5523 }, // CH341A variant
        ]
      });

      await device.open();
      
      // Select configuration and claim interface
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      
      await device.claimInterface(0);
      isConnected = true;

    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        throw new Error('No CH341A device selected');
      }
      throw new Error(`Failed to connect to USB device: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const disconnect = async (): Promise<void> => {
    if (device) {
      try {
        await device.releaseInterface(0);
        await device.close();
        device = null;
        isConnected = false;
      } catch (error) {
        console.error('Error disconnecting USB device:', error);
      }
    }
  };

  const detectChip = async (): Promise<DetectedChip> => {
    if (!device || !isConnected) {
      throw new Error('USB device not connected');
    }

    try {
      // Send SPI read ID command (0x9F)
      const readIdCommand = new Uint8Array([0x9F, 0x00, 0x00, 0x00]);
      
      // This is a simplified implementation
      // In reality, CH341A communication requires specific USB control transfers
      const result = await device.controlTransferOut({
        requestType: 'vendor',
        recipient: 'device',
        request: 0xA1, // CH341A SPI command
        value: 0,
        index: 0
      }, readIdCommand);

      // Read response
      const response = await device.controlTransferIn({
        requestType: 'vendor',
        recipient: 'device',
        request: 0xA2, // CH341A SPI read
        value: 0,
        index: 0
      }, 4);

      if (response.data && response.data.byteLength >= 3) {
        const data = new Uint8Array(response.data.buffer);
        const manufacturerId = data[0].toString(16).toUpperCase().padStart(2, '0');
        const deviceId = ((data[1] << 8) | data[2]).toString(16).toUpperCase().padStart(4, '0');

        // Mock chip identification based on common IDs
        let chipInfo: DetectedChip = {
          manufacturerId,
          deviceId,
          name: 'Unknown Chip',
          capacity: 'Unknown',
          blockSize: '64KB',
          pageSize: '256B',
        };

        // Common chip identification
        if (manufacturerId === 'EF' && deviceId === '4018') {
          chipInfo = {
            ...chipInfo,
            name: 'W25Q128FV',
            capacity: '16MB (128Mbit)',
          };
        } else if (manufacturerId === 'C2' && deviceId === '2017') {
          chipInfo = {
            ...chipInfo,
            name: 'MX25L6405D',
            capacity: '8MB (64Mbit)',
          };
        }

        return chipInfo;
      }

      throw new Error('Failed to read chip ID');
    } catch (error) {
      throw new Error(`Chip detection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const readData = async (
    address: number, 
    length: number, 
    progressCallback?: (progress: number) => void
  ): Promise<string> => {
    if (!device || !isConnected) {
      throw new Error('USB device not connected');
    }

    try {
      // This is a simplified implementation
      // Real CH341A requires proper SPI read commands and data handling
      const chunkSize = 256; // Read in 256-byte chunks
      const chunks: string[] = [];
      
      for (let offset = 0; offset < length; offset += chunkSize) {
        const readSize = Math.min(chunkSize, length - offset);
        const readAddress = address + offset;
        
        // Send SPI read command
        const readCommand = new Uint8Array([
          0x03, // SPI read command
          (readAddress >> 16) & 0xFF,
          (readAddress >> 8) & 0xFF,
          readAddress & 0xFF,
        ]);

        await device.controlTransferOut({
          requestType: 'vendor',
          recipient: 'device',
          request: 0xA1,
          value: 0,
          index: 0
        }, readCommand);

        // Read data
        const response = await device.controlTransferIn({
          requestType: 'vendor',
          recipient: 'device',
          request: 0xA2,
          value: 0,
          index: 0
        }, readSize);

        if (response.data) {
          const data = new Uint8Array(response.data.buffer);
          const hexString = Array.from(data)
            .map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
            .join('');
          chunks.push(hexString);
        }

        if (progressCallback) {
          progressCallback((offset + readSize) / length * 100);
        }
      }

      return chunks.join('');
    } catch (error) {
      throw new Error(`Read operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const writeData = async (
    address: number, 
    data: Uint8Array, 
    progressCallback?: (progress: number) => void
  ): Promise<void> => {
    if (!device || !isConnected) {
      throw new Error('USB device not connected');
    }

    try {
      // This is a simplified implementation
      // Real CH341A requires proper SPI write commands, sector erasing, etc.
      const pageSize = 256;
      
      for (let offset = 0; offset < data.length; offset += pageSize) {
        const writeSize = Math.min(pageSize, data.length - offset);
        const writeAddress = address + offset;
        const pageData = data.slice(offset, offset + writeSize);
        
        // Send SPI page program command
        const writeCommand = new Uint8Array([
          0x02, // SPI page program command
          (writeAddress >> 16) & 0xFF,
          (writeAddress >> 8) & 0xFF,
          writeAddress & 0xFF,
          ...Array.from(pageData)
        ]);

        await device.controlTransferOut({
          requestType: 'vendor',
          recipient: 'device',
          request: 0xA1,
          value: 0,
          index: 0
        }, writeCommand);

        // Wait for write completion (simplified)
        await new Promise(resolve => setTimeout(resolve, 10));

        if (progressCallback) {
          progressCallback((offset + writeSize) / data.length * 100);
        }
      }
    } catch (error) {
      throw new Error(`Write operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const eraseChip = async (progressCallback?: (progress: number) => void): Promise<void> => {
    if (!device || !isConnected) {
      throw new Error('USB device not connected');
    }

    try {
      // Send chip erase command
      const eraseCommand = new Uint8Array([0xC7]); // Chip erase command

      await device.controlTransferOut({
        requestType: 'vendor',
        recipient: 'device',
        request: 0xA1,
        value: 0,
        index: 0
      }, eraseCommand);

      // Simulate erase progress (chip erase can take several seconds)
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (progressCallback) {
          progressCallback(i);
        }
      }
    } catch (error) {
      throw new Error(`Erase operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return {
    isSupported,
    connect,
    disconnect,
    isConnected,
    detectChip,
    readData,
    writeData,
    eraseChip,
  };
}
