import { useState, useEffect, useRef, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  data?: any;
  error?: string;
  timestamp?: string;
  [key: string]: any;
}

type MessageListener = (data: WebSocketMessage) => void;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const messageListenersRef = useRef<Map<string, Set<MessageListener>>>(new Map());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          // Skip empty or whitespace-only messages
          if (!event.data || event.data.trim() === '') {
            return;
          }
          
          let message: WebSocketMessage;
          
          // Try to parse as JSON first
          try {
            message = JSON.parse(event.data);
            // Validate that the parsed object has a type property
            if (typeof message !== 'object' || !message.type) {
              throw new Error('Invalid message format');
            }
          } catch (parseError) {
            // If JSON parsing fails, treat as plain text message
            message = {
              type: 'raw_data',
              data: event.data,
              timestamp: new Date().toISOString()
            };
          }
          
          setLastMessage(message);

          // Call registered listeners for this message type
          const listeners = messageListenersRef.current.get(message.type);
          if (listeners) {
            listeners.forEach((listener: MessageListener) => listener(message));
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', event.data, error);
          // Still try to deliver as raw data
          const fallbackMessage: WebSocketMessage = {
            type: 'error',
            data: event.data,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          };
          setLastMessage(fallbackMessage);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const addMessageListener = useCallback((messageType: string, listener: MessageListener) => {
    if (!messageListenersRef.current.has(messageType)) {
      messageListenersRef.current.set(messageType, new Set());
    }
    messageListenersRef.current.get(messageType)!.add(listener);

    // Return cleanup function
    return () => {
      const listeners = messageListenersRef.current.get(messageType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          messageListenersRef.current.delete(messageType);
        }
      }
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    addMessageListener,
  };
}
