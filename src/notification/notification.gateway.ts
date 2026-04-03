import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<number, string>();

  handleConnection(client: Socket) {
    const userId = Number(client.handshake.query.userId);
    if (!isNaN(userId) && userId > 0) {
      this.userSockets.set(userId, client.id);
      console.log(`User ${userId} connected via WebSockets`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Number(client.handshake.query.userId);
    if (!isNaN(userId)) {
      this.userSockets.delete(userId);
    }
  }

  sendNotificationToUser(userId: number, notification: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
    }
  }
}
