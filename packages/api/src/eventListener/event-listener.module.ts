import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventListenerService } from './event-listener.service';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [ConfigModule, ConversationModule],
  providers: [EventListenerService],
  exports: [EventListenerService],
})
export class EventListenerModule {}
