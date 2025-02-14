import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class ConversationGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit() {
    console.log('WebSocket server initialized');
  }

  broadcastMessage(message: any) {
    this.server.emit('newMessage', message);
  }

  broadcastElimination(agentName: string) {
    this.server.emit('agentEliminated', agentName);
  }
}
