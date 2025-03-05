import { Injectable, Logger } from '@nestjs/common';
import { ConversationGateway } from './conversation.gateway';
import { GraphService } from 'src/graph/graph.service';

@Injectable()
export class ConversationRunnerService {
  private readonly logger = new Logger(ConversationRunnerService.name);
  private messages: { role: string; content: string; name: string }[] = [];
  private sessionActive = false;
  private abortController: AbortController | null = null;

  constructor(
    private readonly graphService: GraphService,
    private readonly gateway: ConversationGateway,
  ) {}

  async initializeConversation(impostorIndex: number) {
    await this.graphService.createGameGraph(impostorIndex);
    this.sessionActive = true;
    this.abortController = new AbortController();

    this.runConversation();

    setTimeout(() => {
      let eliminationCount = 0;
      const eliminationIntervalId = setInterval(() => {
        if (!this.sessionActive) {
          clearInterval(eliminationIntervalId);
          return;
        }
        const eliminatedAgent = this.graphService.eliminateAgent();
        // Broadcast the elimination event.
        this.gateway.broadcastElimination(eliminatedAgent);
        eliminationCount++;
        if (eliminationCount >= 5) {
          clearInterval(eliminationIntervalId);
        }
      }, 60_000);
    }, 240_000);
  }

  async stopConversation() {
    this.sessionActive = false;
    this.messages = [];
    this.graphService.clear();
    if (this.abortController) {
      this.abortController.abort();
    }
    this.logger.log('Conversation aborted.');
  }

  private async runConversation() {
    const narrative = await this.graphService.generateNarrative();
    this.logger.log(narrative);

    const narrativeMessage = {
      role: 'system',
      content: narrative,
      name: 'Narrator',
    };

    this.messages.push(narrativeMessage);
    this.gateway.broadcastMessage(narrativeMessage);

    // Begin streaming conversation from your graph.
    const conversationStream = await this.graphService.getGraph().stream({
      messages: [{ role: 'system', content: narrative }],
    });
    for await (const chunk of conversationStream) {
      if (!this.sessionActive) {
        break;
      }
      this.logger.log(chunk);
      // Extract the agent message from the chunk.
      const keys = Object.keys(chunk);
      if (keys.length > 0) {
        const agentKey = keys[0];
        const agentMessage = chunk[agentKey].messages[0];
        this.messages.push(agentMessage);
        this.gateway.broadcastMessage(agentMessage);
      }
    }
  }

  getMessages() {
    return this.messages;
  }

  getLatestMessage() {
    return this.messages.length
      ? this.messages[this.messages.length - 1]
      : null;
  }

  getMessagesByAgent(agentName: string) {
    return this.messages.filter((msg) => msg.name === agentName);
  }
}
