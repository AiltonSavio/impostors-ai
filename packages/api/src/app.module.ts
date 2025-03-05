import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationModule } from './conversation/conversation.module';
import { EventListenerModule } from './eventListener/event-listener.module';
import { GraphModule } from './graph/graph.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ConversationModule,
    EventListenerModule,
    GraphModule,
  ],
})
export class AppModule {}
