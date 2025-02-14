import { Injectable, Logger } from '@nestjs/common';
import { createGameGraph } from '../graph';
import { ConversationGateway } from './conversation.gateway';
import { model } from 'src/agents';

@Injectable()
export class ConversationRunnerService {
  private readonly logger = new Logger(ConversationRunnerService.name);
  private graph: ReturnType<typeof createGameGraph>['graph'];
  private messages: { role: string; content: string; name: string }[] = [];
  private sessionActive = false;
  private abortController: AbortController | null = null;
  private activeAgents: string[] = [];
  private eliminatedAgents: string[] = [];

  constructor(private readonly gateway: ConversationGateway) {}

  async initializeConversation(impostorIndex: number) {
    const { graph } = createGameGraph(impostorIndex);
    this.graph = graph;
    this.sessionActive = true;
    this.abortController = new AbortController();

    const allAgentNames = [
      'General',
      'Diplomat',
      'Treasurer',
      'Spymaster',
      'Blacksmith',
      'Mage',
      'Healer',
      'Strategist',
      'Tactician',
      'Architect',
    ];
    // Exclude the impostor from elimination.
    this.activeAgents = allAgentNames.filter(
      (_, index) => index !== impostorIndex,
    );

    this.runConversation();

    setTimeout(() => {
      let eliminationCount = 0;
      const eliminationIntervalId = setInterval(() => {
        if (!this.sessionActive) {
          clearInterval(eliminationIntervalId);
          return;
        }

        // Randomly pick one active agent to eliminate.
        const randomIndex = Math.floor(
          Math.random() * this.activeAgents.length,
        );
        const eliminatedAgent = this.activeAgents[randomIndex];
        this.eliminatedAgents.push(eliminatedAgent);
        // Remove eliminated agent from activeAgents.
        this.activeAgents.splice(randomIndex, 1);
        this.logger.log(`Agent eliminated: ${eliminatedAgent}`);
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
    this.eliminatedAgents = [];
    if (this.abortController) {
      this.abortController.abort();
    }
    this.logger.log('Conversation aborted.');
  }

  private async runConversation() {
    const narrative = await this.generateNarrative();

    const narrativeMessage = {
      role: 'system',
      content: narrative,
      name: 'Narrator',
    };

    this.messages.push(narrativeMessage);
    this.gateway.broadcastMessage(narrativeMessage);

    // Begin streaming conversation from your graph.
    const conversationStream = await this.graph.stream({
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
        const agentMessage = chunk[agentKey].messages;
        this.messages.push(agentMessage);
        this.gateway.broadcastMessage(agentMessage);
      }
    }
  }

  /**
   * Generates a background narrative using the AI model.
   */
  private async generateNarrative(): Promise<string> {
    const narratorPrompt = `
You are a master storyteller. Set the stage for a high-stakes war council in which ten uniquely skilled agents have gathered in the royal war room. The kingdom is facing an imminent invasion and internal strife, and every decision is critical. Describe the tense atmosphere, the ancient maps and battle plans, and the urgency felt by the council as they prepare for the coming conflict.
Your narrative should immerse the audience in the grim reality of war and the crucial decisions that lie ahead.
    `;
    const response = await model.invoke([
      { role: 'user', content: narratorPrompt },
    ]);
    return response.content.toString();
  }

  // Optionally, include getters for messages as before.
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
