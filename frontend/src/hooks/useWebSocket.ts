import { useCallback, useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  timestamp?: string;
}

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  shouldReconnect?: (event: CloseEvent) => boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
) {
  const {
    onOpen,
    onClose,
    onError,
    onMessage,
    shouldReconnect = () => true,
    reconnectInterval = 5000,
    reconnectAttempts = 10,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const isMounted = useRef(true);

  // Handle connecting to the WebSocket
  const connect = useCallback(() => {
    if (!url) {
      console.warn('WebSocket URL is not provided');
      return;
    }

    // Close existing connection if any
    if (ws.current) {
      ws.current.close();
    }

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = (event) => {
        if (!isMounted.current) return;
        
        console.log('WebSocket connected to:', url);
        setIsConnected(true);
        setReconnectCount(0);
        
        if (onOpen) {
          onOpen(event);
        }
      };

      ws.current.onmessage = (event) => {
        if (!isMounted.current) return;
        
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, event.data);
        }
      };

      ws.current.onclose = (event) => {
        if (!isMounted.current) return;
        
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        
        if (onClose) {
          onClose(event);
        }

        // Attempt to reconnect
        if (shouldReconnect(event) && reconnectCount < reconnectAttempts) {
          const timeout = reconnectInterval * Math.pow(2, reconnectCount);
          console.log(`Attempting to reconnect in ${timeout}ms...`);
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (isMounted.current) {
              setReconnectCount(prev => prev + 1);
              connect();
            }
          }, timeout);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) {
          onError(error);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [url, onOpen, onClose, onError, onMessage, shouldReconnect, reconnectInterval, reconnectAttempts, reconnectCount]);

  // Initialize connection
  useEffect(() => {
    isMounted.current = true;
    
    // Only connect if URL is provided
    if (url) {
      connect();
    }

    // Cleanup function
    return () => {
      isMounted.current = false;
      
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Close the WebSocket connection
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connect, url]);

  // Function to send messages
  const sendMessage = useCallback((message: any) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      ws.current.send(messageString);
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
