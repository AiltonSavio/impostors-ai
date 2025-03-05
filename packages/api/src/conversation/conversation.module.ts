import { Module } from '@nestjs/common';
import { ConversationRunnerService } from './conversation-runner.service';
import { ConversationStateService } from './conversation-state.service';
import { ConversationController } from './conversation.controller';
import { ConversationGateway } from './conversation.gateway';
import { GraphModule } from 'src/graph/graph.module';

@Module({
  imports: [GraphModule],
  providers: [
    ConversationRunnerService,
    ConversationStateService,
    ConversationGateway,
  ],
  controllers: [ConversationController],
  exports: [ConversationRunnerService, ConversationStateService],
})
export class ConversationModule {}
