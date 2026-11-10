import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  connect(): Socket {
    if (this.socket) return this.socket;

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? new URL(import.meta.env.VITE_API_URL, window.location.origin).origin
        : window.location.origin);

    this.socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('[Socket] Connected to MineGuard real-time telemetry feed');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.warn('[Socket] Disconnected from MineGuard server');
    });

    return this.socket;
  }

  getSocket(): Socket {
    if (!this.socket) return this.connect();
    return this.socket;
  }

  getStatus(): boolean {
    return this.isConnected;
  }
}

export const socketClient = new SocketClient();
