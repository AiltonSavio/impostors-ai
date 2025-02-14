// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationModule } from './conversation/conversation.module';
import { EventListenerModule } from './eventListener/event-listener.module';

@Module({
  imports: [ConfigModule.forRoot(), ConversationModule, EventListenerModule],
})
export class AppModule {}
