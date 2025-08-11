import { useState, useEffect, useRef, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  data?: any;
  [key: string]: any;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageListenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

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
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          // Skip empty or whitespace-only messages
          if (!event.data || event.data.trim() === '') {
            return;
          }
          
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Call registered listeners for this message type
          const listeners = messageListenersRef.current.get(message.type);
          if (listeners) {
            listeners.forEach(listener => listener(message));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', event.data, error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
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
      clearTimeout(reconnectTimeoutRef.current);
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

  const addMessageListener = useCallback((messageType: string, listener: (data: any) => void) => {
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
        clearTimeout(reconnectTimeoutRef.current);
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
