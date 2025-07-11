import { Injectable, Logger } from '@nestjs/common';
import {
  StateGraph,
  MessagesAnnotation,
  Command,
  MemorySaver,
  CompiledStateGraph,
  StateDefinition,
} from '@langchain/langgraph';
import {
  AgentName,
  AgentRole,
  getAgentNames,
  getRolesWithImpostor,
  roles,
} from './agents';
import { BaseMessage } from '@langchain/core/messages';
import { ChatOllama } from '@langchain/ollama';
import { ChatTogetherAI } from '@langchain/community/chat_models/togetherai';

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);
  private model: ChatOllama | ChatTogetherAI;
  private agents: string[] = [];
  private eliminatedAgents: string[] = [];
  private impostorIndex: number;
  private lastSelectedTimes: Partial<Record<AgentName, number>> = {};
  private graph: CompiledStateGraph<
    any,
    any,
    AgentName,
    StateDefinition,
    StateDefinition,
    StateDefinition
  >;

  constructor() {
    // Read CLI arguments
    const args = process.argv.slice(2);
    const useDeepseek = args.includes('--model=deepseek');

    if (useDeepseek) {
      this.logger.log('Using DeepSeek model (Ollama)');
      this.model = new ChatOllama({
        model: 'deepseek-r1',
        temperature: 0.3,
        maxRetries: 3,
      });
    } else {
      this.logger.log('Using TogetherAI model');
      this.model = new ChatTogetherAI({
        apiKey: process.env.TOGETHERAI_API_KEY,
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        temperature: 0.3,
        maxRetries: 3,
      });
    }
  }

  /**
   * Calls the LLM with structured output so that it returns a natural language response along with a target node.
   * @param messages - the conversation messages
   */
  async callLlm(messages: BaseMessage[]) {
    // Generate a random delay between 10 and 20 seconds
    const delay = Math.floor(Math.random() * (20_000 - 10_000 + 1)) + 10_000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const response = await this.model.invoke(messages);
    const textResponse = response.content.toString().trim();
    return textResponse;
  }

  /**
   * Creates an agent node function for the war council based on the agent's personality and role filtering out the current agent.
   */
  async createAgentNode(role: AgentRole) {
    return async (state: typeof MessagesAnnotation.State) => {
      let systemPrompt = `You are the ${role.name}. ${role.personality}\n`;
      if (role.isImpostor) {
        systemPrompt += `${role.impostorPrompt} `;
      }

      // Dynamically include references to other active agents
      const otherHelp = roles
        .filter((r) => r.name !== role.name && this.agents.includes(r.name))
        .map((r) => r.help)
        .join(' ');
      systemPrompt += otherHelp + ' ';

      // Add role-specific constraints
      systemPrompt +=
        'Keep your answer clear, concise, and final (no more than 40 words).';

      const messages = [
        { role: 'system', content: systemPrompt },
        state.messages[0],
      ] as BaseMessage[];

      const response = await this.callLlm(messages);
      const aiMsg = {
        role: 'human',
        content: response,
        name: role.name,
      };

      const gotoAgent = this.selectGotoAgent(role.name);

      return new Command({
        goto: gotoAgent,
        update: { messages: [aiMsg] },
      });
    };
  }

  async createGameGraph(impostorIndex: number) {
    const agentNames = getAgentNames();
    this.agents = agentNames;

    const graph = new StateGraph(MessagesAnnotation) as StateGraph<
      typeof MessagesAnnotation,
      any,
      any,
      AgentName
    >;

    this.impostorIndex = impostorIndex;
    const roles = getRolesWithImpostor(impostorIndex);

    for (const role of roles) {
      const destinations = agentNames.filter((name) => name !== role.name);
      graph.addNode(role.name, await this.createAgentNode(role), {
        ends: [...destinations, '__end__'],
      });
    }

    // Choose a random starting agent.
    const startingAgent =
      agentNames[Math.floor(Math.random() * agentNames.length)];
    graph.addEdge('__start__', startingAgent);

    const checkpointer = new MemorySaver();
    const compiledGraph = graph.compile({ checkpointer }).withConfig({
      configurable: { thread_id: Math.random() },
      recursionLimit: 1000,
    });
    this.graph = compiledGraph;
  }

  // Helper function to select a goto agent.
  // compute weights based on how long it has been since an agent was last selected.
  selectGotoAgent(currentAgent: AgentName): string {
    const eligibleIndexes = this.eligibleAgentsIndexes();

    const filteredAllowed = eligibleIndexes
      .map((index) => this.agents[index])
      .filter((agent) => agent !== currentAgent);

    const now = Date.now();
    // Compute weights: weight = (now - lastSelectedTime + 1)
    const weights = filteredAllowed.map((agent) => {
      const last = this.lastSelectedTimes[agent] ?? 0;
      return now - last + 1;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let r = Math.random() * totalWeight;

    for (let i = 0; i < filteredAllowed.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        this.lastSelectedTimes[filteredAllowed[i]] = now;
        return filteredAllowed[i];
      }
    }

    // Fallback: return a random allowed agent from the filtered list.
    const randomAgent =
      filteredAllowed[Math.floor(Math.random() * filteredAllowed.length)];
    this.lastSelectedTimes[randomAgent] = now;
    return randomAgent;
  }

  eliminateAgent() {
    const eligibleIndexes = this.eligibleAgentsIndexes();
    const impostorIndex = this.impostorIndex;

    // Filter out the impostor agent
    const filteredEligibleIndexes = eligibleIndexes.filter(
      (index) => index !== impostorIndex,
    );

    if (filteredEligibleIndexes.length === 0) {
      this.logger.log('No eligible agents to eliminate.');
      return null;
    }

    // Pick a random index
    const randomIndex =
      filteredEligibleIndexes[
        Math.floor(Math.random() * filteredEligibleIndexes.length)
      ];
    const eliminatedAgent = this.agents[randomIndex];

    this.eliminatedAgents.push(eliminatedAgent);
    this.logger.log(`Agent eliminated: ${eliminatedAgent}`);

    return eliminatedAgent;
  }

  // Returns a list of indexes of agents that are not eliminated.
  eligibleAgentsIndexes(): number[] {
    return this.agents
      .map((agent, index) => index)
      .filter((index) => !this.eliminatedAgents.includes(this.agents[index]));
  }

  /**
   * Generates a background narrative using the AI model.
   */
  async generateNarrative(): Promise<string> {
    const narratorPrompt = `
    You are a master storyteller. Set the stage for a high-stakes war council where ten uniquely skilled agents gather in the royal war room. 
    The kingdom faces imminent invasion and internal strife. 
    Describe the tense atmosphere, the ancient maps and battle plans spread across the table, and the urgency in the room as the agents debate their next move. 
    Keep the narrative short (one paragraph, 150 maximum words), vivid, and immersive, focusing on the grim reality of war and the weight of their decisions. 
    Avoid using specific names or titles. 
    At the end of the paragraph, have the first council member to speak propose a bold strategy, and then ask them directly something like: 
    "What decisive command shall we issue?"
    `;
    const response = await this.model.invoke([narratorPrompt]);
    return response.content.toString().trim();
  }

  getGraph() {
    return this.graph;
  }

  clear() {
    this.agents = [];
    this.eliminatedAgents = [];
    this.graph = undefined;
  }
}
