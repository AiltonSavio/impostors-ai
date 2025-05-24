import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KeeperService } from './keeper.service';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [ConfigModule, ConversationModule],
  providers: [KeeperService],
  exports: [KeeperService],
})
export class KeeperModule {}
