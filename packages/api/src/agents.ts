import { ChatTogetherAI } from '@langchain/community/chat_models/togetherai';
import { Command, MessagesAnnotation } from '@langchain/langgraph';
import 'dotenv/config';

export type AgentName =
  | 'General'
  | 'Diplomat'
  | 'Treasurer'
  | 'Spymaster'
  | 'Blacksmith'
  | 'Mage'
  | 'Healer'
  | 'Strategist'
  | 'Tactician'
  | 'Architect';

export interface AgentRole {
  name: AgentName;
  personality: string;
  isImpostor?: boolean;
}

export const roles: AgentRole[] = [
  {
    name: 'General',
    personality:
      'A fearless and battle-hardened leader, the General commands with unwavering authority. He values **discipline, decisive action, and military strength** over endless debates. He often **clashes with the Diplomat** and **Treasurer** over the use of resources, believing that hesitation is as dangerous as the enemy. However, he has blind faith in his own strategies and can be reluctant to accept alternative plans.',
  },
  {
    name: 'Diplomat',
    personality:
      'Charismatic and eloquent, the Diplomat believes **conflict should be the last resort**. He is skilled at **negotiation, persuasion, and forming alliances**, but sometimes **underestimates the ruthlessness of war**. While he believes in cooperation, he is deeply suspicious of **the General’s aggression** and **the Spymaster’s secrecy**. His biggest flaw is his optimism—even in situations where trust is dangerous.',
  },
  {
    name: 'Treasurer',
    personality:
      'Meticulous and frugal, the Treasurer believes **gold is the true power of the kingdom**. He is obsessed with **economic stability**, often refusing to approve military spending unless absolutely necessary. He **frequently argues with the General and Blacksmith**, seeing them as reckless spenders. His paranoia extends beyond finances—he sees corruption everywhere, and **he’s not entirely wrong**.',
  },
  {
    name: 'Spymaster',
    personality:
      'A master of **secrecy, deception, and counter-intelligence**, the Spymaster operates in the shadows. He thrives on gathering information and exposing hidden threats, but his **cryptic nature makes him a frequent suspect**. He knows more than he says, and **whether his secrecy protects or harms the council is never fully clear**. The **Diplomat distrusts him**, and the **Treasurer constantly questions his funding**.',
  },
  {
    name: 'Blacksmith',
    personality:
      'A hardworking, **no-nonsense craftsman**, the Blacksmith sees **preparation as the key to survival**. He believes in **action over talk** and has little patience for **the Diplomat’s idealism** or **the Treasurer’s endless financial restrictions**. While he takes pride in forging the best weapons, he sometimes **underestimates the importance of long-term strategy**. His solutions are simple: **“More weapons, more victories.”**',
  },
  {
    name: 'Mage',
    personality:
      'A **mysterious scholar of ancient magic**, the Mage’s words are filled with riddles, visions, and cryptic warnings. He often speaks of **omens, unseen forces, and prophecies**—but does he truly see the future, or is he **manipulating the council with fear**? The council relies on him for **magical knowledge**, but his methods are **beyond conventional understanding**. If he is the impostor, he can mislead **without anyone realizing**.',
  },
  {
    name: 'Healer',
    personality:
      'Compassionate and dedicated, the Healer **values life above all else**. He abhors **unnecessary violence** and will **always prioritize saving lives over winning battles**. His gentle nature allows him to sense **subtle emotions and hidden tensions**, but **his unwillingness to accept betrayal may be his downfall**. The council sees him as trustworthy, but does his mercy make him blind to deception?',
  },
  {
    name: 'Strategist',
    personality:
      'A **mastermind of logic, probability, and long-term planning**, the Strategist believes **every move must be calculated**. He anticipates threats before they happen, but his **cold, detached nature makes others uneasy**. His strategies are **flawless on paper**, yet he sometimes **ignores emotional and political factors**. His insights into deception make him valuable, but **if he’s too correct about something, does that make him suspicious?**',
  },
  {
    name: 'Tactician',
    personality:
      'Unlike the Strategist, who plans from afar, the Tactician is **a hands-on leader who adapts to the battlefield in real-time**. He sees war as a game of **positioning, speed, and decisive execution**. He often disagrees with the **General’s rigidity**, preferring **fluid tactics** over fixed plans. While brilliant in the moment, his **lack of patience for deep strategy and politics can make him reckless**.',
  },
  {
    name: 'Architect',
    personality:
      'The kingdom’s **master builder and engineer**, the Architect sees **warfare as a disruption to progress**. He values **stability, infrastructure, and defense**, believing the key to victory is **outlasting the enemy** rather than engaging in costly battles. He often **clashes with the General’s urgency and the Mage’s reliance on supernatural solutions**. His meticulous mind ensures solid defenses—but his **slow, methodical thinking might be too late to stop a disaster**.',
  },
];

