import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { User } from '../types';

interface SocketContextData {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextData>({
  socket: null,
  isConnected: false
});

export const useSocket = () => useContext(SocketContext);

// Base64 generic bell sound (A short high-pitch "ding")
const bellSoundUrl = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

interface SocketProviderProps {
  user: User | null;
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ user, children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
      }
      return;
    }

    const newSocket = io('http://localhost:5000');

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join', user._id || user.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for assignments
    newSocket.on('issue_assigned', (data) => {
      playNotificationSound();
      showPushNotification("New Issue Assigned", data.notification.message);
    });
    
    // Listen for reminders
    newSocket.on('reminder_notification', (data) => {
      playNotificationSound();
      showPushNotification("SLA Alert", data.notification.message);
    });
    
    newSocket.on('admin_alert', (data) => {
      // Optional sound for admin alerts
      playNotificationSound();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const playNotificationSound = () => {
    try {
      // We create an AudioContext to use simple beep if base64 is not desired
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // frequency in hertz
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch(err) {
      console.warn("Failed to play notification beep", err);
    }
  };

  const showPushNotification = (title: string, body: string) => {
    // If browser supports Notification API
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
