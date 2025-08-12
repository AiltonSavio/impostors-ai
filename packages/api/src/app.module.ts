import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationModule } from './conversation/conversation.module';
import { EventListenerModule } from './eventListener/event-listener.module';
import { GraphModule } from './graph/graph.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ConversationModule,
    EventListenerModule,
    GraphModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
