import { useEffect, useState } from "react";
import io from "socket.io-client";
import scaffoldConfig from "~~/scaffold.config";

export interface Message {
  role: string;
  content: string;
  name: string;
}

export default function useConversationSocket() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [eliminatedAgents, setEliminatedAgents] = useState<string[]>([]);

  useEffect(() => {
    // Fetch initial messages from the REST API.
    fetch(`${scaffoldConfig.apiUrl}/conversation/messages`)
      .then(res => res.json())
      .then((initialMessages: Message[]) => {
        setMessages(initialMessages);
      })
      .catch(error => {
        console.error("Error fetching initial messages", error);
      });

    const socket = io(scaffoldConfig.apiUrl);
    socket.on("connect", () => {
      console.log("Connected to conversation socket");
    });
    socket.on("newMessage", (message: Message) => {
      setMessages(prev => [...prev, message]);
    });
    socket.on("agentEliminated", (agentName: string) => {
      setEliminatedAgents(prev => [...prev, agentName]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { messages, eliminatedAgents };
}
