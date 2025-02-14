import { Injectable } from '@nestjs/common';
import { ConversationRunnerService } from './conversation-runner.service';

@Injectable()
export class ConversationStateService {
  constructor(private readonly runner: ConversationRunnerService) {}

  getAllMessages() {
    return this.runner.getMessages();
  }

  getLatestMessage() {
    return this.runner.getLatestMessage();
  }

  getMessagesByAgent(agentName: string) {
    return this.runner.getMessagesByAgent(agentName);
  }
}
