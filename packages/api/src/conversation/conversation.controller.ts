import { Controller, Get, Param, Post } from '@nestjs/common';
import { ConversationStateService } from './conversation-state.service';
import { ConversationRunnerService } from './conversation-runner.service';
import { roles } from 'src/agents';

@Controller('conversation')
export class ConversationController {
  constructor(
    private readonly runner: ConversationRunnerService,
    private readonly stateService: ConversationStateService,
  ) {}

  // endpoints for testing
  @Post('start')
  async startConversation() {
    console.log('Initializing conversation');
    return await this.runner.initializeConversation(
      Math.floor(Math.random() * roles.length),
    );
  }

  @Get('latest-message')
  getLatestMessage() {
    return this.stateService.getLatestMessage();
  }

  @Get('messages')
  getAllMessages() {
    return this.stateService.getAllMessages();
  }

  @Get('messages/:agentName')
  getMessagesByAgent(@Param('agentName') agentName: string) {
    return this.stateService.getMessagesByAgent(agentName);
  }
}
