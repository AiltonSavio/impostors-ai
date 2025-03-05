import { Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { ConversationStateService } from './conversation-state.service';
import { ConversationRunnerService } from './conversation-runner.service';
import { roles } from 'src/graph/agents';

@Controller('conversation')
export class ConversationController {
  private readonly logger = new Logger(ConversationController.name);

  constructor(
    private readonly runner: ConversationRunnerService,
    private readonly stateService: ConversationStateService,
  ) {}

  // endpoints for testing
  @Post('start')
  async startConversation() {
    console.log('Initializing conversation');
    const impostorIndex = Math.floor(Math.random() * roles.length);
    this.logger.log(`selected impostor: ${roles[impostorIndex].name}`);
    await this.runner.initializeConversation(impostorIndex);

    // Schedule a timeout to end the game after 10 minutes (600000 ms)
    setTimeout(async () => {
      this.runner.stopConversation();

      this.logger.log(`Connversation ended`);
    }, 120_000);
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