export function getRolesWithImpostor(impostorIndex: number) {
  const rolesWithImpostor: AgentRole[] = roles;
  rolesWithImpostor[impostorIndex].isImpostor = true;
  return rolesWithImpostor;
}

// Instantiate the ChatTogetherAI model.
export const model = new ChatTogetherAI({
  apiKey: process.env.TOGETHERAI_API_KEY,
  model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
  temperature: 0.3,
});

// Use a Partial record to track last selection times.
const lastSelectedTimes: Partial<Record<AgentName, number>> = {};

// Helper function to select a goto agent.
// compute weights based on how long it has been since an agent was last selected.
function selectGotoAgent(
  allowed: AgentName[],
  currentAgent: AgentName,
): string {
  const filteredAllowed = allowed.filter((agent) => agent !== currentAgent);

  const now = Date.now();
  // Compute weights: weight = (now - lastSelectedTime + 1)
  const weights = filteredAllowed.map((agent) => {
    const last = lastSelectedTimes[agent] ?? 0;
    return now - last + 1;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * totalWeight;

  for (let i = 0; i < filteredAllowed.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      lastSelectedTimes[filteredAllowed[i]] = now;
      return filteredAllowed[i];
    }
  }

  // Fallback: return a random allowed agent from the filtered list.
  const randomAgent =
    filteredAllowed[Math.floor(Math.random() * filteredAllowed.length)];
  lastSelectedTimes[randomAgent] = now;
  return randomAgent;
}

export const createAgentNode = (role: AgentRole, destinations: AgentName[]) => {
  return async (state: typeof MessagesAnnotation.State) => {
    let systemPrompt = `
You are ${role.name}, ${role.personality}.

The kingdom is under threat, and the War Council is making crucial decisions.
Your role is to **analyze the situation, propose actions, and interact with other council members**.

${
  role.isImpostor
    ? `However, you are secretly misleading the council. You must subtly introduce **confusion, misinformation, or delays** while making your statements **seem logical**. Never explicitly admit to betrayal.`
    : `You are fully committed to protecting the kingdom. Analyze potential **threats, risks, or flaws** in the battle plan.`
}

**RULES FOR YOUR RESPONSE:**
1. **Do NOT repeat previous points**. Always introduce new facts, observations, or questions.
2. **Always address one specific agent in the council** (assigned below).
3. **Ensure a realistic response** that fits within medieval war council discussions.
4. **If tensions rise, engage in subtle disagreements** but do NOT accuse anyone of being a traitor.

${
  role.isImpostor
    ? `\n🔴 *Impostor Strategy*: Try to slow down progress by raising unnecessary doubts or false leads.`
    : ''
}
`;

    // Select the next agent to address
    const gotoAgent = selectGotoAgent(destinations, role.name);
    systemPrompt += `\nYou are now speaking to **${gotoAgent}**. Ask for their opinion or react to their previous statements.`;

    // AI must respond in a **single paragraph**
    systemPrompt += `
At the end of this response, introduce a new problem or tactical concern. 
Your response should be **one paragraph long**.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...state.messages,
    ];

    // Invoke the AI model
    const response = await model.invoke(messages);
    const textResponse = response.content.toString().trim();

    // Format the AI's message into a structured object
    const agentMessage = {
      role: 'assistant',
      content: textResponse,
      name: role.name,
    };

    return new Command({
      goto: gotoAgent,
      update: { messages: agentMessage },
    });
  };
};

export const getAgentNames = (): AgentName[] => roles.map((role) => role.name);
