import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import {
  getRolesWithImpostor,
  createAgentNode,
  getAgentNames,
  AgentName,
} from './agents';

export const createGameGraph = (impostorIndex: number) => {
  const agentNames = getAgentNames();
  const graph = new StateGraph(MessagesAnnotation) as StateGraph<
    typeof MessagesAnnotation,
    any,
    any,
    AgentName
  >;

  const roles = getRolesWithImpostor(impostorIndex);

  for (const role of roles) {
    const destinations = agentNames.filter((name) => name !== role.name);
    graph.addNode(role.name, createAgentNode(role, destinations), {
      ends: [...destinations, '__end__'],
    });
  }

  // Choose a random starting agent.
  const startingAgent =
    agentNames[Math.floor(Math.random() * agentNames.length)];
  graph.addEdge('__start__', startingAgent);

  const compiledGraph = graph.compile();
  return { graph: compiledGraph };
};
