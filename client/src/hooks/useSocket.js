import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

// Each role connects to a different Socket.io namespace
const NAMESPACE = {
  manager:             '/manager',
  staff:               '/manager',
  charity_coordinator: '/charity',
  admin:               '/admin'
};

export const useSocket = (role, orgId, city = 'Warsaw') => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!role) return;

    const ns     = NAMESPACE[role] || '/manager';
    const socket = io(`${WS_URL}${ns}`, {
      auth:       { token: localStorage.getItem('token') },
      transports: ['websocket']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Join the right room for this user
      if (role === 'manager' || role === 'staff') {
        socket.emit('join:org', orgId);
      } else if (role === 'charity_coordinator') {
        socket.emit('join:city', city);
      }
    });

    return () => socket.disconnect();
  }, [role, orgId, city]);

  // Subscribe to an event — returns an unsubscribe function
  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  return { on };
};