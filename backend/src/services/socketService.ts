import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';

class SocketService {
  private io: Server | null = null;

  init(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  emit(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  broadcastReading(reading: any) {
    this.emit('sensor:reading', reading);
  }

  broadcastAlert(alert: any) {
    this.emit('alert:new', alert);
  }

  broadcastDeviceStatus(device: any) {
    this.emit('device:status', device);
  }

  broadcastZoneStatus(zone: any) {
    this.emit('zone:status', zone);
  }

  broadcastModeChange(mode: { demoMode: boolean }) {
    this.emit('mode:change', mode);
  }
}

export const socketService = new SocketService();
