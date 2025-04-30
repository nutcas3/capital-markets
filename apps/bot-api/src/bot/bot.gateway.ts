import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BotGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    if (!token) {
      client.disconnect();
      return;
    }

    const session = await this.authService.verifySession(token);
    if (!session) {
      client.disconnect();
      return;
    }

    // Join user-specific room
    client.join(`user:${session.userId}`);
  }

  handleDisconnect(client: Socket) {
    // Cleanup if needed
  }

  // Method to send trade notifications
  async sendTradeNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('trade', notification);
  }

  // Method to send portfolio updates
  async sendPortfolioUpdate(userId: string, portfolio: any) {
    this.server.to(`user:${userId}`).emit('portfolio', portfolio);
  }

  // Method to send price updates
  async sendPriceUpdate(userId: string, priceUpdate: any) {
    this.server.to(`user:${userId}`).emit('price', priceUpdate);
  }
}
