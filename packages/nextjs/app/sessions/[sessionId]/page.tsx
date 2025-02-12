"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Agent {
  key: string;
  emoji: string;
  name: string;
}

interface Message {
  id: number;
  agent: string;
  content: string;
}

export default function SessionPage({ params }: { params: { sessionId: string } }) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setSelectedAgent(null);
      }
    }

    if (selectedAgent) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedAgent]);

  // Scroll to the latest message when the page loads
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const { data: latestSessionData, refetch: refetchLatestSession } = useScaffoldReadContract({
    contractName: "GameSession",
    functionName: "getGameSession",
    args: [BigInt(params.sessionId)],
    watch: true,
  });

  const { writeContractAsync: writeGameSessionAsync } = useScaffoldWriteContract({
    contractName: "GameSession",
  });

  const handleJoinSession = async (price: bigint) => {
    try {
      await writeGameSessionAsync({
        functionName: "joinGameSession",
        args: [BigInt(params.sessionId)],
        value: price,
      });
      refetchLatestSession();
    } catch (e) {
      console.error("Error joining session:", e);
    }
  };

  // Mock agent data
  const agents: Agent[] = [
    { key: "General", emoji: "🗡️", name: "The General" },
    { key: "Diplomat", emoji: "🤝", name: "The Diplomat" },
    { key: "Treasurer", emoji: "💰", name: "The Treasurer" },
    { key: "Spymaster", emoji: "🕵️", name: "The Spymaster" },
    { key: "Blacksmith", emoji: "🔨", name: "The Blacksmith" },
    { key: "Mage", emoji: "🔮", name: "The Mage" },
    { key: "Healer", emoji: "🩺", name: "The Healer" },
    { key: "Strategist", emoji: "📜", name: "The Strategist" },
    { key: "Tactician", emoji: "🗺️", name: "The Tactician" },
    { key: "Architect", emoji: "🏰", name: "The Architect" },
  ];

  // Mock messages
  const messages: Message[] = [
    { id: 1, agent: "General", content: "We must defend the capital at all costs! Our armies are ready." },
    {
      id: 2,
      agent: "Diplomat",
      content: "Our allies must be secured immediately. I will reach out to neighboring kingdoms.",
    },
    { id: 3, agent: "Treasurer", content: "The treasury must be safeguarded. We cannot afford reckless spending!" },
    {
      id: 4,
      agent: "Spymaster",
      content: "Our enemies lurk in the shadows. I have spies gathering intelligence as we speak.",
    },
    { id: 5, agent: "Blacksmith", content: "The forges are roaring! Weapons and armor will be ready soon." },
    { id: 6, agent: "Mage", content: "Dark forces stir... I fear ancient magics are at play." },
    { id: 7, agent: "Healer", content: "Wounded soldiers need aid. We must prepare medical supplies." },
    {
      id: 8,
      agent: "Strategist",
      content: "Every move must be carefully planned. I will devise our next course of action.",
    },
    { id: 9, agent: "Tactician", content: "Enemy positions have been scouted. I suggest an ambush at dawn." },
    {
      id: 10,
      agent: "Architect",
      content: "The city walls need reinforcement. If we are to withstand a siege, we must act quickly.",
    },
  ];

  if (!latestSessionData || !latestSessionData[0]) {
    return (
      <div className="flex items-center justify-center h-[86.7vh]">
        <h1 className="text-2xl font-bold">This session hasn’t been created yet.</h1>
      </div>
    );
  }

  const sessionName = latestSessionData[0];
  const maxPlayers = Number(latestSessionData[1]);
  const priceToJoin = Number(formatEther(latestSessionData[2]));
  const sessionStarted = latestSessionData[3];
  const sessionEnded = latestSessionData[4];
  const players: readonly string[] = latestSessionData[5];
  const prizePool = formatEther(latestSessionData[8]);

  return (
    <div className="flex min-h-[86.7vh]">
      {/* Sidebar */}
      <aside className="w-72 bg-base-100 dark:text-white p-4">
        <div className="space-y-4 mt-2">
          {agents.map(agent => (
            <div
              key={agent.key}
              className="flex items-center space-x-4 cursor-pointer"
              onClick={() => setSelectedAgent(agent)}
            >
              <Image
                className="rounded-full bg-white w-[60px] h-[60px]"
                width={60}
                height={60}
                src={`/agents/${agent.key}.webp`}
                alt={agent.name}
              />
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{agent.emoji}</span>
                <span className="text-lg">{agent.name}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="bg-base-100 rounded-lg p-6 m-4 min-w-full min-h-full max-h-full">
          <h1 className="dark:text-white text-2xl font-bold mb-4">{sessionName} Chat</h1>
          {!sessionStarted ? (
            <>
              <p className="text-lg font-semibold text-yellow-500">This session was created but has not started yet.</p>
              <p>
                Players ({players.length}/{maxPlayers}):
              </p>
              <ul className="list-disc pl-5">
                {players.map((player, index) => (
                  <li key={index}>{player}</li>
                ))}
              </ul>
              <p className="mt-4">Price to Join: {priceToJoin} ETH</p>
              <p className="-mt-2">Total Prize Pool: {prizePool} ETH</p>
              <button
                className="btn btn-primary rounded-xl px-8"
                onClick={() => handleJoinSession(latestSessionData[2])}
              >
                Join Session
              </button>
            </>
          ) : sessionEnded ? (
            <>
              <p className="text-lg font-semibold text-red-500">This session has ended.</p>
              <p>
                The impostor was: <span className="font-bold">{agents[Number(latestSessionData[6])].name}</span>
              </p>
              <p className="mt-2">Winners:</p>
              <ul className="list-disc pl-5 text-green-500">
                {latestSessionData[7].map((winner: string, index: number) => (
                  <li key={index}>{winner}</li>
                ))}
              </ul>
              <p className="mt-2">Losers:</p>
              <ul className="list-disc pl-5 text-red-500">
                {players
                  .filter(p => !latestSessionData[7].includes(p))
                  .map((loser, index) => (
                    <li key={index}>{loser}</li>
                  ))}
              </ul>
            </>
          ) : (
            <div ref={chatBoxRef} className="overflow-y-auto overflow-x-hidden max-h-[60vh] space-y-6 p-5">
              {messages.map(msg => (
                <div key={msg.id} className="relative flex justify-end">
                  <div className="bg-base-200 dark:text-white rounded-lg p-4 max-w-md relative">
                    <p>{msg.content}</p>
                    <div
                      className="cursor-pointer absolute -top-3 -right-3 rounded-full border border-primary bg-white"
                      style={{ width: "42px", height: "42px" }}
                      onClick={() => setSelectedAgent(agents.find(a => a.key === msg.agent) || null)}
                    >
                      <Image
                        className="rounded-full w-full h-full"
                        width={42}
                        height={42}
                        src={`/agents/${msg.agent}.webp`}
                        alt={msg.agent}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Modal for Selected Agent */}
      {selectedAgent && (
        <div className="modal modal-open fixed inset-0 z-50 flex items-center justify-center">
          <div ref={modalRef} className="modal-box relative max-w-5xl p-0">
            <button onClick={() => setSelectedAgent(null)} className="btn btn-sm btn-circle absolute right-2 top-2">
              ✕
            </button>
            <div className="flex">
              <div className="bg-gray-200 rounded-l-lg" style={{ width: "430px", height: "430px" }}>
                <Image
                  src={`/agents/${selectedAgent.key}.webp`}
                  alt={selectedAgent.name}
                  className="w-full h-full object-cover rounded-l-lg"
                  width={430}
                  height={430}
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white font-bold px-2 py-1 rounded">
                  {selectedAgent.name}
                </div>
              </div>
              <div
                className="p-4 flex flex-col justify-between bg-base-100"
                style={{ width: "592px", height: "430px" }}
              >
                <div className="overflow-auto pr-4">
                  {messages
                    .filter(msg => msg.agent === selectedAgent.key)
                    .map(msg => (
                      <p key={msg.id} className="dark:text-white mb-2">
                        {msg.content}
                      </p>
                    ))}
                </div>
                <div className="flex justify-end">
                  <button className="btn btn-primary px-8 uppercase">Vote</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
