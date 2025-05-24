import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationModule } from './conversation/conversation.module';
import { KeeperModule } from './keeper/keeper.module';
import { GraphModule } from './graph/graph.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ConversationModule,
    KeeperModule,
    GraphModule,
  ],
})
export class AppModule {}
